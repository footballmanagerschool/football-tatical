/**
 * Player.js
 * 
 * Main player entity with FSM, stats, and visual representation.
 */

class Player {
    constructor(scene, config) {
        this.scene = scene;

        // ==============================
        // CORE
        // ==============================
        this.team = config.team;
        this.playerName = config.name || 'Jogador';
        this.role = config.role || 'SHOOTER';
        this.index = config.index || 0;

        // ==============================
        // POSITION
        // ==============================
        this.x = config.x;
        this.y = config.y;
        this.basePosition = { x: config.x, y: config.y };

        // ==============================
        // STATS SAFE LOAD
        // ==============================
        const roleConfig = GameConfig?.ROLES?.[this.role] || { statModifiers: {} };

        this.stats = {
            speed: (config.stats?.speed || 150) * (roleConfig.statModifiers?.speed || 1),
            shootPower: (config.stats?.shootPower || 100) * (roleConfig.statModifiers?.shootPower || 1),
            stamina: config.stats?.stamina || 100,
            dribble: (config.stats?.dribble || 100) * (roleConfig.statModifiers?.dribble || 1),
            defense: 80 * (roleConfig.statModifiers?.defense || 1),
            reaction: 70,
            aggression: 60
        };

        this.staminaCurrent = this.stats.stamina;
        this.maxSpeed = this.stats.speed * 0.6;

        // ==============================
        // STATE
        // ==============================
        this.state = PlayerStates?.IDLE || "IDLE";
        this.previousState = this.state;

        // ==============================
        // COOLDOWNS
        // ==============================
        this.kickCooldown = 0;
        this.actionCooldown = 0;

        // ==============================
        // CREATE VISUAL
        // ==============================
        this.createSprite();
    }

    /**
     * Cria sprite com física Arcade (100% seguro)
     */
    createSprite() {

        const size = GameConfig?.VISUAL?.PLAYER_SIZE || 40;
        const radius = size / 2;

        const teamColor =
            this.team === 1
                ? (GameConfig?.TEAMS?.TEAM1?.COLOR || 0x0066ff)
                : (GameConfig?.TEAMS?.TEAM2?.COLOR || 0xff3333);

        const textureKey = `player_texture_${this.team}_${size}`;

        // Criar textura se não existir
        if (!this.scene.textures.exists(textureKey)) {

            const graphics = this.scene.add.graphics();

            graphics.fillStyle(teamColor, 1);
            graphics.fillCircle(radius, radius, radius);

            // 🔥 Proteção contra largura/altura 0
            const safeSize = Math.max(2, size);

            graphics.generateTexture(textureKey, safeSize, safeSize);
            graphics.destroy();
        }

        // Criar sprite físico
        this.sprite = this.scene.physics.add.image(
            this.x,
            this.y,
            textureKey
        );

        this.sprite.setCircle(radius);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0.2);
        this.sprite.setDamping(true);
        this.sprite.setDrag(200);
        this.sprite.setMaxVelocity(this.maxSpeed);

        this.sprite.player = this;

        // Nome do jogador
        this.nameText = this.scene.add.text(
            this.x,
            this.y - radius - 12,
            this.playerName,
            {
                fontSize: '12px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
    }

    /**
     * Atualização por frame
     */
    update(delta) {

        // Sincroniza posição lógica
        this.x = this.sprite.x;
        this.y = this.sprite.y;

        // Atualiza nome
        if (this.nameText) {
            this.nameText.setPosition(
                this.sprite.x,
                this.sprite.y - (GameConfig?.VISUAL?.PLAYER_SIZE || 40) / 2 - 12
            );
        }

        // Cooldowns
        if (this.kickCooldown > 0) {
            this.kickCooldown -= delta;
        }

        if (this.actionCooldown > 0) {
            this.actionCooldown -= delta;
        }

        // Recuperação de stamina
        if (this.staminaCurrent < this.stats.stamina) {
            this.staminaCurrent += 10 * delta;
            this.staminaCurrent = Math.min(this.stats.stamina, this.staminaCurrent);
        }
    }

    /**
     * Chute simples
     */
    kick(ball, targetX, targetY, chargeTime = 0) {

        if (this.kickCooldown > 0) return false;

        const maxCharge = 1.5;
        const normalized = Math.min(chargeTime, maxCharge) / maxCharge;
        const power = Phaser.Math.Linear(200, 800, normalized);

        const angle = Phaser.Math.Angle.Between(
            this.x,
            this.y,
            targetX,
            targetY
        );

        ball.setVelocity(
            Math.cos(angle) * power,
            Math.sin(angle) * power
        );

        ball.lastTouchedBy = this;
        this.kickCooldown = 0.5;

        return true;
    }

    stop() {
        this.sprite.setVelocity(0, 0);
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.nameText) this.nameText.destroy();
    }
}
