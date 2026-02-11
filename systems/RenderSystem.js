/**
 * RenderSystem.js
 * 
 * Sistema responsável por renderizar elementos visuais do jogo
 */

class RenderSystem {
    constructor(scene) {
        this.scene = scene;
    }
    
    /**
     * Renderiza o campo de futebol
     */
    renderField() {
        const { WIDTH, HEIGHT, COLOR, LINE_COLOR, LINE_WIDTH } = GameConfig.FIELD;
        
        // Fundo do campo
        this.scene.add.rectangle(
            WIDTH / 2, 
            HEIGHT / 2, 
            WIDTH, 
            HEIGHT, 
            COLOR
        );
        
        // Linha central
        this.scene.add.line(
            0, 0,
            WIDTH / 2, 0,
            WIDTH / 2, HEIGHT,
            LINE_COLOR
        ).setOrigin(0).setLineWidth(LINE_WIDTH);
        
        // Círculo central
        const centerCircle = this.scene.add.circle(
            WIDTH / 2, 
            HEIGHT / 2, 
            80
        );
        centerCircle.setStrokeStyle(LINE_WIDTH, LINE_COLOR);
        
        // Área de gol esquerda
        this.scene.add.rectangle(
            0, 
            HEIGHT / 2, 
            150, 
            300
        ).setOrigin(0, 0.5).setStrokeStyle(LINE_WIDTH, LINE_COLOR);
        
        // Área de gol direita
        this.scene.add.rectangle(
            WIDTH, 
            HEIGHT / 2, 
            150, 
            300
        ).setOrigin(1, 0.5).setStrokeStyle(LINE_WIDTH, LINE_COLOR);
    }
    
    /**
     * Renderiza as balizas
     */
    renderGoals() {
        const { WIDTH, HEIGHT } = GameConfig.FIELD;
        const goalHeight = 200;
        const goalDepth = 20;
        
        // Gol esquerdo
        this.leftGoal = this.scene.add.rectangle(
            0, 
            HEIGHT / 2, 
            goalDepth, 
            goalHeight, 
            0xcccccc
        ).setOrigin(1, 0.5);
        
        // Gol direito
        this.rightGoal = this.scene.add.rectangle(
            WIDTH, 
            HEIGHT / 2, 
            goalDepth, 
            goalHeight, 
            0xcccccc
        ).setOrigin(0, 0.5);
    }
    
    /**
     * Cria a bola (CORRIGIDO PARA ARCADE PHYSICS)
     */
    createBall() {
        const { WIDTH, HEIGHT } = GameConfig.FIELD;
        const radius = GameConfig.PHYSICS.BALL.RADIUS;

        // Cria visual da bola
        const ball = this.scene.add.circle(
            WIDTH / 2,
            HEIGHT / 2,
            radius,
            0xffffff
        );

        // Adiciona física Arcade
        this.scene.physics.add.existing(ball);

        // Configura corpo físico
        ball.body.setCircle(radius);
        ball.body.setCollideWorldBounds(true);
        ball.body.setBounce(GameConfig.PHYSICS.BALL.BOUNCE);
        ball.body.setDamping(true);
        ball.body.setDrag(GameConfig.PHYSICS.BALL.DRAG);
        ball.body.setMaxVelocity(GameConfig.PHYSICS.BALL.MAX_SPEED);

        ball.lastTouchedBy = null;

        return ball;
    }
    
    /**
     * Cria interface do usuário
     */
    createUI() {
        const ui = {};
        
        // Placar
        ui.scoreText = this.scene.add.text(
            GameConfig.FIELD.WIDTH / 2, 
            20, 
            '0 - 0', 
            { fontSize: '32px', fill: '#fff', fontFamily: 'Arial Black' }
        ).setOrigin(0.5).setDepth(100);
        
        // Tempo
        ui.timeText = this.scene.add.text(
            GameConfig.FIELD.WIDTH / 2, 
            60, 
            '0:00', 
            { fontSize: '24px', fill: '#fff' }
        ).setOrigin(0.5).setDepth(100);
        
        // Controles
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
    
    /**
     * Atualiza placar
     */
    updateScore(team1Score, team2Score, ui) {
        if (ui.scoreText) {
            ui.scoreText.setText(`${team1Score} - ${team2Score}`);
        }
    }
    
    /**
     * Atualiza tempo
     */
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
