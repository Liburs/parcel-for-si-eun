// No visible audio controls. Audio starts as soon as browser policy permits.
(()=>{
 const audio=new Audio();audio.id='background-music';audio.hidden=true;audio.setAttribute('aria-hidden','true');document.body.append(audio);audio.preload='auto';audio.volume=window.parcelAudio?.level??.5;
 const waiting=['assets/music/32-rito-night.flac'];
 const playlist=["assets/music/01-octopath-main.mp3","assets/music/02-winterlands-night.mp3","assets/music/03-empty-memories.mp3","assets/music/04-epilogue.mp3","assets/music/05-beastling-village-night.mp3"];
 let mode='',index=0,generation=0,retry=false;
 function play(){const ticket=generation;retry=false;const pending=audio.play();if(pending)pending.catch(e=>{if(ticket===generation)retry=e.name==='NotAllowedError';});}
 function load(){generation++;audio.pause();audio.loop=mode==='waiting';audio.src=(mode==='waiting'?waiting:playlist)[index];audio.load();play();}
 function select(next){if(mode===next)return;mode=next;index=0;load();}
 audio.addEventListener('ended',()=>{if(mode==='unlocked'){index=(index+1)%playlist.length;load();}});
 const gesture=()=>{if(retry)play();};
 document.addEventListener('pointerdown',gesture,{passive:true});document.addEventListener('keydown',gesture);document.addEventListener('click',gesture,{passive:true});
 window.parcelMusic={start:unlocked=>select(unlocked?'unlocked':'waiting'),unlock:()=>select('unlocked')};
})();
