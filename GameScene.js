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
    
    /**
     * Create both teams
     */
    createTeams() {
        const formation = GameConfig.FORMATIONS.THREE_PLAYERS;
        
        // Team 1 (Player-controlled)
        formation.team1.forEach((config, index) => {
            const playerConfig = {
                team: 1,
                name: `Player ${index + 1}`,
                role: config.role,
                x: config.x,
                y: config.y,
                index: index,
                color: [0x0066ff, 0x0099ff, 0x00ccff][index],
                stats: this.getStatsForRole(config.role),
                specialAbility: this.getAbilityForRole(config.role, index)
            };
            
            const player = new Player(this, playerConfig);
            this.team1Players.push(player);
        });
        
        // Team 2 (AI)
        formation.team2.forEach((config, index) => {
            const playerConfig = {
                team: 2,
                name: `AI ${index + 1}`,
                role: config.role,
                x: config.x,
                y: config.y,
                index: index + 3,
                color: [0xff3300, 0xff6600, 0xff9900][index],
                stats: this.getStatsForRole(config.role),
                specialAbility: this.getAbilityForRole(config.role, index)
            };
            
            const player = new Player(this, playerConfig);
            this.team2Players.push(player);
        });
    }
    
    /**
     * Get stats based on role
     */
    getStatsForRole(role) {
        switch (role) {
            case 'SPEED':
                return { speed: 200, shootPower: 120, stamina: 100, dribble: 130 };
            case 'DRIBBLER':
                return { speed: 150, shootPower: 100, stamina: 100, dribble: 200 };
            case 'SHOOTER':
                return { speed: 130, shootPower: 200, stamina: 100, dribble: 110 };
            case 'DEFENDER':
                return { speed: 120, shootPower: 90, stamina: 110, dribble: 100 };
            default:
                return { speed: 150, shootPower: 120, stamina: 100, dribble: 120 };
        }
    }
    
    /**
     * Get special ability for role
     */
    getAbilityForRole(role, index) {
        if (role === 'SPEED') return 'superSpeed';
        if (role === 'DRIBBLER') return 'superDribble';
        return 'none';
    }
    
    /**
     * Setup keyboard controls
     */
    setupControls() {
        this.keys = {
            W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            SHIFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
            E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            P: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P),
            TAB: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB)
        };
    }
    
    /**
     * Show player selection screen
     */
    showPlayerSelection() {
        // Create selection UI (simplified version)
        const bg = this.add.rectangle(600, 400, 600, 300, 0x000000, 0.85);
        bg.setDepth(200);
        
        const title = this.add.text(600, 300, 'SELECT YOUR PLAYER', {
            fontSize: '28px',
            fontFamily: 'Arial Black',
            fill: '#fff'
        }).setOrigin(0.5).setDepth(201);
        
        const instructions = this.add.text(600, 350, 
            'Press 1, 2, or 3 to select player\nPress ENTER to start', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5).setDepth(201);
        
        let selectedIndex = 0;
        
        // Selection keys
        const key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
        const key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
        const key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
        const enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        
        key1.once('down', () => { selectedIndex = 0; });
        key2.once('down', () => { selectedIndex = 1; });
        key3.once('down', () => { selectedIndex = 2; });
        
        enterKey.once('down', () => {
            bg.destroy();
            title.destroy();
            instructions.destroy();
            this.startGame(selectedIndex);
        });
    }
    
    /**
     * Start the game with selected player
     */
    startGame(playerIndex) {
        console.log(`🎮 Starting game with player ${playerIndex}`);
        
        this.gameState.currentPlayer = this.team1Players[playerIndex];
        this.gameState.currentPlayer.isControlled = true;
        this.gameState.currentPlayer.selectionCircle.setAlpha(1);
        this.gameState.gameStarted = true;
        
        this.updateControlsText();
    }
    
    /**
     * Main update loop
     */
    update(time, delta) {
        if (!this.gameState.gameStarted || this.gameState.isPaused) return;
        
        // Update match time
        this.gameState.matchTime += delta / 1000;
        
        // Check for end of match
        if (this.gameState.matchTime >= this.gameState.matchDuration) {
            this.endGame();
            return;
        }
        
        // ============================================
        // UPDATE PLAYERS
        // ============================================
        const allPlayers = [...this.team1Players, ...this.team2Players];
        allPlayers.forEach(player => {
            player.update(delta, {
                ball: this.ball,
                allPlayers
            });
        });
        
        // ============================================
        // UPDATE MOVEMENT SYSTEM
        // ============================================
        this.movementSystem.update(allPlayers, delta);
        
        // ============================================
        // UPDATE AI SYSTEMS
        // ============================================
        // Team 1 AI (non-controlled players)
        this.decisionSystem1.update(
            1,
            this.team1Players,
            this.ball,
            this.team2Players,
            delta
        );
        
        // Team 2 AI (all players)
        this.decisionSystem2.update(
            2,
            this.team2Players,
            this.ball,
            this.team1Players,
            delta
        );
        
        // ============================================
        // UPDATE ZONE SYSTEM
        // ============================================
        this.zoneSystem.update(this.ball);
        
        // ============================================
        // PLAYER CONTROL
        // ============================================
        if (this.gameState.currentPlayer) {
            this.controlPlayer(this.gameState.currentPlayer);
        }
        
        // ============================================
        // BALL UPDATES
        // ============================================
        this.renderSystem.updateBall(this.ball, delta);
        this.checkGoal();
        this.checkOutOfBounds();
        
        // ============================================
        // UI UPDATES
        // ============================================
        this.renderSystem.updateUI(this.ui, this.gameState);
        
        // ============================================
        // HOTKEYS
        // ============================================
        if (Phaser.Input.Keyboard.JustDown(this.keys.TAB)) {
            this.switchPlayer();
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
            this.togglePause();
        }
    }
    
    /**
     * Control player with keyboard
     */
    controlPlayer(player) {
        const accel = 12 * (player.stats.speed / 150);
        let isMoving = false;
        
        if (this.keys.W.isDown && player.staminaCurrent > 5) {
            player.acceleration.y -= accel;
            isMoving = true;
        }
        if (this.keys.S.isDown && player.staminaCurrent > 5) {
            player.acceleration.y += accel;
            isMoving = true;
        }
        if (this.keys.A.isDown && player.staminaCurrent > 5) {
            player.acceleration.x -= accel;
            isMoving = true;
        }
        if (this.keys.D.isDown && player.staminaCurrent > 5) {
            player.acceleration.x += accel;
            isMoving = true;
        }
        
        if (!isMoving) {
            this.movementSystem.decelerate(player, 0.85);
        }
        
        player.applyAcceleration(player.acceleration.x, player.acceleration.y);
        
        // Kick
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            const goalX = 1150;
            const goalY = 400;
            player.kick(this.ball, goalX, goalY);
        }
        
        // Dash/Dribble
        if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT)) {
            const angle = Math.atan2(player.currentVelocity.y, player.currentVelocity.x);
            this.movementSystem.dash(player, angle, 1.0);
        }
        
        // Special ability
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            player.activateAbility();
        }
    }
    
    /**
     * Handle ball-player collision
     */
    handleBallPlayerCollision(ball, playerSprite) {
        const player = playerSprite.playerRef;
        if (!player) return;
        
        // Dribble ability - ball sticks to player
        if (player.abilityActive && player.specialAbility === 'superDribble') {
            const angle = Math.atan2(player.currentVelocity.y, player.currentVelocity.x);
            ball.setPosition(
                player.x + Math.cos(angle) * 25,
                player.y + Math.sin(angle) * 25
            );
            ball.setVelocity(
                player.currentVelocity.x * 0.8,
                player.currentVelocity.y * 0.8
            );
        }
        
        ball.lastTouchedBy = player;
        ball.lastTouchTeam = player.team;
    }
    
    /**
     * Check for goal
     */
    checkGoal() {
        const leftGoal = GameConfig.GOALS.LEFT;
        const rightGoal = GameConfig.GOALS.RIGHT;
        
        // Left goal
        if (this.ball.x < leftGoal.x + leftGoal.width &&
            this.ball.y > leftGoal.y &&
            this.ball.y < leftGoal.y + leftGoal.height &&
            this.ball.lastTouchTeam === 2) {
            
            this.gameState.score.team2++;
            this.renderSystem.flashGoal(2);
            this.resetPositions();
        }
        
        // Right goal
        if (this.ball.x > rightGoal.x &&
            this.ball.y > rightGoal.y &&
            this.ball.y < rightGoal.y + rightGoal.height &&
            this.ball.lastTouchTeam === 1) {
            
            this.gameState.score.team1++;
            this.renderSystem.flashGoal(1);
            this.resetPositions();
        }
    }
    
    /**
     * Check if ball is out of bounds
     */
    checkOutOfBounds() {
        const bounds = GameConfig.FIELD.BOUNDS;
        
        if (this.ball.y < bounds.minY || this.ball.y > bounds.maxY) {
            this.throwIn();
        }
        
        if (this.ball.x < bounds.minX || this.ball.x > bounds.maxX) {
            const isGoalRange = this.ball.y > 325 && this.ball.y < 475;
            if (!isGoalRange) {
                this.throwIn();
            }
        }
    }
    
    /**
     * Throw-in
     */
    throwIn() {
        this.ball.setVelocity(0, 0);
        
        const bounds = GameConfig.FIELD.BOUNDS;
        
        if (this.ball.y < bounds.minY) this.ball.y = bounds.minY + 20;
        if (this.ball.y > bounds.maxY) this.ball.y = bounds.maxY - 20;
        if (this.ball.x < bounds.minX) this.ball.x = bounds.minX + 20;
        if (this.ball.x > bounds.maxX) this.ball.x = bounds.maxX - 20;
        
        this.tweens.add({
            targets: this.ball,
            scale: 1.2,
            duration: 150,
            yoyo: true
        });
    }
    
    /**
     * Reset positions after goal
     */
    resetPositions() {
        this.ball.setPosition(600, 400);
        this.ball.setVelocity(0, 0);
        
        const formation = GameConfig.FORMATIONS.THREE_PLAYERS;
        
        this.team1Players.forEach((player, index) => {
            player.sprite.setPosition(
                formation.team1[index].x,
                formation.team1[index].y
            );
            player.sprite.setVelocity(0, 0);
        });
        
        this.team2Players.forEach((player, index) => {
            player.sprite.setPosition(
                formation.team2[index].x,
                formation.team2[index].y
            );
            player.sprite.setVelocity(0, 0);
        });
    }
    
    /**
     * Switch controlled player
     */
    switchPlayer() {
        if (this.gameState.currentPlayer) {
            this.gameState.currentPlayer.isControlled = false;
            this.gameState.currentPlayer.selectionCircle.setAlpha(0);
        }
        
        const currentIndex = this.team1Players.indexOf(this.gameState.currentPlayer);
        const nextIndex = (currentIndex + 1) % this.team1Players.length;
        
        this.gameState.currentPlayer = this.team1Players[nextIndex];
        this.gameState.currentPlayer.isControlled = true;
        this.gameState.currentPlayer.selectionCircle.setAlpha(1);
        
        this.updateControlsText();
    }
    
    /**
     * Update controls text
     */
    updateControlsText() {
        if (!this.gameState.currentPlayer) return;
        
        const ability = this.gameState.currentPlayer.specialAbility === 'superSpeed' ? 
            'Super Speed' :
            this.gameState.currentPlayer.specialAbility === 'superDribble' ?
            'Super Dribble' :
            'None';
        
        this.gameState.controlsText = 
            `${this.gameState.currentPlayer.playerName} | ` +
            `WASD: Move | SPACE: Kick | SHIFT: Dash | E: ${ability} | TAB: Switch | P: Pause`;
    }
    
    /**
     * Toggle pause
     */
    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        
        if (this.gameState.isPaused) {
            this.physics.pause();
            this.showPauseMenu();
        } else {
            this.physics.resume();
            if (this.pauseMenu) {
                this.pauseMenu.destroy();
                this.pauseMenu = null;
            }
        }
    }
    
    /**
     * Show pause menu
     */
    showPauseMenu() {
        this.pauseMenu = this.add.container(0, 0);
        
        const bg = this.add.rectangle(600, 400, 500, 300, 0x000000, 0.9);
        const title = this.add.text(600, 320, 'PAUSED', {
            fontSize: '40px',
            fontFamily: 'Arial Black',
            fill: '#fff'
        }).setOrigin(0.5);
        
        const instructions = this.add.text(600, 400, 
            'Press P to resume\nPress TAB to switch player', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#fff',
            align: 'center'
        }).setOrigin(0.5);
        
        this.pauseMenu.add([bg, title, instructions]);
        this.pauseMenu.setDepth(200);
    }
    
    /**
     * End game
     */
    endGame() {
        this.gameState.gameStarted = false;
        this.physics.pause();
        
        const winner = this.gameState.score.team1 > this.gameState.score.team2 ? 
            'TEAM 1 WINS!' :
            this.gameState.score.team2 > this.gameState.score.team1 ?
            'TEAM 2 WINS!' :
            'DRAW!';
        
        const bg = this.add.rectangle(600, 400, 600, 300, 0x000000, 0.9);
        bg.setDepth(200);
        
        const title = this.add.text(600, 330, 'GAME OVER', {
            fontSize: '40px',
            fontFamily: 'Arial Black',
            fill: '#fff'
        }).setOrigin(0.5).setDepth(201);
        
        const result = this.add.text(600, 390, winner, {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            fill: this.gameState.score.team1 > this.gameState.score.team2 ? '#00ff00' : '#ff0000'
        }).setOrigin(0.5).setDepth(201);
        
        const score = this.add.text(600, 440, 
            `${this.gameState.score.team1} - ${this.gameState.score.team2}`, {
            fontSize: '28px',
            fontFamily: 'Arial',
            fill: '#fff'
        }).setOrigin(0.5).setDepth(201);
        
        const restart = this.add.text(600, 490, 'Press R to restart', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#aaa'
        }).setOrigin(0.5).setDepth(201);
        
        const rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
        rKey.once('down', () => {
            this.scene.restart();
        });
    }
}
