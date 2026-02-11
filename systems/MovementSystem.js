/**
 * MovementSystem.js
 * 
 * Handles all player movement, physics updates, and field bounds.
 * Separates movement logic from decision-making.
 * 
 * ARCHITECTURAL DECISION:
 * - Pure physics calculations, no AI logic here
 * - Systems call this to execute movement
 * - Handles collisions, bounds, stamina-based movement
 */

class MovementSystem {
    constructor(scene) {
        this.scene = scene;
        this.fieldBounds = GameConfig.FIELD.BOUNDS;
    }
    
    update(players, delta) {
        players.forEach(player => {
            this.updatePlayerPhysics(player, delta / 1000); // dt in seconds
            this.enforceFieldBounds(player);
            this.updateStamina(player, delta / 1000);
        });
    }
    
    updatePlayerPhysics(player, dt) {
        const abilityMultiplier = this.getAbilitySpeedMultiplier(player);
        const staminaMultiplier = this.getStaminaSpeedMultiplier(player);
        const effectiveMaxSpeed = player.stats.speed * abilityMultiplier * staminaMultiplier;

        // Simula inércia: Damping exponencial
        const drag = GameConfig.PHYSICS.PLAYER.DRAG + (player.isSprinting ? 0.02 : 0); // Mais drag em sprint
        player.sprite.body.velocity.x *= Math.pow(drag, dt * 60); // Aprox e^(-k*dt)
        player.sprite.body.velocity.y *= Math.pow(drag, dt * 60);

        // Momentum: Atualiza direção atual com lerp para target
        if (player.targetDirection !== undefined) {
          const currentAngle = Math.atan2(player.sprite.body.velocity.y, player.sprite.body.velocity.x);
          const targetAngle = player.targetDirection;
          const deltaAngle = Math.atan2(Math.sin(targetAngle - currentAngle), Math.cos(targetAngle - currentAngle));
          const turnRate = 5 * (1 - (player.currentSpeed / effectiveMaxSpeed) ** 0.5); // Slow turn at high speed
          const newAngle = currentAngle + deltaAngle * Math.min(1, turnRate * dt);

          // Aceleração progressiva (quadratic ease-in)
          const accelFactor = player.isAccelerating ? Math.pow(player.accelTime / 1, 2) : 0; // 1s to max
          player.accelTime = Math.min(1, player.accelTime + dt);
          const speed = effectiveMaxSpeed * accelFactor * (player.isSprinting ? 1.5 : 1);

          player.sprite.body.velocity.x = Math.cos(newAngle) * speed;
          player.sprite.body.velocity.y = Math.sin(newAngle) * speed;
          player.currentSpeed = Phaser.Math.Clamp(speed, 0, effectiveMaxSpeed);
        } else {
          // Desaceleração suave se no input
          player.accelTime = 0;
          if (player.currentSpeed < 5) player.sprite.setVelocity(0, 0);
        }

        // Update run animation based on accel, not just vel
        player.updateRunAnimation(player.accelTime > 0 ? player.currentSpeed : 0);
      }
    
    // ... (o restante do código original de MovementSystem.js continua aqui, incluindo getAbilitySpeedMultiplier, getStaminaSpeedMultiplier, enforceFieldBounds, updateStamina, moveToward, etc.)
    
    accelerateToward(player, targetAngle, isSprinting = false, isAccelerating = true) {
        player.targetDirection = targetAngle;
        player.isSprinting = isSprinting;
        player.isAccelerating = isAccelerating;
        player.accelTime = player.accelTime || 0; // Buffer
    }
}
