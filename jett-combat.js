/* Small deterministic enemy fire controller. Visuals and damage share each shot. */
export function createEnemyCombat({ assist = false, visible, fire }) {
  const reaction = assist ? .9 : .48;
  return {
    update(enemy, player, dt) {
      enemy.muzzle = Math.max(0, (enemy.muzzle || 0) - dt);
      const canSee = !enemy.dead && enemy.active !== false && visible(enemy, player);
      enemy.seen = canSee;
      if (!canSee) {
        enemy.aimTime = 0;
        enemy.burst = 0;
        enemy.shotDelay = 0;
        enemy.aimPoint = null;
        return;
      }
      enemy.aimTime = (enemy.aimTime || 0) + dt;
      if (!enemy.aimPoint) enemy.aimPoint = { x: player.x, z: player.z };
      // Tracking takes time: strafing and a dash can evade a burst.
      const follow = 1 - Math.exp(-dt / (assist ? .3 : .17));
      enemy.aimPoint.x += (player.x - enemy.aimPoint.x) * follow;
      enemy.aimPoint.z += (player.z - enemy.aimPoint.z) * follow;
      if (enemy.aimTime < reaction) return;
      enemy.shotDelay = Math.max(0, (enemy.shotDelay || 0) - dt);
      if (enemy.shotDelay > 0) return;
      if (!enemy.burst) enemy.burst = assist ? 2 : 3;
      enemy.shotNumber = (enemy.shotNumber || 0) + 1;
      const distance = Math.hypot(player.x - enemy.x, player.z - enemy.z);
      const deviation = Math.sin(enemy.shotNumber * 2.399 + (enemy.id || 0)) * (assist ? .23 : .1) * Math.min(1.5, distance / 15);
      const aim = { x: enemy.aimPoint.x + deviation, y: player.y + 1.1, z: enemy.aimPoint.z - deviation * .5 };
      const hit = Math.hypot(aim.x - player.x, aim.z - player.z) < .32;
      enemy.muzzle = .085;
      fire(enemy, aim, hit);
      enemy.burst--;
      enemy.shotDelay = enemy.burst ? .12 : (assist ? 1.15 : .65);
    }
  };
}
