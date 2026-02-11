/**
 * MovementSystem.js
 * 
 * Handles all player movement, physics updates, and field bounds.
 * Separates movement logic from decision-making.
 * 
 * ARCHITECTURAL DECISION:
 * - Pure physics calculations, no AI logic here
 * - Systems call this to execute movement
 * - Handles collisions, bounds, stamina-based movement
 */

class MovementSystem {
    constructor(scene) {
        this.scene = scene;
        this.fieldBounds = GameConfig.FIELD.BOUNDS;
    }
    
    /**
     * Update all players' physics and movement
     */
    update(players, delta) {
        players.forEach(player => {
            this.updatePlayerPhysics(player, delta);
            this.enforceFieldBounds(player);
            this.updateStamina(player, delta);
        });
    }
    
    /**
     * Update individual player physics
     */
    updatePlayerPhysics(player, delta) {
        // Apply decay to acceleration
        player.acceleration.x *= 0.75;
        player.acceleration.y *= 0.75;
        
        // Additional friction when not controlled
        if (!player.isControlled) {
            player.sprite.body.velocity.x *= 0.92;
            player.sprite.body.velocity.y *= 0.92;
        }
        
        // Calculate current speed
        const currentSpeed = Math.sqrt(
            player.sprite.body.velocity.x ** 2 + 
            player.sprite.body.velocity.y ** 2
        );
        
        // Apply speed modifiers from abilities and stamina
        const abilityMultiplier = this.getAbilitySpeedMultiplier(player);
        const staminaMultiplier = this.getStaminaSpeedMultiplier(player);
        
        const effectiveMaxSpeed = player.maxSpeed * abilityMultiplier * staminaMultiplier;
        
        // Clamp to max speed
        if (currentSpeed > effectiveMaxSpeed) {
            const factor = effectiveMaxSpeed / currentSpeed;
            player.sprite.body.velocity.x *= factor;
            player.sprite.body.velocity.y *= factor;
        }
        
        // Stop completely if very slow (prevents sliding)
        if (currentSpeed < 5) {
            player.sprite.setVelocity(0, 0);
        }
    }
    
    /**
     * Get speed multiplier from active abilities
     */
    getAbilitySpeedMultiplier(player) {
        if (!player.abilityActive) return 1.0;
        
        switch (player.specialAbility) {
            case 'superSpeed':
                return 2.0;
            case 'superDribble':
                return 1.3; // Slight speed boost when dribbling
            default:
                return 1.0;
        }
    }
    
    /**
     * Get speed multiplier based on stamina
     * Low stamina = slower movement
     */
    getStaminaSpeedMultiplier(player) {
        const staminaPercent = player.staminaCurrent / player.stats.stamina;
        
        if (staminaPercent > 0.5) {
            return 1.0; // Full speed
        } else if (staminaPercent > 0.2) {
            // Linear decrease from 1.0 to 0.7 as stamina drops from 50% to 20%
            return MathHelpers.lerp(1.0, 0.7, (0.5 - staminaPercent) / 0.3);
        } else {
            // Critical stamina - 70% speed
            return 0.7;
        }
    }
    
    /**
     * Enforce field boundaries
     */
    enforceFieldBounds(player) {
        let corrected = false;
        
        if (player.sprite.x < this.fieldBounds.minX) {
            player.sprite.x = this.fieldBounds.minX;
            player.sprite.body.velocity.x = 0;
            corrected = true;
        }
        
        if (player.sprite.x > this.fieldBounds.maxX) {
            player.sprite.x = this.fieldBounds.maxX;
            player.sprite.body.velocity.x = 0;
            corrected = true;
        }
        
        if (player.sprite.y < this.fieldBounds.minY) {
            player.sprite.y = this.fieldBounds.minY;
            player.sprite.body.velocity.y = 0;
            corrected = true;
        }
        
        if (player.sprite.y > this.fieldBounds.maxY) {
            player.sprite.y = this.fieldBounds.maxY;
            player.sprite.body.velocity.y = 0;
            corrected = true;
        }
        
        return corrected;
    }
    
    /**
     * Update player stamina based on activity
     */
    updateStamina(player, delta) {
        const speed = Math.sqrt(
            player.sprite.body.velocity.x ** 2 + 
            player.sprite.body.velocity.y ** 2
        );
        
        const deltaSeconds = delta / 1000;
        
        // Stamina drain based on speed and state
        if (speed > 20) {
            let drainRate = 0.01; // Base drain
            
            // Extra drain for high-intensity states
            if (player.state === 'PRESSING') {
                drainRate *= 2.0;
            } else if (player.state === 'INTERCEPTING') {
                drainRate *= 1.5;
            }
            
            // Role-based modifiers
            switch (player.role) {
                case 'SPEED':
                    drainRate *= 0.8; // More efficient runner
                    break;
                case 'DEFENDER':
                    drainRate *= 1.2; // Less efficient
                    break;
            }
            
            player.staminaCurrent = Math.max(
                0,
                player.staminaCurrent - drainRate * deltaSeconds * player.stats.stamina
            );
        } else {
            // Recovery when stationary or slow
            let recoveryRate = GameConfig.AI.STAMINA_RECOVERY_RATE;
            
            if (player.state === 'RECOVERING') {
                recoveryRate *= 2; // Fast recovery when resting
            }
            
            player.staminaCurrent = Math.min(
                player.stats.stamina,
                player.staminaCurrent + recoveryRate * deltaSeconds * player.stats.stamina
            );
        }
    }
    
    /**
     * Move player toward target position
     * Returns velocity to apply
     */
    moveToward(player, targetX, targetY, speedFactor = 1.0) {
        const angle = MathHelpers.angleBetween(
            player.x, player.y,
            targetX, targetY
        );
        
        const speed = player.stats.speed * speedFactor * 
                     this.getStaminaSpeedMultiplier(player) *
                     this.getAbilitySpeedMultiplier(player);
        
        return {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
    }
    
    /**
     * Move with acceleration (more natural movement)
     */
    accelerateToward(player, targetX, targetY, accelerationFactor = 1.0) {
        const angle = MathHelpers.angleBetween(
            player.x, player.y,
            targetX, targetY
        );
        
        const accel = GameConfig.PHYSICS.PLAYER.ACCELERATION * accelerationFactor * 
                     (player.stats.speed / 150);
        
        return {
            x: Math.cos(angle) * accel,
            y: Math.sin(angle) * accel
        };
    }
    
    /**
     * Stop player smoothly
     */
    decelerate(player, decelerationFactor = 0.85) {
        player.sprite.body.velocity.x *= decelerationFactor;
        player.sprite.body.velocity.y *= decelerationFactor;
    }
    
    /**
     * Quick dash/sprint in direction
     */
    dash(player, angle, power = 1.0) {
        if (player.staminaCurrent < 20) return false;
        
        const dashSpeed = 300 * power;
        
        player.sprite.setVelocity(
            player.sprite.body.velocity.x + Math.cos(angle) * dashSpeed,
            player.sprite.body.velocity.y + Math.sin(angle) * dashSpeed
        );
        
        // Stamina cost
        player.staminaCurrent -= 15;
        
        // Visual feedback
        this.scene.tweens.add({
            targets: player.container,
            alpha: 0.5,
            yoyo: true,
            duration: 100,
            repeat: 2
        });
        
        return true;
    }
    
    /**
     * Predict future position based on current velocity
     */
    predictPosition(player, timeSeconds) {
        return {
            x: player.x + player.sprite.body.velocity.x * timeSeconds,
            y: player.y + player.sprite.body.velocity.y * timeSeconds
        };
    }
    
    /**
     * Check if player can reach position in time
     */
    canReach(player, targetX, targetY, timeSeconds) {
        const dist = MathHelpers.distance(player.x, player.y, targetX, targetY);
        const effectiveSpeed = player.stats.speed * 
                              this.getStaminaSpeedMultiplier(player);
        
        const timeNeeded = dist / effectiveSpeed;
        
        return timeNeeded <= timeSeconds;
    }
    
    /**
     * Calculate time to reach target
     */
    timeToReach(player, targetX, targetY) {
        const dist = MathHelpers.distance(player.x, player.y, targetX, targetY);
        const effectiveSpeed = player.stats.speed * 
                              this.getStaminaSpeedMultiplier(player);
        
        if (effectiveSpeed === 0) return Infinity;
        
        return dist / effectiveSpeed;
    }
}
