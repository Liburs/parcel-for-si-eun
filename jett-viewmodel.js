import * as T from './assets/vendor/three.module.js';
import { GLTFLoader } from './assets/vendor/GLTFLoader.js';
import { clone } from './assets/vendor/SkeletonUtils.js';

export async function createOpponents(count) {
  const base='assets/jett/ka/', meta=await (await fetch(base+'manifest.json')).json(), spec=meta.agents.jett;
  const data=await new GLTFLoader().loadAsync(base+spec.glb), materials=new Map(), textures=[];
  const tl=new T.TextureLoader();
  for(const m of spec.materials){
    const load=async(path,color=false)=>{if(!path)return null;const t=await tl.loadAsync(base+path);t.flipY=false;if(color)t.colorSpace=T.SRGBColorSpace;textures.push(t);return t;};
    const [map,normalMap,orm]=await Promise.all([load(m.DF,true),load(m.NM),load(m.ORM)]);
    materials.set(m.name,new T.MeshStandardMaterial({map,normalMap,roughnessMap:orm,roughness:1,metalnessMap:orm,metalness:.15,side:T.DoubleSide}));
  }
  data.scene.traverse(o=>{if(o.isMesh){o.frustumCulled=false;const replace=m=>{const n=materials.get(m.name);if(n){m.dispose();return n;}return m;};o.material=Array.isArray(o.material)?o.material.map(replace):replace(o.material);}});
  const rigs=Array.from({length:count},()=>{const model=clone(data.scene),g=new T.Group();g.add(model);const mixer=new T.AnimationMixer(model);if(data.animations.length)mixer.clipAction(data.animations.find(c=>/Idle_Loop/.test(c.name))||data.animations[0]).play();mixer.update(.01);model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model);const scale=1.8/(bounds.max.y-bounds.min.y);model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;return{g,mixer};});
  return{rigs,dispose(){rigs.forEach(r=>r.mixer.stopAllAction());const gs=new Set();data.scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);});gs.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}

// Original Jett arms and weapon rigs, with separate hand/gun animation clips.
// Source: Kingdom Archives. No third-party application code is included.
export function createViewmodel(index) {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(43.3830667, 16 / 9, .005, 20);
  scene.add(new T.HemisphereLight(0xffffff, 0xa4b3bd, 2.8));
  const light = new T.DirectionalLight(0xffffff, 3);
  light.position.set(-1, 3, 2); scene.add(light);
  const base = 'assets/jett/ka/';
  const loader = new GLTFLoader(), textureLoader = new T.TextureLoader();
  const textures = new Map(), materialCache = new Map(), roots = [];
  let disposed = false, rig, gun, anchor, cameraBone, armMixer, gunMixer;
  let armClips = [], gunClips = [], animationSpecs = [], active = null;
  let remaining = 0, idle, lastShots = 0, wasReloading = false;
  const rotation = new T.Matrix4().makeRotationY(Math.PI / 2);
  const restRotation = new T.Matrix4(), bonePose = new T.Matrix4();
  async function texture(path, color = false) {
    if (!path) return null;
    if (!textures.has(path)) textures.set(path, textureLoader.loadAsync(base + path).then(t => {
      t.flipY = false; if (color) t.colorSpace = T.SRGBColorSpace;
      return t;
    }));
    return textures.get(path);
  }
  async function materials(root, specs) {
    for (const spec of specs || []) {
      if (!materialCache.has(spec.name)) {
        const m = new T.MeshStandardMaterial({ name: spec.name, roughness: spec.Roughness ?? 1, metalness: spec.Metallic ?? 0 });
        const [df, nm, orm, em] = await Promise.all([texture(spec.DF, true), texture(spec.NM), texture(spec.ORM), texture(spec.EM, true)]);
        m.map = df; m.normalMap = nm; m.roughnessMap = orm; m.metalnessMap = orm; m.aoMap = orm;
        if (spec.Emissive) {
          const c = spec.Emissive.Color || { R: 1, G: 1, B: 1 };
          m.emissive.setRGB(c.R, c.G, c.B); m.emissiveMap = em; m.emissiveIntensity = spec.Emissive.Intensity ?? 1;
        }
        if (spec.type === 'Tritium') { m.color.set('#65ef99'); m.emissive.set('#65ef99'); m.emissiveIntensity = .7; }
        if (/Disabled/.test(spec.type)) { m.visible = false; }
        if (/Glass|Translucent/.test(spec.type)) { m.transparent = true; m.opacity = .28; m.depthWrite = false; }
        materialCache.set(spec.name, m);
      }
    }
    root.traverse(o => {
      if (!o.isMesh) return;
      o.frustumCulled = false;
      const replace = m => { const n = materialCache.get(m.name); if (n) { m.dispose(); return n; } return m; };
      o.material = Array.isArray(o.material) ? o.material.map(replace) : replace(o.material);
    });
  }
  function bindClips(clips, root) {
    return clips.map(c => new T.AnimationClip(c.name, c.duration, c.tracks.filter(track => {
      const name = track.name.slice(0, track.name.lastIndexOf('.'));
      return !!root.getObjectByName(name);
    }).map(track => track.clone())));
  }
  function run(mixer, clips, name, seconds, loop) {
    const clip = clips.find(c => c.name === name);
    if (!clip || !mixer) return;
    mixer.stopAllAction();
    const action = mixer.clipAction(clip).reset();
    action.setLoop(loop ? T.LoopRepeat : T.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;
    action.timeScale = seconds > 0 ? clip.duration / seconds : 1;
    action.play();
  }
  function play(kind, duration) {
    const spec = animationSpecs.find(a => a.Translatable === kind);
    if (!spec) return;
    active = kind; remaining = duration || spec.SequenceLength || 1;
    run(armMixer, armClips, spec.Name, remaining, kind === 'Idle');
    run(gunMixer, gunClips, spec.WeaponAnimName, duration || spec.SequenceLengthGN || remaining, kind === 'Idle');
  }
  const ready = (async () => {
    const response = await fetch(base + 'manifest.json'); if (!response.ok) throw Error('Missing weapon manifest');
    const meta = await response.json(), agent = meta.agents_fp['jett-fp'];
    const weapon = meta.weapons[['sheriff', 'vandal', 'operator'][index]].fp;
    const armsPath = weapon.fp_animations.find(a => a.glb).glb;
    const gunPath = weapon.animations.find(a => a.glb).glb;
    const [armsData, gunData, armsAnimations, gunAnimations] = await Promise.all([
      loader.loadAsync(base + agent.glb), loader.loadAsync(base + weapon.glb),
      loader.loadAsync(base + armsPath), loader.loadAsync(base + gunPath)
    ]);
    roots.push(armsData.scene, gunData.scene, armsAnimations.scene, gunAnimations.scene);
    rig = armsData.scene; gun = gunData.scene;
    await Promise.all([materials(rig, agent.materials), materials(gun, weapon.materials)]);
    if (disposed) { release(); return; }
    anchor = new T.Group(); anchor.matrixAutoUpdate = false; scene.add(anchor); anchor.add(rig);
    rig.updateMatrixWorld(true);
    cameraBone = rig.getObjectByName('Camera');
    if (!cameraBone) throw Error('Jett camera bone missing');
    restRotation.extractRotation(cameraBone.matrixWorld);
    const hand = rig.getObjectByName('R_WeaponMaster');
    if (!hand) throw Error('Jett weapon bone missing');
    hand.add(gun); gun.rotation.y = Math.PI / 2;
    const find = name => { let result; gun.traverse(o => { if (o.name.replace(/[_.]/g, '') === name.replace(/[_.]/g, '')) result = o; }); return result; };
    for (const c of weapon.constraints || []) {
      if (c.Type !== 'ObjectToBone') continue;
      const source = find(c.SourceObject), bone = gun.getObjectByName(c.Bone);
      if (!source || !bone) continue;
      bone.add(source);
      source.position.set(c.Offset?.X || 0, c.Offset?.Y || 0, c.Offset?.Z || 0);
      source.rotation.set(...['X','Y','Z'].map(k => T.MathUtils.degToRad(c.Rotation?.[k] || 0)));
    }
    for (const name of weapon.fp_exclusive || []) { const o = find(name); if (o) o.visible = false; }
    armClips = bindClips(armsAnimations.animations, rig); gunClips = bindClips([...gunData.animations, ...gunAnimations.animations], gun);
    armMixer = new T.AnimationMixer(rig); gunMixer = new T.AnimationMixer(gun);
    animationSpecs = weapon.fp_animations; idle = animationSpecs.find(a => a.IsHeldDefault || a.Translatable === 'Idle');
    play('Idle');
  })();
  function update(s, dt) {
    if (!armMixer || disposed) return;
    scene.visible = !(s.scoped && index === 2);
    if (s.shots !== undefined && s.shots !== lastShots) { lastShots = s.shots; play('Fire'); }
    if (s.reload > 0 && !wasReloading) play('Reload', s.reload);
    wasReloading = s.reload > 0;
    if (active !== 'Idle') { remaining -= dt; if (remaining <= 0) play('Idle'); }
    armMixer.update(dt); gunMixer.update(dt);
    rig.updateMatrixWorld(true);
    bonePose.copy(rig.matrixWorld).invert().multiply(cameraBone.matrixWorld).invert();
    anchor.matrix.copy(rotation).multiply(restRotation).multiply(bonePose);
    anchor.updateMatrixWorld(true);
  }
  function release() {
    armMixer?.stopAllAction(); gunMixer?.stopAllAction();
    const geometries = new Set(); roots.forEach(root => root.traverse(o => { if (o.geometry) geometries.add(o.geometry); }));
    geometries.forEach(g => g.dispose()); materialCache.forEach(m => m.dispose());
    textures.forEach(p => p.then(t => t.dispose()).catch(() => {}));
  }
  return { scene, camera, ready, update, play, dispose() { disposed = true; release(); } };
}
