const $ = s => document.querySelector(s);
const gifts = [
 {name:'花花熊猫挂件',ko:'판다 화화 키링',img:'panda.jpg',zh:'软软的、可爱极了！希望花花替我陪着你，为你的日常增添一点好心情。',kr:'보들보들하고 정말 귀여운 화화가 저 대신 누나 곁에서 작은 즐거움을 전해 주길 바라요.'},
 {name:'古韵檀木梳',ko:'고전적인 멋의 나무 빗',img:'comb.jpg',zh:'漂亮的纹理里，藏着一份温柔的心意。希望每次梳头时，都是属于你的放松时刻。',kr:'예쁜 나뭇결 속에 작은 마음을 담았어요. 머리를 빗을 때마다 편안한 시간을 보냈으면 좋겠어요.'},
 {name:'三星堆发光冰箱贴',ko:'싼싱두이 조명 자석',img:'magnet.jpg',zh:'来自三星堆的神秘与浪漫，化成冰箱上的一束小小灯光。希望也能为你点亮好心情。',kr:'싼싱두이의 신비로운 매력을 작은 불빛에 담았어요. 누나의 기분도 환하게 밝혀 주면 좋겠어요.'},
 {name:'青铜纵目面具眼罩',ko:'청동 가면 수면 안대',img:'mask.jpg',zh:'把古老的文化变成可爱的日常。戴上这副特别的眼罩，好好睡一觉，做个甜甜的梦。',kr:'오래된 문화를 귀여운 일상 소품으로 만났어요. 이 특별한 안대를 쓰고 푹 쉬어요. 좋은 꿈 꿔요!'},
 {name:'我爱吃的中国饼干',ko:'제가 좋아하는 중국 과자',emoji:'🍪',zh:'想把自己喜欢的味道分享给你。尝过以后，记得告诉我你最喜欢哪一种哦！',kr:'제가 좋아하는 맛을 누나와 나누고 싶었어요. 먹어 보고 어떤 게 가장 맛있었는지 알려 줘요!'},
 {name:'香香脆脆的坚果',ko:'고소하고 바삭한 견과류',emoji:'🥜',zh:'给忙碌的日常加一点香香脆脆的小快乐，休息的时候慢慢享用吧。',kr:'바쁜 일상에 고소하고 바삭한 즐거움을 더해 봐요. 쉬는 시간에 천천히 즐겨 주세요.'},
 {name:'微辣魔芋爽',ko:'살짝 매콤한 곤약 간식',emoji:'🌶️',zh:'Spicy Konjac Snack！中国很受欢迎的小零食。可以尝一点点，觉得辣也不用勉强哦。',kr:'중국에서 인기 있는 Spicy Konjac Snack이에요! 조금 맛봐도 좋아요. 너무 맵다면 무리하지 말아요.'}
];
// Each paragraph has a matching translation for the side-by-side reading mode.
const letter = [
 ['亲爱的 SI EUN 姐姐：','사랑하는 SI EUN 누나에게,'],
 ['你好呀！先送上一份来自中国的问候与温暖，也想为这份礼物迟迟没能寄出，认真地向你说声抱歉。让你久等啦！','누나, 안녕하세요! 먼저 중국에서 따뜻한 안부를 전해요. 그리고 선물을 보내는 일이 많이 늦어져서 정말 미안해요. 오래 기다리게 했죠?'],
 ['能认识你，我真的很开心。明明相隔几千公里，我们却有缘相识，还能常常交流、分享生活。这份跨越距离的情谊，对我来说格外珍贵。','누나를 알게 되어 정말 기뻐요. 수천 킬로미터나 떨어져 있는데도 이렇게 인연이 닿아 자주 연락하고 일상을 나눌 수 있다는 게 참 신기하고 소중해요. 멀리 떨어져 있어도 이어지는 이 인연이 저에게는 정말 특별하답니다.'],
 ['上次收到你寄来的礼物时，我开心了好久！有韩国的零食、韩国品牌的围巾，还有那个大红色的 Mac 电脑保护包，每一样都让我感受到了你的用心。这是我第一次收到来自国外的礼物，而寄来礼物的人，恰好就是远在韩国的你，所以这份惊喜也变得更加特别。被姐姐惦记着的感觉，真的很温暖！','지난번 누나가 보내 준 선물을 받고 얼마나 기뻤는지 몰라요! 한국 과자와 한국 브랜드의 목도리, 그리고 선명한 빨간색 맥북 파우치까지, 하나하나에서 누나의 정성이 느껴졌어요. 외국에서 선물을 받아 본 건 처음이었는데, 그 선물을 보내 준 사람이 바로 한국에 있는 누나라서 더욱 특별했어요. 누나가 저를 생각해 주고 있다는 게 느껴져서 마음이 정말 따뜻해졌어요. 역시 우리 누나 최고예요!'],
 ['这一次，我也为你准备了一份礼物，想把我喜欢的味道，还有一些来自中国的可爱与美好，一起送到你身边。','이번에는 저도 누나를 위해 선물을 준비했어요. 제가 좋아하는 맛과 중국의 귀엽고 아름다운 것들을 누나에게도 전해 주고 싶었거든요.'],
 ['包裹里有我爱吃的中国饼干、一些坚果，还有微辣的魔芋爽，英文叫作 “Spicy Konjac Snack”。这是在中国很受欢迎的小零食，如果你愿意尝试一点点辣味，可以尝尝看；如果觉得辣，也不用勉强哦！等你尝过这些零食，记得和我分享感受，我很想知道你最喜欢哪一样。','상자 안에는 제가 좋아하는 중국 과자와 견과류, 그리고 살짝 매콤한 곤약 간식인 ‘모위솽’이 들어 있어요. 영어로는 “Spicy Konjac Snack”이라고 해요. 중국에서 많은 사람들이 즐겨 먹는 간식이랍니다. 살짝 매운맛에 도전해 보고 싶다면 조금 맛봐 주세요. 혹시 너무 맵게 느껴지면 무리해서 먹지는 말고요! 간식을 먹어 보고 어땠는지 꼭 이야기해 줘요. 누나가 어떤 걸 가장 좋아할지 정말 궁금해요.'],
 ['除了零食，我还挑选了来自四川成都大熊猫繁育研究基地，以及三星堆的官方纪念品。它们各有特色，也藏着我想与你分享的一点中国文化。','간식 외에도 쓰촨성 청두의 판다 번식 연구기지와 싼싱두이의 공식 기념품들을 골라 봤어요. 저마다의 매력이 있고, 누나에게 소개해 주고 싶은 중국 문화도 조금씩 담겨 있답니다.'],
 ['首先，是以大熊猫“花花”为原型的毛绒挂件，软软的、可爱极了，希望它能为你的日常增添一点好心情。','첫 번째는 판다 ‘화화’를 본떠 만든 작은 봉제인형 키링이에요. 보들보들하고 정말 귀여워요! 누나의 일상에 작은 즐거움을 더해 주면 좋겠어요.'],
 ['还有一把带着古典韵味的檀木梳子，纹理和造型都很漂亮，希望你每次使用时，都能感受到这份小小的心意。','그리고 고전적인 멋이 느껴지는 나무 빗도 준비했어요. 나뭇결과 모양이 참 예뻐서 골랐답니다. 사용할 때마다 제 작은 마음이 누나에게 전해졌으면 좋겠어요.'],
 ['另外两件，是三星堆主题的纪念品：一枚以“青铜大立人像”为原型的发光冰箱贴，以及一个以“青铜纵目面具”为灵感设计的眼罩。它们把古老而神秘的文化变成了有趣的日常小物，希望也能带给你一些惊喜。','나머지 두 가지는 싼싱두이 유물을 모티브로 만든 기념품이에요. 하나는 ‘대형 청동 입상’을 본떠 만든 불이 켜지는 냉장고 자석이고, 다른 하나는 ‘돌출된 눈의 청동 가면’라는, 눈이 앞으로 돌출된 독특한 청동 가면에서 영감을 받아 만든 수면 안대예요. 오래되고 신비로운 문화를 일상에서 사용할 수 있는 재미있는 소품으로 만든 것들이라, 누나에게도 특별한 선물이 되었으면 해요.'],
 ['这些礼物，是我一点一点为你挑选的。希望你打开包裹的时候，也能像我收到你的礼物时一样，感到开心和温暖。','모두 누나를 생각하면서 하나씩 고른 선물이에요. 제가 누나의 선물을 받고 그랬던 것처럼, 누나도 상자를 열면서 행복하고 따뜻한 마음을 느꼈으면 좋겠어요.'],
 ['最后，希望你每天都能遇见值得开心的小事。也愿你在忙碌的工作中，找到属于自己的节奏，照顾好自己，多留一些时间休息。如果哪天觉得累了，或是心里有烦恼，随时都可以找我聊聊。我很愿意听你说，也愿意陪着你。','마지막으로, 누나의 하루하루에 웃을 수 있는 작은 일들이 가득하길 바라요. 일이 바쁘더라도 누나만의 속도로 여유를 찾고, 건강도 잘 챙기고, 쉬는 시간도 충분히 가졌으면 좋겠어요. 혹시 지치거나 속상한 일이 생기면 언제든 저에게 이야기해 줘요. 기꺼이 들어 줄게요. 멀리 있어도 마음으로 늘 곁에 있을게요.'],
 ['从中国寄去一份温暖，也送上一个远远的拥抱！','중국에서 따뜻한 마음과 함께, 멀리서나마 꼭 안아 주고 싶은 마음을 보내요!'],
 ['想念你的，\nliburs','누나를 그리워하는,\nliburs']
];
let frame = 0, arrivalTimer = 0, letterTimer = 0;
const unlockKey='sieun-parcel-unlocked-v1';let unlocked=false;
try{unlocked=localStorage.getItem(unlockKey)==='yes';}catch(_){}
const trackingStages=[
 ['shanghai',438,324,'上海','상하이','包裹现在在上海，一些小快乐正在慢慢靠近你。','선물은 지금 상하이에 있어요. 작은 행복이 누나에게 다가가고 있어요.'],
 ['domestic',420,260,'中国境内运输','중국 내 운송','包裹正在中国境内运输，地图为阶段示意。','중국 내에서 이동 중이에요. 지도는 대략적인 단계 표시예요.'],
 ['transit',540,219,'国际运输中','국제 운송 중','包裹正在跨越山海，带着心意向你靠近。','선물이 바다를 건너 누나에게 향하고 있어요.'],
 ['korea',635,220,'已到韩国','한국 도착','已经来到韩国，离你又近了一点点。','한국에 도착했어요. 누나에게 한 걸음 더 가까워졌어요.'],
 ['delivery',657,242,'前往奉化','봉화로 이동 중','正前往奉化，期待与你见面的那一刻。','봉화로 가고 있어요. 누나를 만날 순간을 기다려요.'],
 ['delivered',670,251,'已送达','배송 완료','你的快乐到了！打开纸质信封，用里面的密码开启惊喜吧。','선물이 도착했어요! 종이 편지 봉투 안의 비밀번호로 선물을 열어 주세요.']
];
function showTracking(){
 cancelAnimationFrame(frame);clearTimeout(arrivalTimer);clearTimeout(letterTimer);document.querySelectorAll('dialog[open]:not(#language-welcome)').forEach(d=>d.close());scene('journey');
 $('#tracking-panel').hidden=false;$('#skip').hidden=true;$('#replay').textContent=unlocked?'↻ 重播旅程 · 다시 보기':'♡ 查看旅程 · 배송 여정';
 const config=window.PARCEL_TRACKING||{};window.parcelMap?.tracking(config);const index=Math.max(0,trackingStages.findIndex(s=>s[0]===config.stage));const stage=trackingStages[index];
 $('#plane').setAttribute('transform','translate('+stage[1]+' '+stage[2]+')');
 $('#flight-status').textContent='📦 '+window.siteLanguage.pick(stage[3]+'（示意位置）',stage[4]+' (대략적인 위치)');
 $('#tracking-title').textContent=window.siteLanguage.pick(stage[3],stage[4]);
 const stateText={pending:['上海 · 待寄出，等待 EMS 揽收。','상하이에서 발송 준비 중이에요.'],label_created:['运单信息已建立，等待揽收轨迹。','운송장 정보가 등록되었어요. 집하 정보를 기다려요.'],awaiting_data:['等待承运商提供轨迹，暂保留上次位置。','배송 조회 정보를 기다리는 중이에요. 마지막 위치를 유지해요.'],attention:['物流有异常或延误，保留上次确认的位置。','배송 지연 또는 예외가 있어요. 마지막 확인 위치를 표시해요.'],location_unknown:['物流已有更新，但地点尚不明确，保留上次确认的位置。','배송은 갱신되었지만 위치가 불분명해 마지막 위치를 유지해요.'],pickup:['包裹已到待领取点，尚未确认签收。','수령 장소에 도착했어요. 아직 수령 완료는 아니에요.']}[config.state];
 $('#tracking-description').textContent=window.siteLanguage.pick(...(stateText||[stage[5],stage[6]]))+(config.updatedAt?'\n'+window.siteLanguage.pick('轨迹时间：','배송 시각: ')+new Date(config.updatedAt).toLocaleString(window.siteLanguage.language==='ko'?'ko-KR':'zh-CN'):'');
 const fresh=config.checkedAt?new Date(config.checkedAt).toLocaleString(window.siteLanguage.language==='ko'?'ko-KR':'zh-CN'):'';
 $('#tracking-sync').textContent=config.sync==='not_configured'?'EMS · 待寄出，等待物流接入 · 발송 및 조회 연결 준비 중':config.sync==='error'?'暂时无法更新，显示最后记录 · 갱신 불가, 마지막 기록 표시':config.sync==='ok'?'自动查询 · 자동 조회'+(fresh?' · '+fresh:''):'物流信息准备中 · 배송 정보 준비 중';
 $('#tracking-steps').replaceChildren();trackingStages.forEach((item,i)=>{const li=document.createElement('li');li.textContent=window.siteLanguage.pick(item[3],item[4]);li.className=i<index?'done':i===index?'current':'';if(i===index)li.setAttribute('aria-current','step');$('#tracking-steps').append(li);});
 $('#unlock-form').hidden=unlocked;$('#return-gifts').hidden=!unlocked;
}
$('#unlock-form').addEventListener('submit',e=>{e.preventDefault();if($('#parcel-password').value.trim().toLowerCase()!=='sieun'){$('#unlock-error').textContent='这把小钥匙还不对哦，请再看看纸质信封。 · 비밀번호가 맞지 않아요. 편지 봉투를 다시 확인해 주세요.';$('#parcel-password').setAttribute('aria-invalid','true');return;}unlocked=true;window.parcelMusic?.unlock();try{localStorage.setItem(unlockKey,'yes');}catch(_){}$('#parcel-password').value='';$('#parcel-password').removeAttribute('aria-invalid');$('#unlock-error').textContent='';startJourney();});
$('#return-gifts').onclick=()=>{if(unlocked)scene('gifts');};
const trackingButton=document.createElement('button');trackingButton.className='text-button';trackingButton.textContent='📦 物流位置 · 배송 위치';trackingButton.onclick=showTracking;document.querySelector('header').append(trackingButton);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function scene(id){document.querySelectorAll('.scene').forEach(s=>s.hidden=s.id!==id);window.scrollTo({top:0,behavior:'instant'});}
function arrive(){window.parcelMap?.finish();if(!unlocked){showTracking();return;}cancelAnimationFrame(frame);clearTimeout(arrivalTimer);scene('arrival');}
function startJourney(){if(!unlocked){showTracking();return;}$('#tracking-panel').hidden=true;$('#skip').hidden=false;$('#replay').textContent='↻ 重播旅程 · 다시 보기';cancelAnimationFrame(frame);clearTimeout(arrivalTimer);clearTimeout(letterTimer);document.querySelectorAll('dialog[open]:not(#language-welcome)').forEach(d=>d.close());$('#envelope').classList.remove('opening');scene('journey');window.parcelMap?.begin();const path=$('#flight-path'),len=path.getTotalLength();let start;function step(t){if(!start)start=t;const progress=Math.min((t-start)/7000,1),p=path.getPointAtLength(len*progress);$('#plane').setAttribute('transform',`translate(${p.x} ${p.y})`);window.parcelMap?.progress(progress);$('#flight-status').textContent=progress<.16?'上海出发 · 상하이에서 출발해요':progress<.85?'带着满满心意，飞越山海… · 마음을 싣고 날아가는 중…':'已抵达奉化 · 봉화에 도착했어요 ♡';if(progress<1)frame=requestAnimationFrame(step);else arrivalTimer=setTimeout(arrive,850);}if(reducedMotion){$('#flight-status').textContent='心意已送达 · 마음이 도착했어요 ♡';arrivalTimer=setTimeout(arrive,1200);}else frame=requestAnimationFrame(step);}
function confetti(){if(reducedMotion)return;for(let i=0;i<36;i++){const s=document.createElement('span');s.className='confetto';s.textContent=['♡','✦','🎀','✧'][i%4];s.style.cssText=`left:${Math.random()*100}%;font-size:${12+Math.random()*20}px;animation-delay:${Math.random()*.8}s`;$('#confetti').append(s);setTimeout(()=>s.remove(),4500);}}
const giftName=g=>window.siteLanguage.pick(g.name,g.ko);
const giftDescription=g=>window.siteLanguage.pick(g.zh,g.kr);
const art=g=>g.img?`<img src="assets/${g.img}" alt="${giftName(g)}">`:`<div class="snack-art" aria-label="${giftName(g)}">${g.emoji}</div>`;
function renderGifts(){ $('#gift-grid').replaceChildren();gifts.forEach((g,i)=>{const b=document.createElement('button');b.className='gift';b.style.cssText=`--tilt:${[-2,2,-1,2,-2,1,-1][i]}deg;animation-delay:${i*.1}s`;b.innerHTML=`${art(g)}<span class="number">LITTLE JOY / 0${i+1}</span><h2>${giftName(g)}</h2><p class="kr">${window.siteLanguage.pick("打开这份小心意","선물에 담긴 마음 보기")}</p>`;b.onclick=()=>{if(window.openGiftV6){window.openGiftV6(g);return;}$('#gift-detail').innerHTML=`${art(g)}<h2>${giftName(g)}</h2><p>${giftDescription(g)}</p>`;attachCulture(g);$('#gift-dialog').showModal();$('#gift-dialog').scrollTop=0;};$('#gift-grid').append(b);});}renderGifts();
function renderLetter(lang){const root=$('#letter-content');root.replaceChildren();letter.forEach((pair,i)=>{const wrap=document.createElement('div');if(lang==='both')wrap.className='pair';const indexes=lang==='both'?[0,1]:[lang==='zh'?0:1];indexes.forEach(index=>{const p=document.createElement(i===0?'h2':'p');p.lang=index===0?'zh-CN':'ko';p.textContent=pair[index];if(i===letter.length-1)p.className='signature';wrap.append(p);});root.append(wrap);});document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));}
function openLetter(){if(!unlocked){showTracking();return;}renderLetter(window.siteLanguage.language);$('#letter-dialog').showModal();$('#letter-dialog').scrollTop=0;}
$('#skip').onclick=arrive;$('#replay').onclick=startJourney;
$('#unbox').onclick=()=>{if(!unlocked){showTracking();return;}scene('gifts');confetti();};
$('#envelope').onclick=()=>{$('#envelope').classList.add('opening');clearTimeout(letterTimer);letterTimer=setTimeout(openLetter,reducedMotion?0:400);};
$('#letter-direct').onclick=openLetter;
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>renderLetter(b.dataset.lang));
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
if(unlocked){scene('gifts');}else{showTracking();}

window.addEventListener("tracking-updated",()=>{if(!$("#journey").hidden&&!$("#tracking-panel").hidden)showTracking();});

window.parcelMusic?.start(unlocked);


window.addEventListener('site-language-changed',()=>{renderGifts();if($('#letter-dialog').open)renderLetter(window.siteLanguage.language);if(!$('#journey').hidden&&!$('#tracking-panel').hidden)showTracking();});

