/**
 * Player.js
 * 
 * Main player entity with FSM, stats, and visual representation.
 * 
 * ARCHITECTURAL DECISION:
 * - Player is a data container + visual representation
 * - Logic is handled by Systems (Defense, Movement, Decision)
 * - FSM manages behavior states
 * - Prepared for spritesheet replacement
 */

class Player {
    constructor(scene, config) {
        this.scene = scene;
        
        // ============================================
        // CORE PROPERTIES
        // ============================================
        this.team = config.team;
        this.playerName = config.name;
        this.role = config.role || 'SHOOTER';
        this.index = config.index;
        
        // ============================================
        // POSITION & MOVEMENT
        // ============================================
        this.x = config.x;
        this.y = config.y;
        this.basePosition = { x: config.x, y: config.y };
        this.currentVelocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        
        // Novos para momentum
        this.currentSpeed = 0;
        this.accelTime = 0;
        this.isSprinting = false;
        this.isAccelerating = false;
        this.targetDirection = 0;
        
        // ============================================
        // STATS (with role modifiers)
        // ============================================
        const roleConfig = GameConfig.ROLES[this.role];
        this.stats = {
            speed: (config.stats.speed || 150) * (roleConfig.statModifiers.speed || 1),
            shootPower: (config.stats.shootPower || 100) * (roleConfig.statModifiers.shootPower || 1),
            stamina: config.stats.stamina || 100,
            dribble: (config.stats.dribble || 100) * (roleConfig.statModifiers.dribble || 1),
            defense: 80 * (roleConfig.statModifiers.defense || 1),
            reaction: 70 * (roleConfig.statModifiers.reaction || 1),
            aggression: 60 * (roleConfig.statModifiers.aggression || 1)
        };
        
        this.staminaCurrent = this.stats.stamina;
        this.maxSpeed = this.stats.speed * 0.6;
        
        // ... (o restante do código original de Player.js continua aqui, incluindo state, zone, etc.)
        
        kick(ball, targetX, targetY, chargeTime) { // chargeTime from input hold
          if (this.kickCooldown > 0) return false;
          
          const power = Phaser.Math.Lerp(200, 800, chargeTime / 1.5); // Max charge 1.5s
          const baseAngle = MathHelpers.angleBetween(this.x, this.y, targetX, targetY);
          const error = MathHelpers.randomGaussian(0, 0.15 * (1 - this.staminaCurrent / this.stats.stamina) + this.currentSpeed / this.stats.speed * 0.1);
          const angle = baseAngle + error;
        
          // Arc: Simule com velocity y extra (even in 2D)
          ball.setVelocity(Math.cos(angle) * power, Math.sin(angle) * power + 50); // Leve arc
          ball.lastTouchedBy = this;
          this.kickCooldown = GameConfig.TIMING.KICK_COOLDOWN;
        
          // Momentum impact: Jogador perde velocidade pós-chute
          this.sprite.body.velocity.x *= 0.7;
          this.sprite.body.velocity.y *= 0.7;
          return true;
        }
        
        updateRunAnimation(speed) {
          const lean = speed / this.stats.speed * GameConfig.VISUAL.RUN_LEAN_ANGLE;
          const lateralLean = Math.abs(this.targetDirection - this.currentAngle) * 0.5; // Inclinação ao virar
          this.body.setRotation(lean + lateralLean); // Rotaciona body
          // Head bob: Oscilação sinoidal
          this.head.setY(-10 + Math.sin(this.scene.time.now / 1000 * GameConfig.VISUAL.RUN_BOUNCE_FREQUENCY) * GameConfig.VISUAL.RUN_BOUNCE_AMPLITUDE);
        }
        
        // ... (fim do código original)
    }
}
