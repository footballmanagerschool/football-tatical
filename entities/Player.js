class Player {
    constructor(scene, config) {
        this.scene = scene;

        this.team = config.team;
        this.playerName = config.name || 'Jogador';

        this.x = config.x;
        this.y = config.y;

        this.maxSpeed = 200;

        this.createSprite();
    }

    createSprite() {

        const size = 40;
        const radius = size / 2;

        const color = this.team === 1 ? 0x0066ff : 0xff3333;

        // 🔥 Cria círculo visual NORMAL (não textura)
        this.sprite = this.scene.add.circle(
            this.x,
            this.y,
            radius,
            color
        );

        // 🔥 Adiciona física manualmente
        this.scene.physics.add.existing(this.sprite);

        this.sprite.body.setCircle(radius);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setBounce(0.2);
        this.sprite.body.setDrag(200);
        this.sprite.body.setMaxVelocity(this.maxSpeed);

        // Nome
        this.nameText = this.scene.add.text(
            this.x,
            this.y - radius - 12,
            this.playerName,
            { fontSize: '12px', fill: '#ffffff' }
        ).setOrigin(0.5);
    }

    update() {
        this.x = this.sprite.x;
        this.y = this.sprite.y;

        this.nameText.setPosition(
            this.sprite.x,
            this.sprite.y - 32
        );
    }

    stop() {
        this.sprite.body.setVelocity(0, 0);
    }

    destroy() {
        this.sprite.destroy();
        this.nameText.destroy();
    }
}
