/**
 * Player.js
 * 
 * Main player entity with FSM, stats, and visual representation.
 * 
 * ARCHITECTURAL DECISION:
 * - Player is a data container + visual representation
 * - Logic is handled by Systems (Defense, Movement, Decision)
 * - FSM manages behavior states
 * - Prepared for spritesheet replacement
 */

class Player {
    constructor(scene, config) {
        this.scene = scene;
        
        // ============================================
        // CORE PROPERTIES
        // ============================================
        this.team = config.team;
        this.playerName = config.name;
        this.role = config.role || 'SHOOTER';
        this.index = config.index;
        
        // ============================================
        // POSITION & MOVEMENT
        // ============================================
        this.x = config.x;
        this.y = config.y;
        this.basePosition = { x: config.x, y: config.y };
        this.currentVelocity = { x: 0, y: 0 };
        this.acceleration = { x: 0, y: 0 };
        
        // ============================================
        // STATS (with role modifiers)
        // ============================================
        const roleConfig = GameConfig.ROLES[this.role];
        this.stats = {
            speed: (config.stats.speed || 150) * (roleConfig.statModifiers.speed || 1),
            shootPower: (config.stats.shootPower || 100) * (roleConfig.statModifiers.shootPower || 1),
            stamina: config.stats.stamina || 100,
            dribble: (config.stats.dribble || 100) * (roleConfig.statModifiers.dribble || 1),
            defense: 80 * (roleConfig.statModifiers.defense || 1),
            reaction: 70 * (roleConfig.statModifiers.reaction || 1),
            aggression: 60 * (roleConfig.statModifiers.aggression || 1)
        };
        
        this.staminaCurrent = this.stats.stamina;
        this.maxSpeed = this.stats.speed * 0.6;
        
        // ============================================
        // AI STATE MACHINE
        // ============================================
        this.state = 'IDLE';
        this.previousState = null;
        this.stateData = {}; // Custom data for each state
        
        // ============================================
        // TACTICAL PROPERTIES
        // ============================================
        this.zone = null;
        this.markingTarget = null;
        this.currentTarget = null;
        this.reactionTimer = 0; // Human-like delay
        
        // ============================================
        // GAMEPLAY PROPERTIES
        // ============================================
        this.isControlled = false;
        this.kickCooldown = 0;
        this.abilityDuration = 0;
        this.abilityActive = false;
        this.specialAbility = config.specialAbility || 'none';
        
        // ============================================
        // DECISION TRACKING
        // ============================================
        this.lastDecisionTime = 0;
        this.decisionInterval = GameConfig.AI.DECISION_INTERVAL;
        
        // ============================================
        // VISUAL REPRESENTATION
        // ============================================
        this.createVisuals(config);
        
        // ============================================
        // PHYSICS BODY
        // ============================================
        this.createPhysicsBody();
    }
    
    /**
     * Create visual representation using Container
     * Prepared for spritesheet replacement
     */
    createVisuals(config) {
        const roleConfig = GameConfig.ROLES[this.role];
        
        // Main container for all visual elements
        this.container = this.scene.add.container(this.x, this.y);
        this.container.setDepth(20);
        
        // Shadow (rendered first, below everything)
        this.shadow = this.scene.add.ellipse(
            0, 8,
            24, 12,
            0x000000, 0.3
        );
        this.container.add(this.shadow);
        
        // Body shape (varies by role)
        this.body = this.createBodyShape(roleConfig, config.color);
        this.container.add(this.body);
        
        // Head
        this.head = this.scene.add.circle(
            0, -18,
            7,
            0xffcc99
        );
        this.container.add(this.head);
        
        // Direction indicator (small triangle)
        this.directionIndicator = this.scene.add.triangle(
            0, -15,
            0, -8,
            -5, 0,
            5, 0,
            0xffffff, 0.6
        );
        this.container.add(this.directionIndicator);
        
        // Selection circle (hidden by default)
        this.selectionCircle = this.scene.add.circle(0, 0, 22, 0xffff00, 0);
        this.selectionCircle.setStrokeStyle(2, 0xffff00);
        this.container.add(this.selectionCircle);
        
        // Name text
        this.nameText = this.scene.add.text(0, -35, this.playerName, {
            fontSize: '11px',
            fontFamily: 'Arial',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);
        this.nameText.setDepth(50);
        
        // State indicator (for debugging)
        if (GameConfig.DEBUG.SHOW_STATES) {
            this.stateText = this.scene.add.text(0, -48, '', {
                fontSize: '9px',
                fontFamily: 'Arial',
                fill: '#ffff00',
                stroke: '#000',
                strokeThickness: 2
            }).setOrigin(0.5);
            this.stateText.setDepth(50);
        }
        
        // Stamina bar
        this.staminaBar = this.scene.add.graphics();
        this.staminaBar.setDepth(50);
        
        // Ability indicator
        this.abilityIndicator = this.scene.add.text(0, -55, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ffff00',
            stroke: '#000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.abilityIndicator.setDepth(50);
        
        // Animation properties
        this.runBouncePhase = 0;
    }
    
    /**
     * Create body shape based on role
     */
    createBodyShape(roleConfig, color) {
        const bodyWidth = 12 * (roleConfig.bodyWidth || 1);
        const bodyHeight = 16;
        
        let body;
        
        switch (this.role) {
            case 'DEFENDER':
                // Wider, more robust rectangle
                body = this.scene.add.rectangle(
                    0, -8,
                    bodyWidth * 1.2, bodyHeight * 1.1,
                    color
                );
                break;
                
            case 'SPEED':
                // Slim, athletic ellipse
                body = this.scene.add.ellipse(
                    0, -8,
                    bodyWidth * 0.9, bodyHeight * 1.2,
                    color
                );
                break;
                
            case 'DRIBBLER':
                // Lower center of gravity
                body = this.scene.add.ellipse(
                    0, -6,
                    bodyWidth, bodyHeight * 0.9,
                    color
                );
                break;
                
            case 'SHOOTER':
            default:
                // Standard rectangle
                body = this.scene.add.rectangle(
                    0, -8,
                    bodyWidth, bodyHeight,
                    color
                );
                break;
        }
        
        return body;
    }
    
    /**
     * Create physics body for collisions
     */
    createPhysicsBody() {
        // Create invisible sprite for physics
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, null);
        this.sprite.setDisplaySize(0, 0); // Invisible
        this.sprite.setAlpha(0);
        
        // Configure physics
        this.sprite.setCircle(GameConfig.PHYSICS.PLAYER.COLLISION_RADIUS);
        this.sprite.setBounce(GameConfig.PHYSICS.PLAYER.BOUNCE);
        this.sprite.setDamping(true);
        this.sprite.setDrag(GameConfig.PHYSICS.PLAYER.DRAG);
        this.sprite.setFriction(GameConfig.PHYSICS.PLAYER.FRICTION);
        this.sprite.setCollideWorldBounds(true);
        
        // Reference back to this player
        this.sprite.playerRef = this;
    }
    
    /**
     * Update player state and visuals
     */
    update(delta, context) {
        // Update reaction timer
        if (this.reactionTimer > 0) {
            this.reactionTimer -= delta;
        }
        
        // Update cooldowns
        if (this.kickCooldown > 0) {
            this.kickCooldown -= delta;
        }
        
        if (this.abilityDuration > 0) {
            this.abilityDuration -= delta;
            this.abilityActive = true;
        } else {
            this.abilityActive = false;
        }
        
        // Sync position with physics sprite
        this.x = this.sprite.x;
        this.y = this.sprite.y;
        this.currentVelocity.x = this.sprite.body.velocity.x;
        this.currentVelocity.y = this.sprite.body.velocity.y;
        
        // Update visual position
        this.container.setPosition(this.x, this.y);
        this.nameText.setPosition(this.x, this.y - 35);
        if (this.stateText) {
            this.stateText.setPosition(this.x, this.y - 48);
            this.stateText.setText(this.state);
        }
        this.abilityIndicator.setPosition(this.x, this.y - 55);
        
        // Update running animation
        this.updateRunAnimation(delta);
        
        // Update stamina bar
        this.updateStaminaBar();
        
        // Update ability indicator
        this.updateAbilityIndicator();
    }
    
    /**
     * Procedural running animation
     */
    updateRunAnimation(delta) {
        const speed = Math.sqrt(
            this.currentVelocity.x ** 2 + 
            this.currentVelocity.y ** 2
        );
        
        if (speed > 30) {
            // Calculate run direction
            const angle = Math.atan2(this.currentVelocity.y, this.currentVelocity.x);
            
            // Lean forward when running
            const leanAngle = GameConfig.VISUAL.RUN_LEAN_ANGLE;
            this.container.setRotation(angle + leanAngle);
            
            // Bobbing animation
            this.runBouncePhase += delta * GameConfig.VISUAL.RUN_BOUNCE_FREQUENCY * 0.001;
            const bounce = Math.sin(this.runBouncePhase) * GameConfig.VISUAL.RUN_BOUNCE_AMPLITUDE;
            this.head.y = -18 + bounce;
            
            // Point direction indicator forward
            this.directionIndicator.setRotation(Math.PI / 2);
        } else {
            // Reset to idle position
            this.container.setRotation(0);
            this.head.y = -18;
            this.directionIndicator.setRotation(0);
        }
    }
    
    /**
     * Update stamina bar visualization
     */
    updateStaminaBar() {
        this.staminaBar.clear();
        
        // Background
        this.staminaBar.fillStyle(0x000000, 0.5);
        this.staminaBar.fillRect(this.x - 15, this.y + 25, 30, 4);
        
        // Stamina fill
        const staminaPercent = this.staminaCurrent / this.stats.stamina;
        const color = staminaPercent > 0.5 ? 0x00ff00 : 
                      staminaPercent > 0.2 ? 0xffff00 : 0xff0000;
        this.staminaBar.fillStyle(color, 1);
        this.staminaBar.fillRect(this.x - 15, this.y + 25, 30 * staminaPercent, 4);
    }
    
    /**
     * Update ability indicator
     */
    updateAbilityIndicator() {
        if (this.abilityActive) {
            if (this.specialAbility === 'superSpeed') {
                this.abilityIndicator.setText('⚡');
            } else if (this.specialAbility === 'superDribble') {
                this.abilityIndicator.setText('🎯');
            }
        } else {
            this.abilityIndicator.setText('');
        }
    }
    
    /**
     * Transition to new state
     */
    setState(newState, context) {
        if (this.state === newState) return;
        
        // Exit current state
        if (PlayerStates[this.state] && PlayerStates[this.state].exit) {
            PlayerStates[this.state].exit(this);
        }
        
        this.previousState = this.state;
        this.state = newState;
        
        // Enter new state
        if (PlayerStates[this.state] && PlayerStates[this.state].enter) {
            PlayerStates[this.state].enter(this);
        }
        
        // Visual feedback for state
        this.applyStateVisual();
    }
    
    /**
     * Apply visual feedback based on state
     */
    applyStateVisual() {
        // Clear previous effects
        this.body.clearTint();
        this.container.setScale(1);
        
        switch (this.state) {
            case 'PRESSING':
                this.body.setTint(GameConfig.VISUAL.PRESSING_GLOW);
                this.container.setScale(1.05);
                break;
            case 'COVERING':
                this.body.setTint(GameConfig.VISUAL.COVERING_GLOW);
                break;
            case 'INTERCEPTING':
                this.body.setTint(GameConfig.VISUAL.INTERCEPTING_GLOW);
                break;
            case 'RECOVERING':
                this.body.setTint(GameConfig.VISUAL.RECOVERING_TINT);
                this.container.setScale(0.95);
                break;
        }
    }
    
    /**
     * Set velocity (used by systems)
     */
    setVelocity(vx, vy) {
        this.sprite.setVelocity(vx, vy);
    }
    
    /**
     * Apply acceleration (physics-based movement)
     */
    applyAcceleration(ax, ay) {
        this.acceleration.x = ax;
        this.acceleration.y = ay;
        
        this.sprite.setVelocity(
            this.sprite.body.velocity.x + ax,
            this.sprite.body.velocity.y + ay
        );
    }
    
    /**
     * Activate special ability
     */
    activateAbility() {
        if (this.specialAbility === 'none' || this.abilityDuration > 0) return;
        if (this.staminaCurrent < 40) return;
        
        this.abilityDuration = GameConfig.TIMING.ABILITY_DURATION;
        this.staminaCurrent -= 40;
        
        // Visual flash
        this.scene.tweens.add({
            targets: this.container,
            scaleX: 1.3,
            scaleY: 1.3,
            duration: 150,
            yoyo: true
        });
    }
    
    /**
     * Perform kick
     */
    kick(ball, targetX, targetY) {
        if (this.kickCooldown > 0) return false;
        
        const distToBall = MathHelpers.distance(this.x, this.y, ball.x, ball.y);
        if (distToBall > 40) return false;
        
        const angle = MathHelpers.angleBetween(this.x, this.y, targetX, targetY);
        const power = this.stats.shootPower * 3;
        
        ball.setVelocity(
            Math.cos(angle) * power,
            Math.sin(angle) * power
        );
        
        ball.lastTouchedBy = this;
        ball.lastTouchTeam = this.team;
        
        this.kickCooldown = GameConfig.TIMING.KICK_COOLDOWN;
        
        // Visual feedback
        this.scene.tweens.add({
            targets: ball,
            scale: 1.3,
            duration: 100,
            yoyo: true
        });
        
        return true;
    }
    
    /**
     * Clean up (destroy visuals and physics)
     */
    destroy() {
        this.container.destroy();
        this.nameText.destroy();
        if (this.stateText) this.stateText.destroy();
        this.staminaBar.destroy();
        this.abilityIndicator.destroy();
        this.sprite.destroy();
    }
}
