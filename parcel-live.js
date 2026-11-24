/* 解锁前的「物流实况」卡片（详细版）：阶段进度、承运商/单号/服务/清关、包裹重量/尺寸/内件、
   出发地/目的地/直线距离/预计到达、最新扫描与完整轨迹时间轴。
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
  const STAGE_ICON = { shanghai: '🏠', domestic: '🚚', transit: '✈️', korea: '🛬', delivery: '🛵', delivered: '💝' };
  const KIND_ICON = {
    picked: '🏷️', pickup: '🏷️', accept: '🏷️', depart: '🚚', transit: '🚚', flight: '✈️',
    arrive: '🛬', customs: '🛃', clear: '✅', delivery: '🛵', delivered: '💝', scan: '📦'
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

  const CUSTOMS_TEXT = {
    pending: ['待清关', '예정'],
    preparing: ['清关中', '진행 중'],
    cleared: ['已清关', '완료'],
    unknown: ['待确认', '확인 중']
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

  // 只保留纯文本并限制长度，所有内容都通过 textContent 写入，避免注入。
  function clean(value, max = 48) {
    return typeof value === 'string' ? value.replace(/[<>&"]/g, '').trim().slice(0, max) : '';
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

  function distanceKm(from, to) {
    if (!from || !to) return 0;
    if (![from.lat, from.lng, to.lat, to.lng].every(Number.isFinite)) return 0;
    const rad = Math.PI / 180;
    const dLat = (to.lat - from.lat) * rad, dLng = (to.lng - from.lng) * rad;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(from.lat * rad) * Math.cos(to.lat * rad) * Math.sin(dLng / 2) ** 2;
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  // 预计到达还有几天（按本地日历日计算）。
  function daysLeft(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (Number.isNaN(target.getTime())) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - today) / 86400000);
  }

  function contentsOf(cargo, data) {
    const raw = Array.isArray(cargo.contents) ? cargo.contents : (typeof cargo.contents === 'string' ? [cargo.contents] : (typeof data.contents === 'string' ? [data.contents] : []));
    return raw.map(item => {
      if (item && typeof item === 'object') return { zh: clean(item.zh || item.ko, 60), ko: clean(item.ko || item.zh, 60) };
      const text = clean(item, 60);
      return { zh: text, ko: text };
    }).filter(item => item.zh || item.ko).slice(0, 4);
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
    const cargo = data.cargo && typeof data.cargo === 'object' ? data.cargo : {};
    const origin = placeOf(data.origin) || KNOWN.shanghai;
    const destination = placeOf(data.destination) || KNOWN.delivery;
    const stageIndex = Math.max(0, STAGES.indexOf(stage));
    return {
      stage,
      stageIndex,
      carrier: clean(data.carrier, 40) || 'EMS',
      carrierKo: clean(data.carrierKo, 40),
      service: clean(data.service, 48),
      serviceKo: clean(data.serviceKo || data.service, 48),
      number: clean(data.number, 40),
      origin,
      destination,
      eta: typeof data.eta === 'string' ? data.eta : '',
      customs: CUSTOMS_TEXT[data.customs] ? data.customs : '',
      weight: clean(cargo.weight || data.weight, 24),
      dimensions: clean(cargo.dimensions || data.dimensions, 32),
      contents: contentsOf(cargo, data),
      distance: distanceKm(origin, destination),
      state: STATE_TEXT[data.state] ? data.state : (stage === 'delivered' ? 'delivered' : 'in_transit'),
      updatedAt: data.updatedAt || (latest && latest.time) || '',
      checkedAt: data.checkedAt || '',
      sync: typeof data.sync === 'string' ? data.sync : '',
      events,
      latest,
      latestCity,
      progress: Math.round(stageIndex / (STAGES.length - 1) * 100)
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
      <div class="live-hero" id="live-hero"></div>
      <div class="live-scan-card" id="live-scan-card"></div>
      <div class="live-groups" id="live-groups"></div>
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

  /* ---------- 顶部：阶段 + 进度 ---------- */
  function renderHero() {
    const hero = $('#live-hero', root);
    hero.replaceChildren();

    const top = document.createElement('div');
    top.className = 'live-hero-top';
    const pulse = document.createElement('i');
    pulse.className = 'live-pulse';
    const name = document.createElement('strong');
    name.className = 'live-stage-name';
    name.textContent = t(...STAGE_TEXT[config.stage]);
    const badge = document.createElement('span');
    badge.className = 'live-state state-' + config.state;
    badge.textContent = t(...STATE_TEXT[config.state]);
    top.append(pulse, name, badge);

    const line = document.createElement('p');
    line.className = 'live-hero-line';
    const route = [t(config.origin.zh, config.origin.ko)];
    if (config.latestCity) {
      const city = t(config.latestCity.zh, config.latestCity.ko);
      if (city && city !== route[0]) route.push(city);
    }
    const last = t(config.destination.zh, config.destination.ko);
    if (route[route.length - 1] !== last) route.push(last);
    line.textContent = route.join(' → ');

    const progress = document.createElement('div');
    progress.className = 'live-progress';
    const track = document.createElement('div');
    track.className = 'live-progress-track';
    const fill = document.createElement('i');
    fill.className = 'live-progress-fill';
    fill.style.width = config.progress + '%';
    const plane = document.createElement('span');
    plane.className = 'live-progress-plane';
    plane.textContent = config.progress >= 100 ? '💝' : '✈️';
    plane.style.left = 'clamp(11px, ' + config.progress + '%, calc(100% - 11px))';
    track.append(fill, plane);
    progress.append(track);

    const meta = document.createElement('div');
    meta.className = 'live-progress-meta';
    const steps = document.createElement('span');
    steps.textContent = (config.stageIndex + 1) + ' / ' + STAGES.length + ' ' + t('阶段', '단계');
    const right = document.createElement('span');
    const left = config.eta ? daysLeft(config.eta) : null;
    if (left !== null) {
      right.textContent = left > 0 ? 'D-' + left : left === 0 ? 'D-DAY' : t('已超过预计日期', '예상일 지남');
    } else {
      right.textContent = config.progress + '%';
    }
    meta.append(steps, right);

    hero.append(top, line, progress, meta);
  }

  /* ---------- 详细字段 ---------- */
  function fact(icon, term, value, wide) {
    const row = document.createElement('div');
    row.className = 'live-fact' + (wide ? ' is-wide' : '');
    const dt = document.createElement('dt');
    const ico = document.createElement('span');
    ico.className = 'live-fact-ico';
    ico.textContent = icon;
    const label = document.createElement('span');
    label.textContent = term;
    dt.append(ico, label);
    const dd = document.createElement('dd');
    if (value instanceof Node) dd.append(value); else dd.textContent = value;
    row.append(dt, dd);
    return row;
  }

  function group(title, rows) {
    const wrap = document.createElement('section');
    wrap.className = 'live-group';
    const head = document.createElement('h4');
    head.textContent = title;
    const list = document.createElement('dl');
    list.className = 'live-facts';
    rows.filter(Boolean).forEach(row => list.append(row));
    wrap.append(head, list);
    return wrap;
  }

  function numberCell() {
    const wrap = document.createElement('span');
    wrap.className = 'live-number-row';
    const number = document.createElement('span');
    number.className = 'live-number';
    number.textContent = config.number || t('等待承运商提供单号', '운송장 번호 대기 중');
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
    wrap.append(number, copy);
    if (config.number) {
      const link = document.createElement('a');
      link.className = 'live-track-link';
      link.href = 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=' + encodeURIComponent(config.number);
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = t('查询', '조회') + ' ↗';
      link.setAttribute('aria-label', t('在韩国邮政查询这个运单号', '대한민국 우정에서 운송장 조회'));
      wrap.append(link);
    }
    return wrap;
  }

  function contentsCell() {
    const list = document.createElement('ul');
    list.className = 'live-contents';
    config.contents.forEach(item => {
      const li = document.createElement('li');
      li.textContent = t(item.zh, item.ko);
      list.append(li);
    });
    return list;
  }

  function etaCell() {
    const wrap = document.createElement('span');
    wrap.className = 'live-eta';
    const date = document.createElement('span');
    date.textContent = config.eta ? fmt(config.eta, true) : t('待确认', '확인 중');
    wrap.append(date);
    const left = daysLeft(config.eta);
    if (left !== null) {
      const chip = document.createElement('span');
      chip.className = 'live-dday';
      chip.textContent = left > 0 ? 'D-' + left : left === 0 ? 'D-DAY' : t('已超过', '지남');
      wrap.append(chip);
    }
    return wrap;
  }

  function renderGroups() {
    const host = $('#live-groups', root);
    host.replaceChildren();
    const carrier = document.createElement('span');
    carrier.className = 'live-carrier';
    carrier.textContent = t(config.carrier, config.carrierKo || config.carrier);

    const customs = config.customs ? t(...CUSTOMS_TEXT[config.customs]) : '';
    const distance = config.distance ? (isKo() ? '약 ' + config.distance + ' km' : '约 ' + config.distance + ' 公里') : '';

    host.append(
      group(t('物流信息', '배송 정보'), [
        config.carrier ? fact('🚚', t('承运商', '운송사'), carrier) : null,
        config.number ? fact('🔖', t('运单号', '운송장'), numberCell()) : null,
        config.service ? fact('⚡', t('服务类型', '서비스'), t(config.service, config.serviceKo)) : null,
        customs ? fact('🛃', t('清关状态', '통관'), customs) : null
      ]),
      group(t('包裹信息', '소포 정보'), [
        config.weight ? fact('⚖️', t('重量', '중량'), config.weight) : null,
        config.dimensions ? fact('📐', t('尺寸', '크기'), config.dimensions) : null,
        config.contents.length ? fact('🎁', t('内件', '내용물'), contentsCell(), true) : null
      ]),
      group(t('行程信息', '여정 정보'), [
        fact('📍', t('出发地', '출발지'), t(config.origin.zh, config.origin.ko)),
        fact('🏡', t('目的地', '도착지'), t(config.destination.zh, config.destination.ko)),
        distance ? fact('📏', t('直线距离', '직선거리'), distance) : null,
        fact('📅', t('预计到达', '예상 도착'), etaCell())
      ])
    );
  }

  /* ---------- 最新扫描 ---------- */
  function renderScan() {
    const host = $('#live-scan-card', root);
    host.replaceChildren();
    const ico = document.createElement('span');
    ico.className = 'live-scan-ico';

    if (config.latest && config.latest.time) {
      ico.textContent = '📍';
      const body = document.createElement('div');
      const head = document.createElement('strong');
      head.textContent = t('最新扫描', '최근 스캔');
      const line = document.createElement('p');
      const city = config.latestCity ? t(config.latestCity.zh, config.latestCity.ko) : '';
      line.textContent = fmt(config.latest.time) + (city ? ' · ' + city : '');
      const note = document.createElement('small');
      const text = t(config.latest.zh || config.latest.text || '', config.latest.ko || config.latest.text || '');
      note.textContent = text || t('城市级近似位置，非 GPS 定位', '도시 단위의 대략적인 위치이며 GPS가 아니에요');
      body.append(head, line, note);
      host.append(ico, body);
      return;
    }

    ico.textContent = '📡';
    const body = document.createElement('div');
    const head = document.createElement('strong');
    head.textContent = t('尚未收到扫描记录', '아직 스캔 기록이 없어요');
    const line = document.createElement('p');
    line.textContent = t('承运商揽收后，这里会显示第一条实时轨迹。', '운송사가 집하하면 첫 번째 실시간 기록이 여기에 표시돼요.');
    const note = document.createElement('small');
    note.textContent = t('下方为按阶段的预计行程，以承运商实际更新为准。', '아래는 단계별 예상 여정이며 실제 기록에 따라 달라져요.');
    body.append(head, line, note);
    host.append(ico, body);
  }

  /* ---------- 时间轴 ---------- */
  function timelineRow(item, kind) {
    const li = document.createElement('li');
    li.className = kind;
    const ico = document.createElement('span');
    ico.className = 'live-ico';
    ico.textContent = item.icon || '📦';
    const time = document.createElement('time');
    // 有真实时间就显示时间；没有时按阶段给出「已过 / 现在 / 预计」，避免「现在 当前」重复。
    time.textContent = item.time
      ? fmt(item.time)
      : kind === 'is-current' ? t('现在', '지금') : kind === 'is-done' ? t('已过', '지난 단계') : t('预计', '예정');
    const text = document.createElement('p');
    const label = t(item.zh, item.ko);
    const place = item.city ? t(item.city.zh, item.city.ko) : '';
    const duplicated = place && (label.includes(place) || label.includes(item.city.zh) || label.includes(item.city.ko));
    text.textContent = place && !duplicated ? label + ' · ' + place : label;
    if (kind === 'is-current' && item.time) {
      const tag = document.createElement('span');
      tag.className = 'live-now';
      tag.textContent = t('当前', '현재');
      time.append(' ', tag);
    }
    li.append(ico, time, text);
    return li;
  }

  function iconForKind(kind) {
    if (!kind) return '📦';
    return KIND_ICON[String(kind).toLowerCase()] || '📦';
  }

  function renderTimeline() {
    const list = $('#live-timeline', root);
    const more = $('#live-more', root);
    list.replaceChildren();

    if (config.events.length) {
      const events = config.events.map(e => ({
        time: e.time,
        city: cityOf(e),
        zh: e.zh || e.text || '',
        ko: e.ko || e.text || '',
        icon: iconForKind(e.kind)
      }));
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
        ko: STAGE_TEXT[key][1],
        icon: STAGE_ICON[key]
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
    renderHero();
    renderGroups();
    renderScan();
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
