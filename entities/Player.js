/**
 * Player.js
 * 
 * Main player entity with FSM, stats, and visual representation.
 */

class Player {
    constructor(scene, config) {
        this.scene = scene;
        
        // ============================================
        // CORE PROPERTIES
        // ============================================
        this.team = config.team;
        this.playerName = config.name || 'Jogador';
        this.role = config.role || 'SHOOTER';
        this.index = config.index || 0;
        
        // ============================================
        // POSITION & MOVEMENT
        // ============================================
        this.x = config.x;
        this.y = config.y;
        this.basePosition = { x: config.x, y: config.y };
        this.currentVelocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        
        // Momentum properties
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
            speed: (config.stats?.speed || 150) * (roleConfig.statModifiers.speed || 1),
            shootPower: (config.stats?.shootPower || 100) * (roleConfig.statModifiers.shootPower || 1),
            stamina: config.stats?.stamina || 100,
            dribble: (config.stats?.dribble || 100) * (roleConfig.statModifiers.dribble || 1),
            defense: 80 * (roleConfig.statModifiers.defense || 1),
            reaction: 70,
            aggression: 60
        };
        
        this.staminaCurrent = this.stats.stamina;
        this.maxSpeed = this.stats.speed * 0.6;
        
        // ============================================
        // STATE MACHINE
        // ============================================
        this.state = PlayerStates.IDLE;
        this.previousState = PlayerStates.IDLE;
        
        // ============================================
        // ZONE & AI
        // ============================================
        this.assignedZone = null;
        this.currentTarget = null;
        
        // ============================================
        // COOLDOWNS
        // ============================================
        this.kickCooldown = 0;
        this.actionCooldown = 0;
        
        // ============================================
        // VISUAL REPRESENTATION
        // ============================================
        this.createSprite();
    }
    
    /**
     * Cria representação visual do jogador
     */
    createSprite() {
        const color = this.team === 1 ? GameConfig.TEAMS.TEAM1.COLOR : GameConfig.TEAMS.TEAM2.COLOR;
        
        // Corpo do jogador (círculo)
        this.sprite = this.scene.physics.add.circle(
            this.x, 
            this.y, 
            GameConfig.VISUAL.PLAYER_SIZE / 2, 
            color
        );
        
        // Configurações de física
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0.2);
        this.sprite.setDamping(true);
        this.sprite.setDrag(0.5);
        
        // Referência ao Player no sprite
        this.sprite.player = this;
        
        // Nome do jogador
        this.nameText = this.scene.add.text(
            this.x, 
            this.y - 25, 
            this.playerName, 
            { fontSize: '12px', fill: '#fff' }
        ).setOrigin(0.5);
    }
    
    /**
     * Atualiza posição do jogador
     */
    update(delta) {
        // Atualiza posição baseada no sprite físico
        this.x = this.sprite.x;
        this.y = this.sprite.y;
        
        // Atualiza texto do nome
        if (this.nameText) {
            this.nameText.setPosition(this.x, this.y - 25);
        }
        
        // Atualiza cooldowns
        if (this.kickCooldown > 0) {
            this.kickCooldown -= delta;
        }
        if (this.actionCooldown > 0) {
            this.actionCooldown -= delta;
        }
        
        // Atualiza stamina
        if (this.isSprinting && this.staminaCurrent > 0) {
            this.staminaCurrent -= GameConfig.TIMING.STAMINA_DRAIN_RATE * delta;
            this.staminaCurrent = Math.max(0, this.staminaCurrent);
        } else if (this.staminaCurrent < this.stats.stamina) {
            this.staminaCurrent += GameConfig.TIMING.STAMINA_RECOVERY_RATE * delta;
            this.staminaCurrent = Math.min(this.stats.stamina, this.staminaCurrent);
        }
        
        // Atualiza animação de corrida
        const speed = Math.sqrt(
            this.sprite.body.velocity.x ** 2 + 
            this.sprite.body.velocity.y ** 2
        );
        if (speed > 10) {
            this.updateRunAnimation(speed);
        }
    }
    
    /**
     * Chuta a bola
     */
    kick(ball, targetX, targetY, chargeTime = 0) {
        if (this.kickCooldown > 0) return false;
        
        // Calcula poder do chute baseado no tempo de carga
        const maxChargeTime = 1.5;
        const normalizedCharge = Math.min(chargeTime, maxChargeTime) / maxChargeTime;
        const power = MathHelpers.lerp(200, 800, normalizedCharge);
        
        // Calcula ângulo do chute
        const baseAngle = MathHelpers.angleBetween(this.x, this.y, targetX, targetY);
        
        // Adiciona erro baseado em stamina e velocidade
        const staminaFactor = 1 - (this.staminaCurrent / this.stats.stamina);
        const speedFactor = this.currentSpeed / this.stats.speed;
        const errorRange = 0.15 * staminaFactor + speedFactor * 0.1;
        const error = MathHelpers.randomGaussian(0, errorRange);
        const angle = baseAngle + error;
        
        // Aplica velocidade na bola
        ball.setVelocity(
            Math.cos(angle) * power, 
            Math.sin(angle) * power
        );
        
        // Marca último jogador que tocou
        ball.lastTouchedBy = this;
        
        // Define cooldown
        this.kickCooldown = GameConfig.TIMING.KICK_COOLDOWN;
        
        // Impacto no momentum do jogador
        this.sprite.body.velocity.x *= 0.7;
        this.sprite.body.velocity.y *= 0.7;
        
        return true;
    }
    
    /**
     * Atualiza animação de corrida
     */
    updateRunAnimation(speed) {
        // Calcula inclinação baseada na velocidade
        const currentAngle = Math.atan2(
            this.sprite.body.velocity.y, 
            this.sprite.body.velocity.x
        );
        
        const lean = (speed / this.stats.speed) * GameConfig.VISUAL.RUN_LEAN_ANGLE;
        const lateralLean = Math.abs(this.targetDirection - currentAngle) * 0.5;
        
        // Rotaciona sprite
        this.sprite.setRotation(lean + lateralLean);
        
        // Animação de bounce (pode ser usada para sprites futuros)
        const bounceOffset = Math.sin(
            this.scene.time.now / 1000 * GameConfig.VISUAL.RUN_BOUNCE_FREQUENCY
        ) * GameConfig.VISUAL.RUN_BOUNCE_AMPLITUDE;
        
        // Salva offset para uso futuro
        this.bounceOffset = bounceOffset;
    }
    
    /**
     * Move jogador em direção a um ponto
     */
    moveTo(targetX, targetY, sprint = false) {
        const angle = MathHelpers.angleBetween(this.x, this.y, targetX, targetY);
        const distance = MathHelpers.distance(this.x, this.y, targetX, targetY);
        
        // Define velocidade baseada em sprint e stamina
        let speed = this.maxSpeed;
        if (sprint && this.staminaCurrent > 0) {
            speed *= GameConfig.PHYSICS.PLAYER.SPRINT_MULTIPLIER;
            this.isSprinting = true;
        } else {
            this.isSprinting = false;
        }
        
        // Diminui velocidade ao se aproximar do alvo
        if (distance < 50) {
            speed *= (distance / 50);
        }
        
        // Aplica velocidade
        this.sprite.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        
        this.targetDirection = angle;
        this.state = PlayerStates.RUNNING;
    }
    
    /**
     * Para o jogador
     */
    stop() {
        this.sprite.setVelocity(0, 0);
        this.state = PlayerStates.IDLE;
        this.isSprinting = false;
    }
    
    /**
     * Muda estado do jogador
     */
    setState(newState) {
        this.previousState = this.state;
        this.state = newState;
    }
    
    /**
     * Destrói jogador
     */
    destroy() {
        if (this.sprite) {
            this.sprite.destroy();
        }
        if (this.nameText) {
            this.nameText.destroy();
        }
    }
}
