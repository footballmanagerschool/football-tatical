/**
 * RenderSystem.js
 * Sistema responsável por renderizar elementos visuais do jogo
 */

class RenderSystem {
    constructor(scene) {
        this.scene = scene;
    }

    renderField() {
        const { WIDTH, HEIGHT, COLOR, LINE_COLOR, LINE_WIDTH } = GameConfig.FIELD;

        const graphics = this.scene.add.graphics();

        // Fundo
        graphics.fillStyle(COLOR, 1);
        graphics.fillRect(0, 0, WIDTH, HEIGHT);

        // Linha central
        graphics.lineStyle(LINE_WIDTH, LINE_COLOR);
        graphics.lineBetween(WIDTH / 2, 0, WIDTH / 2, HEIGHT);

        // Círculo central
        graphics.strokeCircle(WIDTH / 2, HEIGHT / 2, 80);

        // Área esquerda
        graphics.strokeRect(0, HEIGHT / 2 - 150, 150, 300);

        // Área direita
        graphics.strokeRect(WIDTH - 150, HEIGHT / 2 - 150, 150, 300);
    }

    renderGoals() {
        const { WIDTH, HEIGHT } = GameConfig.FIELD;
        const goalHeight = 200;
        const goalDepth = 20;

        this.leftGoal = this.scene.add.rectangle(
            0,
            HEIGHT / 2,
            goalDepth,
            goalHeight,
            0xcccccc
        ).setOrigin(1, 0.5);

        this.rightGoal = this.scene.add.rectangle(
            WIDTH,
            HEIGHT / 2,
            goalDepth,
            goalHeight,
            0xcccccc
        ).setOrigin(0, 0.5);
    }

    createBall() {
        const { WIDTH, HEIGHT } = GameConfig.FIELD;
        const radius = GameConfig.PHYSICS.BALL.RADIUS;

        // Desenha círculo
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(0, 0, radius);

        // Container
        const ball = this.scene.add.container(WIDTH / 2, HEIGHT / 2);
        ball.add(graphics);

        // Física
        this.scene.physics.add.existing(ball);

        ball.body.setCircle(radius);
        ball.body.setCollideWorldBounds(true);
        ball.body.setBounce(GameConfig.PHYSICS.BALL.BOUNCE);
        ball.body.setDrag(200);
        ball.body.setMaxVelocity(GameConfig.PHYSICS.BALL.MAX_SPEED);

        ball.lastTouchedBy = null;

        return ball;
    }

    createUI() {
        const ui = {};

        ui.scoreText = this.scene.add.text(
            GameConfig.FIELD.WIDTH / 2,
            20,
            '0 - 0',
            { fontSize: '32px', fill: '#fff', fontFamily: 'Arial Black' }
        ).setOrigin(0.5).setDepth(100);

        ui.timeText = this.scene.add.text(
            GameConfig.FIELD.WIDTH / 2,
            60,
            '0:00',
            { fontSize: '24px', fill: '#fff' }
        ).setOrigin(0.5).setDepth(100);

        ui.controlsText = this.scene.add.text(
            20,
            GameConfig.FIELD.HEIGHT - 100,
            '',
            {
                fontSize: '16px',
                fill: '#fff',
                backgroundColor: '#000000aa',
                padding: { x: 10, y: 10 }
            }
        ).setDepth(100);

        return ui;
    }

    updateScore(team1Score, team2Score, ui) {
        if (ui.scoreText) {
            ui.scoreText.setText(`${team1Score} - ${team2Score}`);
        }
    }

    updateTime(seconds, ui) {
        if (ui.timeText) {
            const minutes = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            ui.timeText.setText(
                `${minutes}:${secs.toString().padStart(2, '0')}`
            );
        }
    }
}
