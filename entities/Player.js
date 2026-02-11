/**
 * Player.js
 * Entidade principal do jogador
 */

class Player {
    constructor(scene, config) {
        this.scene = scene;

        this.team = config.team;
        this.playerName = config.name || 'Jogador';
        this.role = config.role || 'SHOOTER';
        this.index = config.index || 0;

        this.x = config.x;
        this.y = config.y;
        this.basePosition = { x: config.x, y: config.y };

        this.stats = config.stats || {
            speed: 150,
            shootPower: 100,
            stamina: 100,
            dribble: 100
        };

        this.maxSpeed = this.stats.speed;
        this.kickCooldown = 0;

        this.createSprite();
    }

    createSprite() {
        const color = this.team === 1
            ? GameConfig.TEAMS.TEAM1.COLOR
            : GameConfig.TEAMS.TEAM2.COLOR;

        const radius = GameConfig.VISUAL.PLAYER_SIZE / 2;

        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.fillCircle(0, 0, radius);

        this.sprite = this.scene.add.container(this.x, this.y);
        this.sprite.add(graphics);

        this.scene.physics.add.existing(this.sprite);

        this.sprite.body.setCircle(radius);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.2);
        this.sprite.body.setDrag(300);

        this.sprite.player = this;

        this.nameText = this.scene.add.text(
            this.x,
            this.y - 25,
            this.playerName,
            { fontSize: '12px', fill: '#fff' }
        ).setOrigin(0.5);
    }

    update(delta) {
        this.x = this.sprite.x;
        this.y = this.sprite.y;

        if (this.nameText) {
            this.nameText.setPosition(this.x, this.y - 25);
        }

        if (this.kickCooldown > 0) {
            this.kickCooldown -= delta;
        }
    }

    moveTo(targetX, targetY) {
        const angle = Phaser.Math.Angle.Between(
            this.x,
            this.y,
            targetX,
            targetY
        );

        this.sprite.body.setVelocity(
            Math.cos(angle) * this.maxSpeed,
            Math.sin(angle) * this.maxSpeed
        );
    }

    stop() {
        this.sprite.body.setVelocity(0, 0);
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.nameText) this.nameText.destroy();
    }
}
