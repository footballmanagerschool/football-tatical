/**
 * PlayerStates.js
 * 
 * Finite State Machine for player AI behavior.
 * Each state has clear entry/update/exit logic.
 * 
 * ARCHITECTURAL DECISION:
 * - Clean separation of states makes AI predictable and debuggable
 * - Each state is self-contained with clear responsibilities
 * - Transitions are explicit and condition-based
 * - Easy to add new states without breaking existing ones
 */

const PlayerStates = {
    
    // ============================================
    // IDLE STATE
    // ============================================
    IDLE: {
        name: 'IDLE',
        
        enter(player) {
            if (GameConfig.DEBUG.LOG_STATE_TRANSITIONS) {
                console.log(`${player.playerName} entering IDLE`);
            }
            player.currentTarget = null;
        },
        
        update(player, context) {
            const { ball, teammates, opponents, delta } = context;
            
            // Recover stamina when idle
            player.staminaCurrent = Math.min(
                player.stats.stamina,
                player.staminaCurrent + GameConfig.AI.STAMINA_RECOVERY_RATE * (delta / 1000)
            );
            
            // Move slowly toward base position
            const distToBase = MathHelpers.distance(
                player.x, player.y,
                player.basePosition.x, player.basePosition.y
            );
            
            if (distToBase > 20) {
                const angle = MathHelpers.angleBetween(
                    player.x, player.y,
                    player.basePosition.x, player.basePosition.y
                );
                const speed = player.stats.speed * 0.3;
                
                return {
                    velocityX: Math.cos(angle) * speed,
                    velocityY: Math.sin(angle) * speed
                };
            }
            
            return { velocityX: 0, velocityY: 0 };
        },
        
        exit(player) {
            // Cleanup if needed
        },
        
        // Transition conditions
        shouldTransition(player, context) {
            const { ball, teammates, opponents } = context;
            
            // Critical stamina - force recovery
            if (player.staminaCurrent < GameConfig.AI.STAMINA_CRITICAL) {
                return 'RECOVERING';
            }
            
            const distToBall = MathHelpers.distance(
                player.x, player.y, ball.x, ball.y
            );
            
            // Ball is close and we should engage
            if (distToBall < GameConfig.AI.PRESSING_DISTANCE && 
                this.shouldPress(player, context)) {
                return 'PRESSING';
            }
            
            // Should cover teammate
            if (this.shouldCover(player, context)) {
                return 'COVERING';
            }
            
            // Should attempt interception
            if (this.shouldIntercept(player, context)) {
                return 'INTERCEPTING';
            }
            
            // Default to defensive positioning
            if (this.isInDefensiveMode(player, context)) {
                return 'DEFENSIVE';
            }
            
            return null; // Stay in IDLE
        },
        
        // Helper methods
        shouldPress(player, context) {
            // Only one player should press at a time
            const alreadyPressing = context.teammates.some(t => t.state === 'PRESSING');
            if (alreadyPressing) return false;
            
            // Check if we're the closest to ball
            const closestTeammate = this.getClosestToBall(context.teammates, context.ball);
            return closestTeammate === player;
        },
        
        shouldCover(player, context) {
            // Check if teammate is pressing and we should cover
            const pressingTeammate = context.teammates.find(t => t.state === 'PRESSING');
            if (!pressingTeammate) return false;
            
            const distToPresser = MathHelpers.distance(
                player.x, player.y,
                pressingTeammate.x, pressingTeammate.y
            );
            
            return distToPresser < GameConfig.AI.COVERING_DISTANCE;
        },
        
        shouldIntercept(player, context) {
            const { ball } = context;
            const ballSpeed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
            
            if (ballSpeed < 50) return false; // Ball is too slow
            
            // Calculate if we can intercept
            const interceptProb = MathHelpers.calculateInterceptProbability(
                player,
                { x: ball.x, y: ball.y },
                { 
                    x: ball.x + ball.body.velocity.x, 
                    y: ball.y + ball.body.velocity.y 
                },
                ballSpeed
            );
            
            return interceptProb > 0.6; // 60% chance or better
        },
        
        isInDefensiveMode(player, context) {
            const { ball } = context;
            
            // Defensive mode when ball is in our half
            if (player.team === 1) {
                return ball.x < GameConfig.FIELD.ZONES.MIDFIELD_START;
            } else {
                return ball.x > GameConfig.FIELD.ZONES.MIDFIELD_END;
            }
        },
        
        getClosestToBall(players, ball) {
            let closest = null;
            let minDist = Infinity;
            
            players.forEach(p => {
                const dist = MathHelpers.distance(p.x, p.y, ball.x, ball.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = p;
                }
            });
            
            return closest;
        }
    },
    
    // ============================================
    // DEFENSIVE STATE
    // ============================================
    DEFENSIVE: {
        name: 'DEFENSIVE',
        
        enter(player) {
            if (GameConfig.DEBUG.LOG_STATE_TRANSITIONS) {
                console.log(`${player.playerName} entering DEFENSIVE`);
            }
        },
        
        update(player, context) {
            const { ball, delta } = context;
            
            // Calculate defensive position based on ball and zone
            const defensivePos = this.calculateDefensivePosition(player, context);
            
            const angle = MathHelpers.angleBetween(
                player.x, player.y,
                defensivePos.x, defensivePos.y
            );
            
            const distToTarget = MathHelpers.distance(
                player.x, player.y,
                defensivePos.x, defensivePos.y
            );
            
            // Speed based on distance (faster when far, slower when close)
            const speedFactor = Math.min(1, distToTarget / 100);
            const speed = player.stats.speed * 0.4 * speedFactor;
            
            return {
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed
            };
        },
        
        exit(player) {},
        
        shouldTransition(player, context) {
            if (player.staminaCurrent < GameConfig.AI.STAMINA_CRITICAL) {
                return 'RECOVERING';
            }
            
            const distToBall = MathHelpers.distance(
                player.x, player.y, context.ball.x, context.ball.y
            );
            
            if (distToBall < GameConfig.AI.PRESSING_DISTANCE) {
                const closestToBall = PlayerStates.IDLE.getClosestToBall(
                    context.teammates, context.ball
                );
                if (closestToBall === player) {
                    return 'PRESSING';
                }
            }
            
            if (PlayerStates.IDLE.shouldIntercept(player, context)) {
                return 'INTERCEPTING';
            }
            
            // Return to IDLE when ball moves away
            if (!PlayerStates.IDLE.isInDefensiveMode(player, context)) {
                return 'IDLE';
            }
            
            return null;
        },
        
        calculateDefensivePosition(player, context) {
            const { ball } = context;
            const baseX = player.basePosition.x;
            const baseY = player.basePosition.y;
            
            // Shift position based on ball location
            let targetX = baseX;
            let targetY = baseY;
            
            if (player.team === 1) {
                // Team 1 defends left goal
                // Compress toward goal when ball is close
                const ballThreat = MathHelpers.clamp((600 - ball.x) / 400, 0, 1);
                targetX = MathHelpers.lerp(baseX, baseX - 50, ballThreat);
            } else {
                // Team 2 defends right goal
                const ballThreat = MathHelpers.clamp((ball.x - 600) / 400, 0, 1);
                targetX = MathHelpers.lerp(baseX, baseX + 50, ballThreat);
            }
            
            // Vertical adjustment to track ball
            const verticalOffset = (ball.y - 400) * 0.25;
            targetY = baseY + verticalOffset;
            
            // Clamp to field bounds
            targetY = MathHelpers.clamp(
                targetY,
                GameConfig.FIELD.BOUNDS.minY + 30,
                GameConfig.FIELD.BOUNDS.maxY - 30
            );
            
            return { x: targetX, y: targetY };
        }
    },
    
    // ============================================
    // PRESSING STATE
    // ============================================
    PRESSING: {
        name: 'PRESSING',
        
        enter(player) {
            if (GameConfig.DEBUG.LOG_STATE_TRANSITIONS) {
                console.log(`${player.playerName} entering PRESSING - Aggressively attacking ball`);
            }
            player.pressingStartTime = Date.now();
        },
        
        update(player, context) {
            const { ball, delta } = context;
            
            // Predict ball position
            const predictedBall = {
                x: ball.x + ball.body.velocity.x * 0.2,
                y: ball.y + ball.body.velocity.y * 0.2
            };
            
            const angle = MathHelpers.angleBetween(
                player.x, player.y,
                predictedBall.x, predictedBall.y
            );
            
            // Aggressive speed with stamina consideration
            const staminaFactor = player.staminaCurrent / player.stats.stamina;
            const speed = player.stats.speed * 0.7 * staminaFactor;
            
            // Consume stamina faster when pressing
            player.staminaCurrent = Math.max(
                0,
                player.staminaCurrent - 0.05 * (delta / 1000) * player.stats.stamina
            );
            
            return {
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed
            };
        },
        
        exit(player) {
            player.pressingStartTime = null;
        },
        
        shouldTransition(player, context) {
            // Force recovery if stamina critical
            if (player.staminaCurrent < GameConfig.AI.STAMINA_CRITICAL) {
                return 'RECOVERING';
            }
            
            const distToBall = MathHelpers.distance(
                player.x, player.y, context.ball.x, context.ball.y
            );
            
            // Stop pressing if too far
            if (distToBall > GameConfig.AI.PRESSING_DISTANCE * 1.5) {
                return 'DEFENSIVE';
            }
            
            // Check if another teammate is closer now
            const closestToBall = PlayerStates.IDLE.getClosestToBall(
                context.teammates, context.ball
            );
            
            if (closestToBall !== player && distToBall > 80) {
                return 'DEFENSIVE';
            }
            
            // Timeout after 5 seconds of pressing
            if (player.pressingStartTime && 
                Date.now() - player.pressingStartTime > 5000) {
                return 'DEFENSIVE';
            }
            
            return null;
        }
    },
    
    // ============================================
    // COVERING STATE
    // ============================================
    COVERING: {
        name: 'COVERING',
        
        enter(player) {
            if (GameConfig.DEBUG.LOG_STATE_TRANSITIONS) {
                console.log(`${player.playerName} entering COVERING - Supporting pressing teammate`);
            }
        },
        
        update(player, context) {
            const { ball, teammates } = context;
            
            // Find pressing teammate
            const pressingTeammate = teammates.find(t => t.state === 'PRESSING');
            
            if (!pressingTeammate) {
                return { velocityX: 0, velocityY: 0 };
            }
            
            // Position between presser and goal
            const coveringPos = this.calculateCoveringPosition(player, pressingTeammate, ball);
            
            const angle = MathHelpers.angleBetween(
                player.x, player.y,
                coveringPos.x, coveringPos.y
            );
            
            const speed = player.stats.speed * 0.45;
            
            return {
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed
            };
        },
        
        exit(player) {},
        
        shouldTransition(player, context) {
            if (player.staminaCurrent < GameConfig.AI.STAMINA_CRITICAL) {
                return 'RECOVERING';
            }
            
            // Stop covering if no one is pressing
            const pressingTeammate = context.teammates.find(t => t.state === 'PRESSING');
            if (!pressingTeammate) {
                return 'DEFENSIVE';
            }
            
            // Transition to pressing if presser gives up and we're closest
            const closestToBall = PlayerStates.IDLE.getClosestToBall(
                context.teammates, context.ball
            );
            if (closestToBall === player) {
                const distToBall = MathHelpers.distance(
                    player.x, player.y, context.ball.x, context.ball.y
                );
                if (distToBall < GameConfig.AI.PRESSING_DISTANCE) {
                    return 'PRESSING';
                }
            }
            
            return null;
        },
        
        calculateCoveringPosition(player, presser, ball) {
            // Position in triangle: ball -> presser -> cover
            const goalX = player.team === 1 ? 70 : 1130;
            const goalY = 400;
            
            // Point between ball and goal
            const coverX = (ball.x + goalX) / 2;
            const coverY = (ball.y + goalY) / 2;
            
            // Offset perpendicular to presser
            const angleToPresser = MathHelpers.angleBetween(ball.x, ball.y, presser.x, presser.y);
            const offsetAngle = angleToPresser + Math.PI / 4;
            
            return {
                x: coverX + Math.cos(offsetAngle) * 60,
                y: coverY + Math.sin(offsetAngle) * 60
            };
        }
    },
    
    // ============================================
    // INTERCEPTING STATE
    // ============================================
    INTERCEPTING: {
        name: 'INTERCEPTING',
        
        enter(player) {
            if (GameConfig.DEBUG.LOG_STATE_TRANSITIONS) {
                console.log(`${player.playerName} entering INTERCEPTING - Cutting passing lane`);
            }
        },
        
        update(player, context) {
            const { ball } = context;
            
            // Calculate interception point
            const interceptionPoint = MathHelpers.calculateInterception(
                { x: player.x, y: player.y, speed: player.stats.speed * 0.6 },
                { 
                    x: ball.x, 
                    y: ball.y, 
                    vx: ball.body.velocity.x, 
                    vy: ball.body.velocity.y 
                }
            );
            
            const angle = MathHelpers.angleBetween(
                player.x, player.y,
                interceptionPoint.x, interceptionPoint.y
            );
            
            const speed = player.stats.speed * 0.65;
            
            return {
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed
            };
        },
        
        exit(player) {},
        
        shouldTransition(player, context) {
            if (player.staminaCurrent < GameConfig.AI.STAMINA_CRITICAL) {
                return 'RECOVERING';
            }
            
            const { ball } = context;
            const ballSpeed = Math.sqrt(
                ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2
            );
            
            // Stop intercepting if ball slows down
            if (ballSpeed < 50) {
                return 'PRESSING';
            }
            
            // Failed to intercept - return to defense
            const distToBall = MathHelpers.distance(
                player.x, player.y, ball.x, ball.y
            );
            if (distToBall > GameConfig.AI.INTERCEPT_DISTANCE * 1.5) {
                return 'DEFENSIVE';
            }
            
            return null;
        }
    },
    
    // ============================================
    // RECOVERING STATE
    // ============================================
    RECOVERING: {
        name: 'RECOVERING',
        
        enter(player) {
            if (GameConfig.DEBUG.LOG_STATE_TRANSITIONS) {
                console.log(`${player.playerName} entering RECOVERING - Low stamina, regenerating`);
            }
        },
        
        update(player, context) {
            const { delta } = context;
            
            // Fast stamina recovery
            player.staminaCurrent = Math.min(
                player.stats.stamina,
                player.staminaCurrent + GameConfig.AI.STAMINA_RECOVERY_RATE * 2 * (delta / 1000)
            );
            
            // Slowly move toward safe position
            const safePos = {
                x: player.basePosition.x,
                y: player.basePosition.y
            };
            
            const angle = MathHelpers.angleBetween(
                player.x, player.y,
                safePos.x, safePos.y
            );
            
            const speed = player.stats.speed * 0.25; // Very slow
            
            return {
                velocityX: Math.cos(angle) * speed,
                velocityY: Math.sin(angle) * speed
            };
        },
        
        exit(player) {},
        
        shouldTransition(player, context) {
            // Recover until stamina is decent
            if (player.staminaCurrent > GameConfig.AI.STAMINA_LOW) {
                return 'IDLE';
            }
            
            return null;
        }
    }
};
