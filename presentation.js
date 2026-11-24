/* Small visual transitions, owned by the current view and safe to cancel. */
(()=>{
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 let opening=null;
 function scene(el){cancel();if(!reduced())el.animate([{opacity:0,transform:'translateY(14px)'},{opacity:1,transform:'translateY(0)'}],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)'});}
 function cancel(){if(!opening)return;clearTimeout(opening.timer);opening.art?.classList.remove('parcel-opening');opening.button.disabled=false;opening=null;}
 function unbox(done){if(opening)return;const art=document.querySelector('.parcel-art'),button=document.querySelector('#unbox');button.disabled=true;art.classList.add('parcel-opening');opening={art,button,timer:setTimeout(()=>{cancel();done();},reduced()?0:1150)};}
 const themes={
 panda:{image:'panda.jpg',title:['守护花花','화화 지키기'],tag:['竹林守护者','대나무 숲의 수호자'],line:['把勇气留给冒险，把温柔留给花花。','모험에는 용기를, 화화에게는 다정함을.'],chips:[['第一人称守护','1인칭 수호'],['3分钟挑战','3분 도전'],['耳机体验更佳','헤드폰 권장']]},
 comb:{image:'comb.jpg',title:['梳间拼图','나무 빗 퍼즐'],tag:['纹样里的心意','무늬 속에 담긴 마음'],line:['沿着木纹和花纹，把一份心意慢慢拼完整。','나뭇결과 무늬를 따라 마음을 천천히 맞춰 보세요.'],chips:[['25块拼图','25조각 퍼즐'],['按顺序完成QTE','순서대로 QTE'],['可以慢慢来','천천히 해도 괜찮아요']]},
 standing:{image:'magnet.jpg',title:['青铜禁域','청동의 금역'],tag:['鱼灯照夜，古蜀入梦','물고기 등이 밝히는 고대 촉의 꿈'],line:['灯火之外，宅院正在倾听你的脚步。','등불 너머의 저택이 당신의 발소리에 귀를 기울여요.'],chips:[['第三人称探索','3인칭 탐험'],['耳机聆听脚步','헤드폰으로 발소리 듣기'],['含恐怖元素','공포 요소 포함']]},
 mask:{image:'mask.jpg',title:['纵目守望','군중 속의 귀신'],tag:['面具之下，真相之间','가면 아래 숨겨진 진실'],line:['不要急着相信第一眼，答案藏在三个细节里。','첫인상을 믿기 전에 세 가지 단서를 확인하세요.'],chips:[['观察与判断','관찰과 판단'],['找出5个目标','목표 5명 찾기'],['珍惜眼罩能量','안대 에너지 아끼기']]}
 };
 function intro(id){const data=themes[id],el=document.createElement('section');el.className='adventure-intro theme-'+id;const visual=document.createElement('div');visual.className='adventure-intro-art';const img=document.createElement('img');img.src='assets/'+data.image;img.alt='';visual.append(img);const content=document.createElement('div');content.className='adventure-intro-copy';const node=(tag,cls,pair)=>{const n=document.createElement(tag);n.className=cls;n.textContent=window.siteLanguage.pair(...pair);return n;};content.append(node('p','intro-kicker',data.tag),node('h2','',data.title),node('p','intro-line',data.line));const chips=document.createElement('ul');chips.className='intro-chips';for(const pair of data.chips)chips.append(node('li','',pair));content.append(chips);el.append(visual,content);return el;}
 window.parcelPresentation={scene,unbox,cancel,intro};window.addEventListener('site-language-changed',cancel);window.addEventListener('pagehide',cancel);
})();
