/* 解锁前的「物流实况」卡片：承运商/运单号、当前状态、路线、最新扫描、预计到达与轨迹时间轴。
   数据只读 window.PARCEL_TRACKING（tracking.js 每分钟从 tracking.json 刷新），不改动其它模块的 DOM。
   地图由页面顶部的 map.js 负责，本卡片不再重复画地图。 */
(() => {
  const root = document.getElementById('live-parcel');
  if (!root) return;

  const $ = (sel, el = root) => el.querySelector(sel);
  const isKo = () => (window.siteLanguage?.language || 'ko') === 'ko';
  const t = (zh, ko) => (window.siteLanguage?.pick ? window.siteLanguage.pick(zh, ko) : isKo() ? ko : zh);

  const STAGES = ['shanghai', 'domestic', 'transit', 'korea', 'delivery', 'delivered'];
  const STAGE_TEXT = {
    shanghai: ['上海', '상하이'],
    domestic: ['中国境内运输', '중국 내 운송'],
    transit: ['国际运输中', '국제 운송 중'],
    korea: ['已到韩国', '한국 도착'],
    delivery: ['前往奉化', '봉화로 이동 중'],
    delivered: ['已送达', '배송 완료']
  };

  // 这些坐标只用于地图与路线示意，不是 GPS 定位。
  const KNOWN = {
    shanghai: { zh: '上海', ko: '상하이', lat: 31.2304, lng: 121.4737 },
    domestic: { zh: '中国境内', ko: '중국 국내', lat: 31.6, lng: 121.2 },
    transit: { zh: '黄海', ko: '황해', lat: 34.4, lng: 125.1 },
    korea: { zh: '仁川', ko: '인천', lat: 37.4563, lng: 126.7052 },
    delivery: { zh: '奉化郡', ko: '봉화군', lat: 36.8931, lng: 128.7324 },
    delivered: { zh: '奉化郡', ko: '봉화군', lat: 36.8931, lng: 128.7324 }
  };

  const STATE_TEXT = {
    pending: ['待寄出', '발송 대기'],
    label_created: ['已建立运单', '운송장 등록'],
    in_transit: ['运输中', '배송 중'],
    awaiting_data: ['等待轨迹', '조회 대기'],
    attention: ['延误 / 异常', '지연 · 예외'],
    location_unknown: ['位置待确认', '위치 확인 중'],
    pickup: ['待领取', '수령 대기'],
    customs: ['清关中', '통관 중'],
    delivered: ['已送达', '배송 완료']
  };

  let config = null;
  let expanded = false;
  let mounted = false;
  const stamp = () => (config ? Date.parse(config.checkedAt) || Date.parse(config.updatedAt) || 0 : 0);

  const fmt = (value, dateOnly) => {
    if (!value) return '';
    let date;
    if (dateOnly && /^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      const [year, month, day] = String(value).split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(value);
    }
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(isKo() ? 'ko-KR' : 'zh-CN', dateOnly
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
  };

  function Safe(value) {
    return typeof value === 'string' ? value.replace(/[<>&"]/g, '').trim().slice(0, 40) : '';
  }

  function cityOf(event) {
    if (!event) return null;
    if (typeof event.city === 'string') {
      const known = KNOWN[event.city];
      if (known) return known;
    }
    const city = event.city && typeof event.city === 'object' ? event.city : {};
    const lat = Number(event.lat ?? city.lat), lng = Number(event.lng ?? city.lng);
    const zh = event.cityZh || city.zh || city.nameZh || (typeof event.city === 'string' ? event.city : '');
    const ko = event.cityKo || city.ko || city.nameKo || (typeof event.city === 'string' ? event.city : '');
    if (!zh && !ko && !Number.isFinite(lat)) return null;
    return { zh: zh || ko, ko: ko || zh, lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null };
  }

  // data.origin / data.destination 是「地点对象」；event.city 是「事件的扫描地点」，两者结构不同。
  function placeOf(value) {
    if (!value) return null;
    if (typeof value === 'string') return KNOWN[value] || null;
    const lat = Number(value.lat), lng = Number(value.lng);
    const zh = value.zh || value.nameZh || '';
    const ko = value.ko || value.nameKo || '';
    if (!zh && !ko) return null;
    return { zh: zh || ko, ko: ko || zh, lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null };
  }

  function normalize(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    const stage = STAGES.includes(data.stage) ? data.stage : 'shanghai';
    const events = (Array.isArray(data.events) ? data.events : [])
      .filter(e => e && (e.time || e.zh || e.ko || e.text || e.city))
      .slice()
      .sort((a, b) => (Date.parse(b.time) || 0) - (Date.parse(a.time) || 0));
    const latest = events[0] || null;
    const latestCity = cityOf(latest);
    return {
      stage,
      stageIndex: Math.max(0, STAGES.indexOf(stage)),
      carrier: typeof data.carrier === 'string' && data.carrier.trim() ? data.carrier.trim().slice(0, 40) : 'EMS',
      carrierKo: typeof data.carrierKo === 'string' ? data.carrierKo.trim().slice(0, 40) : '',
      number: Safe(data.number),
      origin: placeOf(data.origin) || KNOWN.shanghai,
      destination: placeOf(data.destination) || KNOWN.delivery,
      eta: typeof data.eta === 'string' ? data.eta : '',
      sync: typeof data.sync === 'string' ? data.sync : '',
      state: STATE_TEXT[data.state] ? data.state : (stage === 'delivered' ? 'delivered' : 'in_transit'),
      updatedAt: data.updatedAt || (latest && latest.time) || '',
      checkedAt: data.checkedAt || '',
      events,
      latest,
      latestCity
    };
  }

  function relative(ts) {
    if (!ts) return t('尚未更新', '아직 갱신 전');
    const diff = Math.max(0, Date.now() - ts);
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('刚刚更新', '방금 갱신');
    if (minutes < 60) return t(minutes + ' 分钟前更新', minutes + '분 전 갱신');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t(hours + ' 小时前更新', hours + '시간 전 갱신');
    return t(Math.floor(hours / 24) + ' 天前更新', Math.floor(hours / 24) + '일 전 갱신');
  }

  function mount() {
    if (mounted) return;
    mounted = true;
    root.innerHTML = `
      <div class="live-head">
        <div class="live-head-main">
          <span class="live-live"><i></i>${t('实时物流', '실시간 배송')}</span>
          <h2 class="live-title">${t('包裹现在到哪儿了', '지금 어디쯤일까요')}</h2>
        </div>
        <div class="live-head-meta">
          <span class="live-updated" id="live-updated"></span>
          <button type="button" class="live-refresh" id="live-refresh">↻ <span class="live-refresh-label">${t('刷新', '새로고침')}</span></button>
        </div>
      </div>
      <dl class="live-grid" id="live-grid"></dl>
      <h3 class="live-sub" id="live-sub"></h3>
      <ol class="live-timeline" id="live-timeline"></ol>
      <button type="button" class="live-more" id="live-more" hidden></button>
      <p class="live-source" id="live-source"></p>`;
    $('#live-refresh', root).onclick = () => {
      const button = $('#live-refresh', root);
      button.classList.add('is-busy');
      Promise.resolve(window.refreshTracking?.()).finally(() => setTimeout(() => button.classList.remove('is-busy'), 700));
    };
    $('#live-refresh', root).setAttribute('aria-label', t('刷新物流信息', '배송 정보 새로고침'));
    $('#live-more', root).onclick = () => { expanded = !expanded; renderTimeline(); };
  }

  function cell(term, body, extra) {
    const wrap = document.createElement('div');
    wrap.className = 'live-cell' + (extra ? ' ' + extra : '');
    const dt = document.createElement('dt');
    dt.textContent = term;
    const dd = document.createElement('dd');
    if (body instanceof Node) dd.append(body); else dd.textContent = body || '—';
    wrap.append(dt, dd);
    return wrap;
  }

  function renderGrid() {
    const grid = $('#live-grid', root);
    grid.replaceChildren();

    const numberLine = document.createElement('span');
    numberLine.className = 'live-number';
    numberLine.textContent = config.number || t('等待承运商提供单号', '운송장 번호 대기 중');
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'live-copy';
    copy.title = t('复制单号', '운송장 번호 복사');
    copy.setAttribute('aria-label', t('复制单号', '운송장 번호 복사'));
    copy.textContent = '⧉';
    copy.disabled = !config.number;
    copy.onclick = async () => {
      const done = () => { copy.textContent = '✓'; setTimeout(() => (copy.textContent = '⧉'), 1400); };
      try {
        await navigator.clipboard.writeText(config.number);
        done();
      } catch {
        try {
          const area = document.createElement('textarea');
          area.value = config.number;
          area.setAttribute('readonly', '');
          area.style.position = 'fixed';
          area.style.opacity = '0';
          document.body.append(area);
          area.select();
          document.execCommand('copy');
          area.remove();
          done();
        } catch { copy.textContent = '！'; setTimeout(() => (copy.textContent = '⧉'), 1400); }
      }
    };
    const numberWrap = document.createElement('span');
    numberWrap.className = 'live-number-cell';
    const carrier = document.createElement('span');
    carrier.className = 'live-carrier';
    carrier.textContent = t(config.carrier, config.carrierKo || config.carrier);
    const numberRow = document.createElement('span');
    numberRow.className = 'live-number-row';
    numberRow.append(numberLine, copy);
    numberWrap.append(carrier, numberRow);

    const badge = document.createElement('span');
    badge.className = 'live-state state-' + config.state;
    badge.textContent = t(...STATE_TEXT[config.state]);

    const routeLine = document.createElement('span');
    routeLine.className = 'live-route';
    routeLine.textContent = t(config.origin.zh, config.origin.ko) + ' → ' + t(config.destination.zh, config.destination.ko);

    const scan = document.createElement('span');
    scan.className = 'live-scan';
    if (config.latest && config.latest.time) {
      const place = config.latestCity ? t(config.latestCity.zh, config.latestCity.ko) : '';
      scan.textContent = fmt(config.latest.time) + (place ? ' · ' + place : '');
    } else if (config.updatedAt) {
      scan.textContent = fmt(config.updatedAt);
    } else {
      scan.textContent = t('等待承运商更新轨迹', '배송 기록 갱신 대기');
      scan.classList.add('is-muted');
    }

    grid.append(
      cell(t('承运商 · 单号', '운송사 · 운송장'), numberWrap, 'wide'),
      cell(t('当前状态', '현재 상태'), badge),
      cell(t('路线', '경로'), routeLine),
      cell(t('最新扫描', '최근 스캔'), scan),
      cell(t('预计到达', '예상 도착'), config.eta ? fmt(config.eta, true) : t('待确认', '확인 중'))
    );
  }

  function timelineRow(item, kind) {
    const li = document.createElement('li');
    li.className = kind;
    const time = document.createElement('time');
    // 有真实时间就显示时间；没有时按阶段给出「已过 / 现在 / 预计」，避免出现「现在 当前」这类重复。
    time.textContent = item.time
      ? fmt(item.time)
      : kind === 'is-current' ? t('现在', '지금') : kind === 'is-done' ? t('已过', '지난 단계') : t('预计', '예정');
    const text = document.createElement('p');
    const label = t(item.zh, item.ko);
    const place = item.city ? t(item.city.zh, item.city.ko) : '';
    const duplicated = place && (label.includes(place) || label.includes(item.city.zh) || label.includes(item.city.ko));
    text.textContent = place && !duplicated ? label + ' · ' + place : label;
    // 只有带真实扫描时间的当前节点才加「当前」小标签。
    if (kind === 'is-current' && item.time) {
      const tag = document.createElement('span');
      tag.className = 'live-now';
      tag.textContent = t('当前', '현재');
      time.append(' ', tag);
    }
    li.append(time, text);
    return li;
  }

  function renderTimeline() {
    const list = $('#live-timeline', root);
    const more = $('#live-more', root);
    list.replaceChildren();

    if (config.events.length) {
      const events = config.events.map(e => ({ time: e.time, city: cityOf(e), zh: e.zh || e.text || '', ko: e.ko || e.text || '' }));
      $('#live-sub', root).textContent = t('实时轨迹 · ' + events.length + ' 条记录', '실시간 배송 기록 · ' + events.length + '건');
      events.slice(0, expanded ? events.length : 4).forEach((item, i) => {
        list.append(timelineRow(item, i === 0 ? 'is-current' : 'is-done'));
      });
      more.hidden = events.length <= 4;
      more.textContent = expanded ? t('收起', '접기') : t('查看全部 ' + events.length + ' 条', '전체 ' + events.length + '건 보기');
      return;
    }

    // 还没有真实轨迹时，展示当前阶段附近的预计节点，可展开全部，避免空白。
    $('#live-sub', root).textContent = t('预计物流节点 · 以承运商实际更新为准', '예상 배송 단계 · 실제 기록에 따라 갱신돼요');
    const rows = STAGES.map((key, i) => ({ key, i }));
    const start = Math.max(0, Math.min(config.stageIndex - 1, STAGES.length - 3));
    const visible = expanded ? rows : rows.slice(start, start + 3);
    visible.forEach(({ key, i }) => {
      const kind = i === config.stageIndex ? 'is-current' : i < config.stageIndex ? 'is-done' : 'is-future';
      list.append(timelineRow({
        time: i === config.stageIndex ? config.updatedAt : '',
        zh: STAGE_TEXT[key][0],
        ko: STAGE_TEXT[key][1]
      }, kind));
    });
    more.hidden = rows.length <= 3;
    more.textContent = expanded ? t('收起', '접기') : t('查看全部 ' + rows.length + ' 个阶段', '전체 ' + rows.length + '단계 보기');
  }

  function renderSource() {
    let note = t(
      '数据每 60 秒自动刷新 · 地图上的位置为阶段示意，并非 GPS',
      '60초마다 자동 새로고침 · 지도의 위치는 단계별 표시이며 GPS가 아니에요'
    );
    if (config.sync === 'error') {
      note += t(
        ' · 暂时无法获取最新物流，显示上次记录',
        ' · 지금은 최신 배송 정보를 불러오지 못해 마지막 기록을 표시해요'
      );
    }
    $('#live-source', root).textContent = note;
  }

  /* ---------- 渲染 ---------- */
  function render() {
    mount();
    $('#live-updated', root).textContent = relative(stamp());
    renderGrid();
    renderTimeline();
    renderSource();
    const panel = document.getElementById('tracking-panel');
    root.hidden = !!(panel && panel.hidden);
  }

  function apply() {
    config = normalize(window.PARCEL_TRACKING);
    render();
  }

  function init() {
    apply();
    // tracking.js 每次拉取都会广播，这里跟随刷新。
    window.addEventListener('tracking-updated', () => apply());
    window.addEventListener('site-language-changed', () => {
      if (!config) return;
      // 文案重新生成；结构不变，不需要销毁地图。
      mounted = false;
      root.replaceChildren();
      render();
    });
    setInterval(() => {
      if (config && !root.hidden) $('#live-updated', root).textContent = relative(stamp());
    }, 30000);
    // 解锁动画播放时隐藏本卡片，避免和旅程动画互相干扰。
    const panel = document.getElementById('tracking-panel');
    if (panel) {
      const sync = () => { root.hidden = !!panel.hidden; };
      new MutationObserver(sync).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
      sync();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
