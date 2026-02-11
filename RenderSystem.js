/**
 * RenderSystem.js
 * 
 * Handles all visual updates and rendering.
 * Separated from game logic for clean architecture.
 * 
 * ARCHITECTURAL DECISION:
 * - Pure rendering logic, no game logic
 * - Can be easily replaced/upgraded without touching game code
 * - Prepared for visual effects and animations
 */

class RenderSystem {
    constructor(scene) {
        this.scene = scene;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(0);
    }
    
    /**
     * Render field (called once during create)
     */
    renderField() {
        const field = GameConfig.FIELD;
        const stripeWidth = field.WIDTH / 20;
        
        // Draw striped grass pattern
        for (let i = 0; i < 20; i++) {
            const color = i % 2 === 0 ? 0x228B22 : 0x32CD32;
            this.graphics.fillStyle(color, 1);
            this.graphics.fillRect(
                field.X + (i * stripeWidth),
                field.Y,
                stripeWidth,
                field.HEIGHT
            );
        }
        
        // Field borders
        this.graphics.lineStyle(4, 0xffffff, 1);
        this.graphics.strokeRect(field.X, field.Y, field.WIDTH, field.HEIGHT);
        
        // Center line
        this.graphics.lineStyle(3, 0xffffff, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(600, field.Y);
        this.graphics.lineTo(600, field.Y + field.HEIGHT);
        this.graphics.strokePath();
        
        // Center circle
        this.graphics.strokeCircle(600, 400, 80);
        this.graphics.fillStyle(0xffffff, 1);
        this.graphics.fillCircle(600, 400, 8);
        
        // Penalty areas - left
        this.graphics.strokeRect(field.X, field.Y + 150, 150, 300);
        this.graphics.strokeRect(field.X, field.Y + 225, 60, 150);
        
        // Penalty areas - right
        this.graphics.strokeRect(
            field.X + field.WIDTH - 150,
            field.Y + 150,
            150,
            300
        );
        this.graphics.strokeRect(
            field.X + field.WIDTH - 60,
            field.Y + 225,
            60,
            150
        );
    }
    
    /**
     * Render goals
     */
    renderGoals() {
        const leftGoal = GameConfig.GOALS.LEFT;
        const rightGoal = GameConfig.GOALS.RIGHT;
        
        // Left goal
        this.renderGoal(leftGoal, true);
        
        // Right goal
        this.renderGoal(rightGoal, false);
    }
    
    /**
     * Render individual goal
     */
    renderGoal(goal, isLeft) {
        // Goal posts
        this.graphics.lineStyle(6, 0xcccccc, 1);
        
        if (isLeft) {
            // Vertical posts
            this.graphics.beginPath();
            this.graphics.moveTo(goal.x, goal.y);
            this.graphics.lineTo(goal.x, goal.y + goal.height);
            this.graphics.strokePath();
            
            // Top bar
            this.graphics.beginPath();
            this.graphics.moveTo(goal.x, goal.y);
            this.graphics.lineTo(goal.x + goal.width, goal.y);
            this.graphics.strokePath();
            
            // Bottom bar
            this.graphics.beginPath();
            this.graphics.moveTo(goal.x, goal.y + goal.height);
            this.graphics.lineTo(goal.x + goal.width, goal.y + goal.height);
            this.graphics.strokePath();
        } else {
            // Right goal (mirrored)
            this.graphics.beginPath();
            this.graphics.moveTo(goal.x + goal.width, goal.y);
            this.graphics.lineTo(goal.x + goal.width, goal.y + goal.height);
            this.graphics.strokePath();
            
            this.graphics.beginPath();
            this.graphics.moveTo(goal.x + goal.width, goal.y);
            this.graphics.lineTo(goal.x, goal.y);
            this.graphics.strokePath();
            
            this.graphics.beginPath();
            this.graphics.moveTo(goal.x + goal.width, goal.y + goal.height);
            this.graphics.lineTo(goal.x, goal.y + goal.height);
            this.graphics.strokePath();
        }
        
        // Goal net
        this.renderNet(goal, isLeft);
    }
    
    /**
     * Render goal net
     */
    renderNet(goal, isLeft) {
        this.graphics.lineStyle(2, 0xffffff, 0.6);
        
        const netDepth = 30;
        const direction = isLeft ? -1 : 1;
        
        // Horizontal lines
        for (let i = 0; i <= 10; i++) {
            const y = goal.y + (i * (goal.height / 10));
            this.graphics.beginPath();
            
            if (isLeft) {
                this.graphics.moveTo(goal.x, y);
                this.graphics.lineTo(goal.x - netDepth, y);
            } else {
                this.graphics.moveTo(goal.x + goal.width, y);
                this.graphics.lineTo(goal.x + goal.width + netDepth, y);
            }
            
            this.graphics.strokePath();
        }
        
        // Vertical lines
        for (let i = 0; i <= 5; i++) {
            const x = isLeft ?
                goal.x - (i * 6) :
                goal.x + goal.width + (i * 6);
            
            this.graphics.beginPath();
            this.graphics.moveTo(x, goal.y);
            this.graphics.lineTo(x, goal.y + goal.height);
            this.graphics.strokePath();
        }
    }
    
    /**
     * Create ball visual
     */
    createBall() {
        const ballGraphics = this.scene.add.graphics();
        
        // White circle
        ballGraphics.fillStyle(0xffffff, 1);
        ballGraphics.fillCircle(10, 10, 10);
        
        // Black outline
        ballGraphics.lineStyle(2, 0x000000, 1);
        ballGraphics.strokeCircle(10, 10, 10);
        
        // Pentagon pattern
        ballGraphics.fillStyle(0x000000, 1);
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5;
            const x = 10 + Math.cos(angle) * 6;
            const y = 10 + Math.sin(angle) * 6;
            ballGraphics.fillCircle(x, y, 3);
        }
        
        ballGraphics.generateTexture('ball', 20, 20);
        ballGraphics.destroy();
        
        // Create ball sprite
        const ball = this.scene.physics.add.sprite(600, 400, 'ball');
        ball.setCircle(10);
        ball.setBounce(GameConfig.PHYSICS.BALL.BOUNCE);
        ball.setCollideWorldBounds(false);
        ball.setDamping(true);
        ball.setDrag(GameConfig.PHYSICS.BALL.DRAG);
        ball.setDepth(10);
        ball.lastTouchedBy = null;
        ball.lastTouchTeam = null;
        
        return ball;
    }
    
    /**
     * Update ball visual effects
     */
    updateBall(ball, delta) {
        // Ball spin based on velocity
        const speed = Math.sqrt(
            ball.body.velocity.x ** 2 + 
            ball.body.velocity.y ** 2
        );
        
        if (speed > 50) {
            ball.rotation += (speed / 1000) * (delta / 16);
        }
        
        // Enforce ball bounds
        if (ball.x < GameConfig.FIELD.BOUNDS.minX - 50 ||
            ball.x > GameConfig.FIELD.BOUNDS.maxX + 50 ||
            ball.y < GameConfig.FIELD.BOUNDS.minY - 50 ||
            ball.y > GameConfig.FIELD.BOUNDS.maxY + 50) {
            
            // Ball went way out - reset to center
            ball.setPosition(600, 400);
            ball.setVelocity(0, 0);
        }
    }
    
    /**
     * Create goal flash effect
     */
    flashGoal(team) {
        const color = team === 1 ? [0, 255, 0] : [255, 0, 0];
        
        this.scene.cameras.main.flash(500, ...color);
        
        // Particle effect at goal
        const goalX = team === 1 ? 1150 : 50;
        const goalY = 400;
        
        this.createGoalParticles(goalX, goalY, color);
    }
    
    /**
     * Create goal celebration particles
     */
    createGoalParticles(x, y, color) {
        const particles = [];
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 200;
            
            const particle = this.scene.add.circle(
                x, y,
                3 + Math.random() * 5,
                Phaser.Display.Color.GetColor(color[0], color[1], color[2])
            );
            particle.setDepth(100);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 1000,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    /**
     * Create UI elements
     */
    createUI() {
        const ui = {
            score: this.scene.add.text(600, 30, 'Team 1: 0 x 0 :Team 2', {
                fontSize: '32px',
                fontFamily: 'Arial Black',
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 6
            }).setOrigin(0.5).setDepth(100),
            
            timer: this.scene.add.text(600, 70, 'Time: 0:00', {
                fontSize: '24px',
                fontFamily: 'Arial',
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 4
            }).setOrigin(0.5).setDepth(100),
            
            controls: this.scene.add.text(600, 680, '', {
                fontSize: '14px',
                fontFamily: 'Arial',
                fill: '#fff',
                stroke: '#000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(100)
        };
        
        return ui;
    }
    
    /**
     * Update UI
     */
    updateUI(ui, gameState) {
        if (ui.score && gameState.score) {
            ui.score.setText(
                `Team 1: ${gameState.score.team1} x ${gameState.score.team2} :Team 2`
            );
        }
        
        if (ui.timer && gameState.matchTime !== undefined) {
            const minutes = Math.floor(gameState.matchTime / 60);
            const seconds = Math.floor(gameState.matchTime % 60);
            ui.timer.setText(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
        
        if (ui.controls && gameState.controlsText) {
            ui.controls.setText(gameState.controlsText);
        }
    }
    
    /**
     * Cleanup
     */
    destroy() {
        this.graphics.destroy();
    }
}
