/* Recorded bilingual event narration. One speaker, short queue, no system TTS. */
(()=>{
 let queue=[],current=null,timer=null,generation=0,lastStarted=-Infinity;
 const recent=new Map();
 function clean(a){a.onended=a.onerror=null;a.pause();a.removeAttribute('src');a.load();a.remove();}
 function stop(reset=true){generation++;if(timer!==null)clearTimeout(timer);timer=null;if(current)clean(current);current=null;queue=[];if(reset){recent.clear();lastStarted=-Infinity;}}
 function note(lang){for(const n of document.querySelectorAll('.quest-voice-note'))n.textContent=lang==='ko'?'음성을 불러오지 못했어요. 화면 안내를 확인하세요.':'语音加载失败，请查看画面提示。';}
 function pump(){if(current||timer!==null)return;const now=Date.now();queue=queue.filter(x=>x.expires>now);if(!queue.length)return;const wait=1800-(now-lastStarted);if(wait>0){timer=setTimeout(()=>{timer=null;pump();},wait);return;}const item=queue.shift(),clip=window.questVoices?.[item.lang+'|'+item.text];if(!clip){note(item.lang);pump();return;}const a=new Audio(clip),token=generation;current=a;a.hidden=true;a.dataset.questVoice=item.lang;a.volume=.8;document.body.append(a);lastStarted=now;const finish=(failed=false)=>{if(current!==a)return;clean(a);current=null;if(failed)note(item.lang);if(token===generation)pump();};a.onended=()=>finish();a.onerror=()=>finish(true);a.play().then(()=>{if(token!==generation)a.pause();}).catch(()=>finish(true));}
 function speak(z,k,options={}){const event=window.questVoiceEvents?.[z];if(!event)return;const lang=window.questUI?.language==='zh'?'zh':'ko',now=Date.now(),key=options.key||z;if(recent.has(key)&&now-recent.get(key)<Math.max(event.cooldown,options.cooldown||0))return;recent.set(key,now);for(const n of document.querySelectorAll('.quest-event-caption'))n.textContent=window.questUI.pair(event.zh,event.ko);if(event.terminal||event.priority){stop(false);lastStarted=-Infinity;}if(queue.some(q=>q.key===key))return;queue=queue.slice(-1);queue.push({key,lang,text:event[lang],expires:now+event.ttl});pump();}
 window.questSpeech={speak,stop};
})();
