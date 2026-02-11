/**
 * GameScene.js
 * 
 * Main game scene that integrates all systems.
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
        this.defenseSystem1 = new DefenseSystem(this);
        this.defenseSystem2 = new DefenseSystem(this);
        this.decisionSystem1 = new DecisionSystem(this, this.defenseSystem1, this.movementSystem, this.zoneSystem);
        this.decisionSystem2 = new DecisionSystem(this, this.defenseSystem2, this.movementSystem, this.zoneSystem);
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
        this.team1Players.forEach(p => {
            p.sprite.player = p;
            this.playersGroup.add(p.sprite);
        });
        this.team2Players.forEach(p => {
            p.sprite.player = p;
            this.playersGroup.add(p.sprite);
        });
        
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
            selectedPlayer: null,
            chargeTime: 0,
            isCharging: false
        };
        
        // ============================================
        // CONTROLS
        // ============================================
        this.setupControls();
        
        // ============================================
        // START GAME
        // ============================================
        this.startGame();
        
        console.log('✅ GameScene: Initialization complete');
        console.log(`📊 Team 1 Players: ${this.team1Players.length}`);
        console.log(`📊 Team 2 Players: ${this.team2Players.length}`);
    }
    
    createTeams() {
        // Formação 2-2 simples
        const formations = {
            team1: [
                { x: 200, y: 250, role: 'DEFENDER', name: 'DEF1' },
                { x: 200, y: 550, role: 'DEFENDER', name: 'DEF2' },
                { x: 400, y: 350, role: 'MIDFIELDER', name: 'MID1' },
                { x: 400, y: 450, role: 'SHOOTER', name: 'ATK1' }
            ],
            team2: [
                { x: 1000, y: 250, role: 'DEFENDER', name: 'DEF1' },
                { x: 1000, y: 550, role: 'DEFENDER', name: 'DEF2' },
                { x: 800, y: 350, role: 'MIDFIELDER', name: 'MID1' },
                { x: 800, y: 450, role: 'SHOOTER', name: 'ATK1' }
            ]
        };
        
        // Time 1
        formations.team1.forEach((pos, i) => {
            const player = new Player(this, {
                team: 1,
                x: pos.x,
                y: pos.y,
                role: pos.role,
                name: pos.name,
                index: i,
                stats: {
                    speed: 150,
                    shootPower: 100,
                    stamina: 100,
                    dribble: 100
                }
            });
            this.team1Players.push(player);
        });
        
        // Time 2
        formations.team2.forEach((pos, i) => {
            const player = new Player(this, {
                team: 2,
                x: pos.x,
                y: pos.y,
                role: pos.role,
                name: pos.name,
                index: i,
                stats: {
                    speed: 150,
                    shootPower: 100,
                    stamina: 100,
                    dribble: 100
                }
            });
            this.team2Players.push(player);
        });
    }
    
    setupControls() {
        // Keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        
        // Mouse click para selecionar jogador
        this.input.on('pointerdown', (pointer) => {
            if (this.gameState.isPaused) return;
            
            this.team1Players.forEach(player => {
                const dist = MathHelpers.distance(pointer.x, pointer.y, player.x, player.y);
                if (dist < 30) {
                    this.selectPlayer(player);
                }
            });
        });
        
        // ESC para pausar
        this.escKey.on('down', () => {
            this.togglePause();
        });
    }
    
    selectPlayer(player) {
        // Remove seleção anterior
        if (this.gameState.selectedPlayer && this.gameState.selectedPlayer.nameText) {
            this.gameState.selectedPlayer.nameText.setStyle({ fill: '#fff' });
        }
        
        // Seleciona novo jogador
        this.gameState.selectedPlayer = player;
        if (player.nameText) {
            player.nameText.setStyle({ fill: '#ffff00' });
        }
        
        this.updateControlsText();
    }
    
    updateControlsText() {
        if (this.gameState.selectedPlayer) {
            this.ui.controlsText.setText(
                `Jogador: ${this.gameState.selectedPlayer.playerName}\n` +
                `Setas: Mover | Espaço: Chutar | ESC: Pausar`
            );
        } else {
            this.ui.controlsText.setText('Clique em um jogador para controlar');
        }
    }
    
    startGame() {
        this.gameState.gameStarted = true;
        this.gameState.matchTime = 0;
        
        // Seleciona primeiro jogador do time 1
        if (this.team1Players.length > 0) {
            this.selectPlayer(this.team1Players[0]);
        }
    }
    
    handleBallPlayerCollision(ball, playerSprite) {
        const player = playerSprite.player;
        if (!player || player.kickCooldown > 0) return;

        const dist = MathHelpers.distance(player.x, player.y, ball.x, ball.y);
        if (dist < GameConfig.PHYSICS.PLAYER.COLLISION_RADIUS + 10) {
            // Bounce suave
            const angle = MathHelpers.angleBetween(ball.x, ball.y, player.x, player.y);
            ball.setVelocity(
                ball.body.velocity.x + Math.cos(angle) * 100,
                ball.body.velocity.y + Math.sin(angle) * 100
            );
            
            // Damping no jogador
            player.sprite.body.velocity.x *= 0.8;
            player.sprite.body.velocity.y *= 0.8;
        }
    }
    
    checkGoals() {
        const { WIDTH, HEIGHT } = GameConfig.FIELD;
        const goalHeight = 200;
        const goalTop = HEIGHT / 2 - goalHeight / 2;
        const goalBottom = HEIGHT / 2 + goalHeight / 2;
        
        // Gol no time 1 (esquerda)
        if (this.ball.x <= 0 && this.ball.y >= goalTop && this.ball.y <= goalBottom) {
            this.scoreGoal(2);
        }
        
        // Gol no time 2 (direita)
        if (this.ball.x >= WIDTH && this.ball.y >= goalTop && this.ball.y <= goalBottom) {
            this.scoreGoal(1);
        }
    }
    
    scoreGoal(team) {
        if (team === 1) {
            this.gameState.score.team1++;
        } else {
            this.gameState.score.team2++;
        }
        
        // Atualiza UI
        this.renderSystem.updateScore(
            this.gameState.score.team1,
            this.gameState.score.team2,
            this.ui
        );
        
        // Reseta posições
        this.resetPositions();
        
        // Flash na tela
        this.cameras.main.flash(500, 255, 255, 255, false);
    }
    
    resetPositions() {
        // Reseta bola
        this.ball.setPosition(GameConfig.FIELD.WIDTH / 2, GameConfig.FIELD.HEIGHT / 2);
        this.ball.setVelocity(0, 0);
        
        // Reseta jogadores
        [...this.team1Players, ...this.team2Players].forEach(player => {
            player.sprite.setPosition(player.basePosition.x, player.basePosition.y);
            player.sprite.setVelocity(0, 0);
            player.x = player.basePosition.x;
            player.y = player.basePosition.y;
        });
    }
    
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        
        if (this.gameState.isPaused) {
            this.showPauseMenu();
            this.physics.pause();
        } else {
            this.hidePauseMenu();
            this.physics.resume();
        }
    }
    
    showPauseMenu() {
        this.pauseMenu = this.add.container(GameConfig.FIELD.WIDTH / 2, GameConfig.FIELD.HEIGHT / 2).setDepth(200);
        
        const bg = this.add.rectangle(0, 0, 500, 400, 0x000000, 0.9).setOrigin(0.5);
        const title = this.add.text(0, -120, 'PAUSED', { 
            fontSize: '48px', 
            fontFamily: 'Arial Black', 
            fill: '#fff' 
        }).setOrigin(0.5);
        
        const resumeBtn = this.add.text(0, -20, 'Resume', { 
            fontSize: '32px', 
            fill: '#fff',
            backgroundColor: '#00000088',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        resumeBtn.on('pointerdown', () => this.togglePause());
        resumeBtn.on('pointerover', () => resumeBtn.setStyle({ fill: '#ffff00' }));
        resumeBtn.on('pointerout', () => resumeBtn.setStyle({ fill: '#fff' }));
        
        const settingsBtn = this.add.text(0, 40, 'Settings', { 
            fontSize: '32px', 
            fill: '#fff',
            backgroundColor: '#00000088',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        settingsBtn.on('pointerdown', () => {
            this.hidePauseMenu();
            this.scene.start('SettingsScene');
        });
        settingsBtn.on('pointerover', () => settingsBtn.setStyle({ fill: '#ffff00' }));
        settingsBtn.on('pointerout', () => settingsBtn.setStyle({ fill: '#fff' }));
        
        const quitBtn = this.add.text(0, 100, 'Quit', { 
            fontSize: '32px', 
            fill: '#fff',
            backgroundColor: '#00000088',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();
        quitBtn.on('pointerdown', () => {
            this.hidePauseMenu();
            this.scene.start('MainMenuScene');
        });
        quitBtn.on('pointerover', () => quitBtn.setStyle({ fill: '#ffff00' }));
        quitBtn.on('pointerout', () => quitBtn.setStyle({ fill: '#fff' }));
        
        this.pauseMenu.add([bg, title, resumeBtn, settingsBtn, quitBtn]);
    }
    
    hidePauseMenu() {
        if (this.pauseMenu) {
            this.pauseMenu.destroy();
            this.pauseMenu = null;
        }
    }
    
    update(time, delta) {
        if (this.gameState.isPaused || !this.gameState.gameStarted) return;
        
        const deltaSeconds = delta / 1000;
        
        // Atualiza tempo do jogo
        this.gameState.matchTime += deltaSeconds;
        this.renderSystem.updateTime(this.gameState.matchTime, this.ui);
        
        // Verifica fim do jogo
        if (this.gameState.matchTime >= this.gameState.matchDuration) {
            this.endGame();
            return;
        }
        
        // Controla jogador selecionado
        if (this.gameState.selectedPlayer) {
            this.controlPlayer(this.gameState.selectedPlayer, deltaSeconds);
        }
        
        // Atualiza jogadores
        [...this.team1Players, ...this.team2Players].forEach(player => {
            player.update(deltaSeconds);
        });
        
        // AI para jogadores não controlados
        this.team1Players.forEach(player => {
            if (player !== this.gameState.selectedPlayer) {
                this.decisionSystem1.makeDecision(player, this.ball, [...this.team1Players, ...this.team2Players]);
            }
        });
        
        this.team2Players.forEach(player => {
            this.decisionSystem2.makeDecision(player, this.ball, [...this.team1Players, ...this.team2Players]);
        });
        
        // Verifica gols
        this.checkGoals();
    }
    
    controlPlayer(player, delta) {
        const speed = player.maxSpeed;
        let vx = 0;
        let vy = 0;
        
        // Movimento com setas
        if (this.cursors.left.isDown) vx = -1;
        if (this.cursors.right.isDown) vx = 1;
        if (this.cursors.up.isDown) vy = -1;
        if (this.cursors.down.isDown) vy = -1;
        
        // Normaliza diagonal
        if (vx !== 0 && vy !== 0) {
            vx *= 0.707;
            vy *= 0.707;
        }
        
        // Aplica movimento
        if (vx !== 0 || vy !== 0) {
            player.sprite.setVelocity(vx * speed, vy * speed);
            player.state = PlayerStates.RUNNING;
        } else {
            player.sprite.setVelocity(
                player.sprite.body.velocity.x * 0.9,
                player.sprite.body.velocity.y * 0.9
            );
            if (Math.abs(player.sprite.body.velocity.x) < 1 && 
                Math.abs(player.sprite.body.velocity.y) < 1) {
                player.sprite.setVelocity(0, 0);
                player.state = PlayerStates.IDLE;
            }
        }
        
        // Chute com espaço
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this.gameState.isCharging = true;
            this.gameState.chargeTime = 0;
        }
        
        if (this.spaceKey.isDown && this.gameState.isCharging) {
            this.gameState.chargeTime += delta;
        }
        
        if (this.spaceKey.isUp && this.gameState.isCharging) {
            // Chuta em direção ao gol adversário
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
    
    endGame() {
        this.gameState.gameStarted = false;
        this.physics.pause();
        
        const winner = this.gameState.score.team1 > this.gameState.score.team2 ? 
            GameConfig.TEAMS.TEAM1.NAME : 
            this.gameState.score.team2 > this.gameState.score.team1 ?
            GameConfig.TEAMS.TEAM2.NAME : 
            'Empate';
        
        const resultText = this.add.text(
            GameConfig.FIELD.WIDTH / 2,
            GameConfig.FIELD.HEIGHT / 2,
            `FIM DE JOGO!\n${winner}\n${this.gameState.score.team1} x ${this.gameState.score.team2}`,
            {
                fontSize: '48px',
                fill: '#fff',
                fontFamily: 'Arial Black',
                align: 'center',
                backgroundColor: '#000000cc',
                padding: { x: 30, y: 20 }
            }
        ).setOrigin(0.5).setDepth(300);
        
        this.time.delayedCall(5000, () => {
            this.scene.start('MainMenuScene');
        });
    }
}
