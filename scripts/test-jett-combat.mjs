import assert from 'node:assert/strict';
import { createEnemyCombat } from '../jett-combat.js';

for (const assist of [false, true]) {
  const enemy = { id: 0, x: 0, y: 0, z: 10, hp: 100 };
  const player = { x: 0, y: 0, z: 0, hp: 100, armor: 50 };
  let visible = true, shots = 0, time = 0;
  const combat = createEnemyCombat({ assist, visible: () => visible, fire(e, aim, hit) {
    shots++;
    if (hit) { const absorbed = Math.min(player.armor, 40 * 2 / 3); player.armor -= absorbed; player.hp -= 40 - absorbed; }
  }});
  while (player.hp > 0 && time < 10) { combat.update(enemy, player, .02); time += .02; }
  assert(player.hp <= 0, 'a visible stationary player must lose to sustained fire');
  assert(time > .5 && time < 5, 'reaction and bursts provide a readable but real threat');
  visible = false; const previousShots = shots;
  for (let i = 0; i < 100; i++) combat.update(enemy, player, .02);
  assert.equal(shots, previousShots, 'cover/smoke must stop fire');
  visible = true; combat.update(enemy, player, .02);
  assert.equal(shots, previousShots, 'reacquiring after cover requires reaction time');
  enemy.dead = true;
  for (let i = 0; i < 100; i++) combat.update(enemy, player, .02);
  assert.equal(shots, previousShots, 'dead enemies must not shoot');
  console.log(`${assist ? 'assist' : 'standard'}: idle defeat in ${time.toFixed(2)}s; cover, reacquisition, death passed`);
}
