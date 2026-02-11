/**
 * DecisionSystem.js
 * 
 * Coordinates AI decision-making across all systems.
 * Updates player states and executes decisions with human-like delays.
 * 
 * ARCHITECTURAL DECISION:
 * - Central coordinator between all systems
 * - Applies reaction delays for realistic behavior
 * - Periodic decision updates (not every frame) for performance
 * - Integrates FSM, Defense, Movement, and Zone systems
 */

class DecisionSystem {
    constructor(scene, defenseSystem, movementSystem, zoneSystem) {
        this.scene = scene;
        this.defenseSystem = defenseSystem;
        this.movementSystem = movementSystem;
        this.zoneSystem = zoneSystem;
    }
    
    /**
     * Update AI decisions for a team
     * @param {number} team - Team number (1 or 2)
     * @param {Array} players - Team players
     * @param {Object} ball - Ball sprite
     * @param {Array} opponents - Opposing team players
     * @param {number} delta - Time since last frame (ms)
     */
    update(team, players, ball, opponents, delta) {
        // Filter out controlled players (human-controlled don't need AI)
        const aiPlayers = players.filter(p => !p.isControlled);
        
        // Update defensive coordination
        this.defenseSystem.update(team, aiPlayers, ball, opponents, delta);
        
        // Update each AI player
        aiPlayers.forEach(player => {
            this.updatePlayer(player, {
                ball,
                teammates: aiPlayers.filter(p => p !== player),
                opponents,
                allPlayers: players,
                delta
            });
        });
    }
    
    /**
     * Update individual player AI
     */
    updatePlayer(player, context) {
        const { delta } = context;
        
        // Check if it's time for a new decision
        const timeSinceDecision = Date.now() - player.lastDecisionTime;
        
        if (timeSinceDecision < player.decisionInterval) {
            // Execute current state behavior
            this.executeState(player, context);
            return;
        }
        
        // Check if reaction timer is active (human-like delay)
        if (player.reactionTimer > 0) {
            // Continue current state while reacting
            this.executeState(player, context);
            return;
        }
        
        // Time for new decision
        player.lastDecisionTime = Date.now();
        
        // Check for state transitions
        const currentState = PlayerStates[player.state];
        if (currentState && currentState.shouldTransition) {
            const newState = currentState.shouldTransition(player, context);
            
            if (newState) {
                // Set reaction delay before transitioning
                const reactionTime = this.calculateReactionTime(player);
                player.reactionTimer = reactionTime;
                
                // Only transition if no reaction delay or state is urgent
                if (reactionTime < 100 || this.isUrgentState(newState)) {
                    player.setState(newState, context);
                }
            }
        }
        
        // Execute state behavior
        this.executeState(player, context);
    }
    
    /**
     * Execute current state's update logic
     */
    executeState(player, context) {
        const currentState = PlayerStates[player.state];
        
        if (!currentState || !currentState.update) {
            // Fallback to idle movement
            const velocity = this.movementSystem.moveToward(
                player,
                player.basePosition.x,
                player.basePosition.y,
                0.3
            );
            player.setVelocity(velocity.x, velocity.y);
            return;
        }
        
        // Get desired velocity from state
        const stateOutput = currentState.update(player, context);
        
        if (stateOutput && stateOutput.velocityX !== undefined) {
            player.setVelocity(stateOutput.velocityX, stateOutput.velocityY);
        }
        
        // Additional behaviors based on state
        this.applyStateBehaviors(player, context);
    }
    
    /**
     * Apply additional behaviors based on state
     */
    applyStateBehaviors(player, context) {
        const { ball } = context;
        
        // Auto-kick if ball is close enough
        if (player.state === 'PRESSING' || player.state === 'INTERCEPTING') {
            const distToBall = MathHelpers.distance(
                player.x, player.y,
                ball.x, ball.y
            );
            
            if (distToBall < 35 && player.kickCooldown <= 0) {
                this.attemptKick(player, ball);
            }
        }
        
        // Mark opponent if assigned
        if (player.markingTarget && player.state === 'DEFENSIVE') {
            const markDist = MathHelpers.distance(
                player.x, player.y,
                player.markingTarget.x,
                player.markingTarget.y
            );
            
            // Maintain marking distance
            if (markDist > GameConfig.AI.MARKING_DISTANCE.normal) {
                const velocity = this.movementSystem.moveToward(
                    player,
                    player.markingTarget.x,
                    player.markingTarget.y,
                    0.4
                );
                player.setVelocity(velocity.x, velocity.y);
            }
        }
        
        // Apply compactness target if set by DefenseSystem
        if (player.compactnessTarget) {
            const dist = MathHelpers.distance(
                player.x, player.y,
                player.compactnessTarget.x,
                player.compactnessTarget.y
            );
            
            if (dist > 5) {
                const currentVel = player.sprite.body.velocity;
                const targetVel = this.movementSystem.moveToward(
                    player,
                    player.compactnessTarget.x,
                    player.compactnessTarget.y,
                    0.2
                );
                
                // Blend with current movement
                player.setVelocity(
                    currentVel.x * 0.8 + targetVel.x * 0.2,
                    currentVel.y * 0.8 + targetVel.y * 0.2
                );
            }
            
            player.compactnessTarget = null;
        }
    }
    
    /**
     * Attempt to kick ball toward goal
     */
    attemptKick(player, ball) {
        const goalX = player.team === 1 ? 1150 : 50;
        const goalY = 400;
        
        // Add human error based on pressure
        const pressure = this.calculatePressure(player);
        const stamina = player.staminaCurrent / player.stats.stamina;
        
        const shootingAngle = MathHelpers.calculateShootingAngle(
            player.x, player.y,
            goalX, goalY,
            pressure,
            stamina
        );
        
        const power = player.stats.shootPower * 2.5;
        
        ball.setVelocity(
            Math.cos(shootingAngle) * power,
            Math.sin(shootingAngle) * power
        );
        
        ball.lastTouchedBy = player;
        ball.lastTouchTeam = player.team;
        
        player.kickCooldown = GameConfig.TIMING.KICK_COOLDOWN;
        
        // Visual feedback
        this.scene.tweens.add({
            targets: ball,
            scale: 1.3,
            duration: 100,
            yoyo: true
        });
    }
    
    /**
     * Calculate pressure on player (nearby opponents)
     */
    calculatePressure(player) {
        // Count opponents within pressure radius
        const pressureRadius = 100;
        let pressure = 0;
        
        // This would need opponents passed in context - simplified here
        // In full implementation, count nearby opponents and normalize
        
        // For now, return low pressure
        return 0.2;
    }
    
    /**
     * Calculate reaction time based on player stats and stamina
     * Better reaction stat = faster decisions
     * Low stamina = slower reactions
     */
    calculateReactionTime(player) {
        const baseReaction = GameConfig.AI.REACTION_TIME_MIN;
        const maxReaction = GameConfig.AI.REACTION_TIME_MAX;
        
        // Reaction stat affects base time (0-100, higher is better)
        const reactionFactor = 1 - (player.stats.reaction / 100);
        
        // Stamina affects reactions
        const staminaFactor = 1 - (player.staminaCurrent / player.stats.stamina);
        
        // Combine factors
        const totalFactor = (reactionFactor + staminaFactor * 0.5) / 1.5;
        
        // Random variation for human-like behavior
        const randomness = MathHelpers.randomGaussian(0, 0.1);
        const finalFactor = MathHelpers.clamp(totalFactor + randomness, 0, 1);
        
        return MathHelpers.lerp(baseReaction, maxReaction, finalFactor);
    }
    
    /**
     * Check if state transition is urgent (bypass reaction delay)
     */
    isUrgentState(state) {
        // Some states need immediate action
        return state === 'INTERCEPTING' || state === 'RECOVERING';
    }
    
    /**
     * Get optimal target position for player
     * Integrates zone system, defensive assignments, and tactical position
     */
    getOptimalPosition(player, context) {
        const { ball, teammates, opponents } = context;
        
        // If player has defensive role, use that
        if (this.defenseSystem.hasDefensiveRole(player)) {
            // Role-specific positioning handled by states
            return null;
        }
        
        // Check if should abandon zone
        if (this.zoneSystem.shouldAbandonZone(player, ball, context)) {
            // Move toward ball
            return { x: ball.x, y: ball.y };
        }
        
        // Use zone-based positioning
        return this.zoneSystem.getOptimalZonePosition(
            player,
            ball,
            teammates,
            opponents
        );
    }
    
    /**
     * Evaluate pass options (for future passing system)
     */
    evaluatePassOptions(player, teammates, opponents) {
        const passOptions = [];
        
        teammates.forEach(teammate => {
            const dist = MathHelpers.distance(
                player.x, player.y,
                teammate.x, teammate.y
            );
            
            if (dist < 50 || dist > 300) return; // Too close or too far
            
            // Check if pass lane is clear
            const blocked = opponents.some(opp => {
                const closestPoint = MathHelpers.closestPointOnLine(
                    opp.x, opp.y,
                    player.x, player.y,
                    teammate.x, teammate.y
                );
                
                const distToLine = MathHelpers.distance(
                    opp.x, opp.y,
                    closestPoint.x, closestPoint.y
                );
                
                return distToLine < 40; // Opponent blocks pass
            });
            
            if (!blocked) {
                passOptions.push({
                    target: teammate,
                    distance: dist,
                    score: this.calculatePassScore(player, teammate, opponents)
                });
            }
        });
        
        // Sort by score
        passOptions.sort((a, b) => b.score - a.score);
        
        return passOptions;
    }
    
    /**
     * Calculate pass quality score
     */
    calculatePassScore(passer, receiver, opponents) {
        let score = 100;
        
        // Prefer forward passes
        const forwardness = passer.team === 1 ? 
            (receiver.x - passer.x) : 
            (passer.x - receiver.x);
        score += forwardness * 0.1;
        
        // Penalize if receiver is marked
        opponents.forEach(opp => {
            const dist = MathHelpers.distance(
                receiver.x, receiver.y,
                opp.x, opp.y
            );
            if (dist < 50) {
                score -= 30;
            }
        });
        
        return score;
    }
}
