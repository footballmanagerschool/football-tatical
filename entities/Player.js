/**
 * Player.js
 * 
 * Classe que representa um jogador em campo
 */

class Player {
    constructor(scene, config) {
        this.scene = scene;

        // Dados básicos
        this.team = config.team;
        this.x = config.x;
        this.y = config.y;
        this.basePosition = { x: config.x, y: config.y };
        this.role = config.role;
        this.playerName = config.name;
        this.index = config.index;
        this.stats = config.stats;

        // Estado
        this.state = PlayerStates.IDLE;
        this.maxSpeed = this.stats.speed;
        this.kickCooldown = 0;
        this.targetDirection = 0;

        // Criar sprite físico
        this.createSprite();
    }

    /**
     * Cria sprite físico do jogador (CORRIGIDO)
     */
    createSprite() {
        const radius = GameConfig.PHYSICS.PLAYER.RADIUS;
        const color = this.team === 1 ? 0x0066ff : 0xff3333;
        const textureKey = `player_${this.team}`;

        // Criar textura dinâmica se não existir
        if (!this.scene.textures.exists(textureKey)) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(color, 1);
            graphics.fillCircle(radius, radius, radius);
            graphics.generateTexture(textureKey, radius * 2, radius * 2);
            graphics.destroy();
        }

        // Criar sprite com física Arcade
        this.sprite = this.scene.physics.add.image(
            this.x,
            this.y,
            textureKey
        );

        this.sprite.setCircle(radius);
        this.sprite.setCollideWorldBounds(true);
        this.sprite.setBounce(0.2);
        this.sprite.setDrag(200);
        this.sprite.setMaxVelocity(this.maxSpeed);

        // Referência reversa
        this.sprite.player = this;

        // Texto do nome
        this.nameText = this.scene.add.text(
            this.x,
            this.y - radius - 15,
            this.playerName,
            {
                fontSize: '12px',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);

        return this.sprite;
    }

    /**
     * Atualiza jogador
     */
    update(delta) {
        // Atualiza posição lógica
        this.x = this.sprite.x;
        this.y = this.sprite.y;

        // Atualiza nome acima da cabeça
        if (this.nameText) {
            this.nameText.setPosition(this.x, this.y - GameConfig.PHYSICS.PLAYER.RADIUS - 15);
        }

        // Cooldown de chute
        if (this.kickCooldown > 0) {
            this.kickCooldown -= delta;
        }
    }
}
