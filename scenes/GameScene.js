/**
 * GameScene.js
 * 
 * Main game scene that integrates all systems.
 * Coordinates between Player entities, AI systems, and rendering.
 * 
 * ARCHITECTURAL DECISION:
 * - Scene is thin coordinator, delegates to systems
 * - Clean separation: Scene manages lifecycle, Systems manage logic
 * - Easy to test and maintain
 * - Easy to add new game modes/scenes
 */

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    create() {
        console.log('🎮 GameScene: Initializing...');
        
        // ============================================
        // INITIALIZE SYSTEMS
        // ============================================
        this.renderSystem = new RenderSystem(this);
        this.zoneSystem = new ZoneSystem(this);
        this.movementSystem = new MovementSystem(this);
        this.defenseSystem1 = new DefenseSystem(this); // Team 1
        this.defenseSystem2 = new DefenseSystem(this); // Team 2
        this.decisionSystem1 = new DecisionSystem(this, this.defenseSystem1, this.movementSystem, this.zoneSystem);
        this.decisionSystem2 = new DecisionSystem(this, this.defenseSystem2, this.movementSystem, this.zoneSystem);
        
        // Novos systems
        this.ballControlSystem = new BallControlSystem();
        this.shootingSystem = new ShootingSystem();
        
        // ============================================
        // RENDER FIELD
        // ============================================
        this.renderSystem.renderField();
        this.renderSystem.renderGoals();
        
        // ============================================
        // CREATE BALL
        // ============================================
        this.ball = this.renderSystem.createBall();
        
        // ============================================
        // CREATE PLAYERS
        // ============================================
        this.team1Players = [];
        this.team2Players = [];
        
        this.createTeams();
        
        // ============================================
        // PHYSICS GROUPS
        // ============================================
        this.playersGroup = this.physics.add.group();
        this.team1Players.forEach(p => this.playersGroup.add(p.sprite));
        this.team2Players.forEach(p => this.playersGroup.add(p.sprite));
        
        // ============================================
        // COLLISIONS
        // ============================================
        this.physics.add.collider(this.ball, this.playersGroup, this.handleBallPlayerCollision, null, this);
        this.physics.add.collider(this.playersGroup, this.playersGroup);
        
        // ============================================
        // ASSIGN ZONES
        // ============================================
        this.zoneSystem.assignPlayerZones([...this.team1Players, ...this.team2Players]);
        
        // ============================================
        // UI
        // ============================================
        this.ui = this.renderSystem.createUI();
        
        // ============================================
        // GAME STATE
        // ============================================
        this.gameState = {
            score: { team1: 0, team2: 0 },
            matchTime: 0,
            matchDuration: GameConfig.TIMING.MATCH_DURATION,
            isPaused: false,
            gameStarted: false,
            currentPlayer: null,
            controlsText: ''
        };
        
        // ============================================
        // CONTROLS
        // ============================================
        this.setupControls();
        
        // ============================================
        // START SEQUENCE
        // ============================================
        this.showPlayerSelection();
        
        console.log('✅ GameScene: Initialization complete');
        console.log(`📊 Team 1 Players: ${this.team1Players.length}`);
        console.log(`📊 Team 2 Players: ${this.team2Players.length}`);
    }
    
    handleBallPlayerCollision(playerSprite, ball) {
        const player = playerSprite.player; // Assuma que sprite tem ref ao Player
        if (player.kickCooldown > 0) return; // Ignora colisão durante cooldown

        const dist = MathHelpers.distance(player.x, player.y, ball.x, ball.y);
        if (dist < GameConfig.PHYSICS.PLAYER.COLLISION_RADIUS + 5) { // Threshold
          // Aplicar bounce suave em vez de reset
          const angle = MathHelpers.angleBetween(ball.x, ball.y, player.x, player.y);
          ball.setVelocity(
            ball.body.velocity.x + Math.cos(angle) * GameConfig.PHYSICS.BALL.BOUNCE * 50,
            ball.body.velocity.y + Math.sin(angle) * GameConfig.PHYSICS.BALL.BOUNCE * 50
          );
          player.sprite.body.velocity.x *= 0.8; // Damping no jogador
          player.sprite.body.velocity.y *= 0.8;
        }
      }
    
    // ... (o restante do código original de GameScene.js continua aqui, incluindo update(), createTeams(), etc.)
    // No update(), adicione chamadas aos novos systems:
    // this.ballControlSystem.updateDribble(/* player com bola */, this.ball); // Condicional se state === 'DRIBBLING'
    // Para chute, em controlPlayer: this.shootingSystem.handleShoot(player, this.ball, targetX, targetY, chargeTime);

    showPauseMenu() {
        this.pauseMenu = this.add.container(600, 400).setDepth(200);
        const bg = this.add.rectangle(0, 0, 500, 300, 0x000000, 0.9).setOrigin(0.5);
        const title = this.add.text(0, -80, 'PAUSED', { fontSize: '40px', fontFamily: 'Arial Black', fill: '#fff' }).setOrigin(0.5);
        
        const resumeBtn = this.add.text(0, 0, 'Resume', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        resumeBtn.on('pointerdown', () => this.togglePause());
        
        const settingsBtn = this.add.text(0, 50, 'Settings', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        settingsBtn.on('pointerdown', () => this.scene.start('SettingsScene'));
        
        const quitBtn = this.add.text(0, 100, 'Quit', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        quitBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
        
        this.pauseMenu.add([bg, title, resumeBtn, settingsBtn, quitBtn]);
    }

    // ... (fim do código original)
}
