class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        console.log('🎮 GameScene: Initializing...');

        // Sistemas
        this.renderSystem = new RenderSystem(this);
        this.zoneSystem = new ZoneSystem(this);
        this.movementSystem = new MovementSystem(this);
        this.defenseSystem1 = new DefenseSystem(this);
        this.defenseSystem2 = new DefenseSystem(this);
        this.decisionSystem1 = new DecisionSystem(this, this.defenseSystem1, this.movementSystem, this.zoneSystem);
        this.decisionSystem2 = new DecisionSystem(this, this.defenseSystem2, this.movementSystem, this.zoneSystem);
        this.ballControlSystem = new BallControlSystem();
        this.shootingSystem = new ShootingSystem();

        // Campo
        this.renderSystem.renderField();
        this.renderSystem.renderGoals();

        // Bola
        this.ball = this.renderSystem.createBall();

        // Times
        this.team1Players = [];
        this.team2Players = [];
        this.createTeams();

        // Grupo de física
        this.playersGroup = this.physics.add.group();

        [...this.team1Players, ...this.team2Players].forEach(p => {
            p.sprite.player = p;
            this.playersGroup.add(p.sprite);
        });

        // Colisões
        this.physics.add.collider(this.ball, this.playersGroup, this.handleBallPlayerCollision, null, this);
        this.physics.add.collider(this.playersGroup, this.playersGroup);

        // UI
        this.ui = this.renderSystem.createUI();

        // Estado do jogo
        this.gameState = {
            score: { team1: 0, team2: 0 },
            matchTime: 0,
            matchDuration: GameConfig.TIMING.MATCH_DURATION,
            isPaused: false,
            gameStarted: false,
            selectedPlayer: null,
            chargeTime: 0,
            isCharging: false
        };

        this.setupControls();
        this.startGame();

        console.log('✅ GameScene pronta');
    }

    // =========================
    // CRIA TIMES
    // =========================
    createTeams() {
        const formations = {
            team1: [
                { x: 200, y: 300, role: 'DEFENDER' },
                { x: 200, y: 500, role: 'DEFENDER' },
                { x: 400, y: 350, role: 'MIDFIELDER' },
                { x: 400, y: 450, role: 'SHOOTER' }
            ],
            team2: [
                { x: 1000, y: 300, role: 'DEFENDER' },
                { x: 1000, y: 500, role: 'DEFENDER' },
                { x: 800, y: 350, role: 'MIDFIELDER' },
                { x: 800, y: 450, role: 'SHOOTER' }
            ]
        };

        formations.team1.forEach((pos, i) => {
            const player = new Player(this, {
                team: 1,
                x: pos.x,
                y: pos.y,
                role: pos.role,
                index: i
            });
            this.team1Players.push(player);
        });

        formations.team2.forEach((pos, i) => {
            const player = new Player(this, {
                team: 2,
                x: pos.x,
                y: pos.y,
                role: pos.role,
                index: i
            });
            this.team2Players.push(player);
        });
    }

    // =========================
    // CONTROLES
    // =========================
    setupControls() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    startGame() {
        this.gameState.gameStarted = true;
        this.gameState.matchTime = 0;

        if (this.team1Players.length > 0) {
            this.gameState.selectedPlayer = this.team1Players[0];
        }
    }

    // =========================
    // UPDATE
    // =========================
    update(time, delta) {
        if (!this.gameState.gameStarted || this.gameState.isPaused) return;

        const deltaSeconds = delta / 1000;
        this.gameState.matchTime += deltaSeconds;

        if (this.gameState.selectedPlayer) {
            this.controlPlayer(this.gameState.selectedPlayer, deltaSeconds);
        }

        [...this.team1Players, ...this.team2Players].forEach(player => {
            player.update(deltaSeconds);
        });
    }

    // =========================
    // CONTROLE DO JOGADOR
    // =========================
    controlPlayer(player, delta) {

        const speed = player.maxSpeed || 200;
        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown) vx = -1;
        if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1;
        if (this.cursors.down.isDown) vy = 1;

        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }

        const body = player.sprite.body;

        if (vx !== 0 || vy !== 0) {
            body.setVelocity(vx * speed, vy * speed);
        } else {
            body.setVelocity(
                body.velocity.x * 0.9,
                body.velocity.y * 0.9
            );

            if (Math.abs(body.velocity.x) < 1 &&
                Math.abs(body.velocity.y) < 1) {

                body.setVelocity(0, 0);
            }
        }

        // CHUTE
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.gameState.isCharging = true;
            this.gameState.chargeTime = 0;
        }

        if (this.spaceKey.isDown && this.gameState.isCharging) {
            this.gameState.chargeTime += delta;
        }

        if (this.spaceKey.isUp && this.gameState.isCharging) {

            const targetX = GameConfig.FIELD.WIDTH;
            const targetY = GameConfig.FIELD.HEIGHT / 2;

            this.shootingSystem.handleShoot(
                player,
                this.ball,
                targetX,
                targetY,
                this.gameState.chargeTime
            );

            this.gameState.isCharging = false;
            this.gameState.chargeTime = 0;
        }
    }

    // =========================
    // COLISÃO BOLA
    // =========================
    handleBallPlayerCollision(ball, playerSprite) {

        const player = playerSprite.player;
        if (!player) return;

        const angle = Phaser.Math.Angle.Between(
            player.sprite.x,
            player.sprite.y,
            ball.x,
            ball.y
        );

        ball.setVelocity(
            ball.body.velocity.x + Math.cos(angle) * 100,
            ball.body.velocity.y + Math.sin(angle) * 100
        );
    }
}
