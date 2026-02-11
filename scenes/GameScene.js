class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('🎮 GameScene: Initializing...');

        // ===============================
        // WORLD BOUNDS
        // ===============================
        this.physics.world.setBounds(
            0,
            0,
            GameConfig.FIELD.WIDTH,
            GameConfig.FIELD.HEIGHT
        );

        // ===============================
        // FIELD
        // ===============================
        this.add.rectangle(
            GameConfig.FIELD.WIDTH / 2,
            GameConfig.FIELD.HEIGHT / 2,
            GameConfig.FIELD.WIDTH,
            GameConfig.FIELD.HEIGHT,
            GameConfig.FIELD.COLOR
        );

        // ===============================
        // BALL
        // ===============================
        this.ball = this.add.circle(
            GameConfig.FIELD.WIDTH / 2,
            GameConfig.FIELD.HEIGHT / 2,
            8,
            0xffffff
        );

        this.physics.add.existing(this.ball);

        this.ball.body.setCollideWorldBounds(true);
        this.ball.body.setBounce(0.9);
        this.ball.body.setDrag(50, 50);

        // ===============================
        // PLAYERS
        // ===============================
        this.players = [];

        const positions = [
            { x: 200, y: 300, color: 0xff0000 },
            { x: 200, y: 500, color: 0xff0000 },
            { x: 1000, y: 300, color: 0x0000ff },
            { x: 1000, y: 500, color: 0x0000ff }
        ];

        positions.forEach(pos => {
            const player = this.add.circle(
                pos.x,
                pos.y,
                15,
                pos.color
            );

            this.physics.add.existing(player);

            player.body.setCollideWorldBounds(true);
            player.body.setBounce(0.2);
            player.body.setDrag(300, 300);

            this.players.push(player);
        });

        // ===============================
        // COLLISIONS
        // ===============================
        this.physics.add.collider(this.players, this.players);
        this.physics.add.collider(this.ball, this.players);

        // ===============================
        // CONTROLS
        // ===============================
        this.cursors = this.input.keyboard.createCursorKeys();

        // Controla apenas o primeiro jogador
        this.controlledPlayer = this.players[0];

        console.log('✅ GameScene: Initialization complete');
    }

    update() {
        if (!this.controlledPlayer) return;

        const speed = 250;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown) vx = -1;
        if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1;
        if (this.cursors.down.isDown) vy = 1;

        // Normaliza diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        this.controlledPlayer.body.setVelocity(vx * speed, vy * speed);
    }
}

