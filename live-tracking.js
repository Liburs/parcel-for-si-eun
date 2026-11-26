(() => {
 const root=document.getElementById('live-parcel');if(!root)return;
 const t=(z,k)=>window.siteLanguage.pick(z,k),el=(tag,text,cls)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;};
 const date=v=>v&&Number.isFinite(Date.parse(v))?new Date(v).toLocaleString(window.siteLanguage.language==='ko'?'ko-KR':'zh-CN'):t('尚无记录','아직 기록이 없어요');
 function render(){
  const d=window.PARCEL_TRACKING||{},events=Array.isArray(d.events)?d.events:[];
  root.replaceChildren();const passport=el('section',null,'parcel-passport');passport.append(el('span','✉','passport-stamp'),el('p',t('寄件人 · liburs','보낸 사람 · liburs'),'eyebrow'),el('h3',t('上海 → 奉化','상하이 → 봉화')),el('p',t('给 SI EUN 的专属包裹','SI EUN을 위한 특별한 소포')),el('small',t('一封信 · 四份礼物 · 一场小小冒险','편지 한 통 · 네 가지 선물 · 작은 모험')));root.append(passport);root.append(el('p','SPECIAL DELIVERY • EMS','eyebrow'),el('h2',t('心意的每一步','마음이 닿기까지')));
  const row=el('div',null,'parcel-actions');row.append(el('code',d.number||'EB872529602CN'));
  const copy=el('button',t('复制单号','번호 복사'),'text-button');copy.onclick=async()=>{try{await navigator.clipboard.writeText(d.number||'EB872529602CN');copy.textContent=t('已复制','복사 완료');}catch{copy.textContent=t('请选中单号复制','번호를 선택해 복사하세요');}};row.append(copy);
  const refresh=el('button',t('刷新进度','기록 새로고침'),'text-button');refresh.onclick=async()=>{refresh.disabled=true;await window.refreshTracking();};row.append(refresh);root.append(row);
  const status=d.sync==='not_configured'?t('自动查询等待接通；尚未收到可核实的物流记录。','자동 조회 연결을 기다리고 있어요. 확인된 배송 기록은 아직 없어요.'):d.sync==='error'?t('暂时无法更新，保留最后确认的记录。','현재 갱신할 수 없어 마지막 확인 기록을 표시해요.'):!events.length?t('承运商尚未返回扫描记录。','배송 업체에서 아직 스캔 기록을 제공하지 않았어요.'):t('以下为承运商提供的扫描记录。','배송 업체에서 제공한 스캔 기록이에요.');
  const notice=el('p',status,'parcel-status');notice.setAttribute('role','status');root.append(notice);
  root.append(el('p',t('最近查询：','최근 조회: ')+date(d.checkedAt),'parcel-meta'));
  if(d.checkedAt&&Date.now()-Date.parse(d.checkedAt)>7200000)root.append(el('p',t('记录较旧，请通过查询入口核对最新进度。','기록이 오래되었어요. 조회 링크에서 최신 상태를 확인하세요.'),'parcel-status'));
  const links=el('div',null,'parcel-actions');for(const [title,url] of [[t('EMS 官方查询 ↗','EMS 공식 조회 ↗'),'https://www.ems.com.cn/queryLogistics'],[t('查询此单号 ↗','이 운송장 조회 ↗'),'https://trace.epost.go.kr/xtts/servlet/kpl.tts.common.svl.SttSVL?POST_CODE=EB872529602CN&target_command=kpl.tts.tt.epost.cmd.RetrieveEmsTraceEngCmd']]){const a=el('a',title,'text-button');a.href=url;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}root.append(links);
  const keepsakes=el('div',null,'parcel-keepsakes');for(const [symbol,z,k] of [['🐼','柔软的陪伴','포근한 친구'],['✦','古蜀的秘密','고대 촉의 비밀'],['☾','一夜好梦','편안한 꿈'],['❀','温柔的日常','다정한 일상']]){const card=el('div');card.append(el('span',symbol),el('strong',t(z,k)),el('small',t('等待你亲手打开','직접 열어 볼 순간을 기다려요')));keepsakes.append(card);}root.append(keepsakes);root.append(el('h3',t('沿途的消息','여정의 소식')));const list=el('ol',null,'parcel-timeline');events.forEach((e,i)=>{const li=el('li',null,i===0?'latest':'');li.append(el('time',date(e.time)),el('strong',e.city?t(e.city.zh,e.city.ko):t(e.officeZh||'物流扫描',e.officeKo||'배송 스캔')));if(window.siteLanguage.language==='ko'){li.append(el('p',e.descriptionKo||'배송 기록이 갱신되었어요. 아래에서 원문을 확인할 수 있어요.'));if(!e.descriptionKo){const details=el('details');details.append(el('summary','배송 업체 원문'),el('p',e.description||''));li.append(details);}}else li.append(el('p',e.description||''));if(e.original){const detail=el('details');detail.append(el('summary',t('承运商原文','배송 업체 원문')),el('p',e.original+' · '+e.location));li.append(detail);}list.append(li);});root.append(list);
  if(!events.length)root.append(el('div',t('📮 正在等候旅程中的第一条消息','📮 배송 여정의 첫 소식을 기다려요'),'parcel-empty'));
  root.append(el('p',t('地图依据物流扫描城市更新，连线仅连接扫描点，不代表实际运输路线。自动查询约每30分钟运行，可能延迟；本页每分钟读取最新结果。','지도는 배송 스캔 도시를 기준으로 갱신돼요. 연결선은 실제 운송 경로가 아니에요. 자동 조회는 약 30분 간격이며 지연될 수 있어요. 페이지는 매분 최신 결과를 읽어요.'),'parcel-meta'));
  const letter=el('div',null,'parcel-secret');letter.append(el('span','♡'),el('h3',t('最后一把钥匙，在纸质信封里','마지막 열쇠는 종이 편지 봉투 안에')),el('p',t('等你收到这份心意，再打开属于你的惊喜。准备好后，在下方输入信封里的密码。','마음을 담은 소포를 받으면 누나만의 선물을 열어 보세요. 준비가 되면 아래에 봉투 속 비밀번호를 입력해 주세요.')));root.append(letter);root.hidden=document.getElementById('tracking-panel').hidden;
 }
 window.addEventListener('tracking-updated',render);window.addEventListener('site-language-changed',render);
 new MutationObserver(()=>{root.hidden=document.getElementById('tracking-panel').hidden;}).observe(document.getElementById('tracking-panel'),{attributes:true,attributeFilter:['hidden']});render();
})();
