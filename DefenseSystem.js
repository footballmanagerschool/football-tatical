/**
 * DefenseSystem.js
 * 
 * Coordinates defensive tactics across team.
 * Manages pressing priority, covering, and defensive line compactness.
 * 
 * ARCHITECTURAL DECISION:
 * - System-level coordination prevents conflicts (only 1 presser, etc.)
 * - Players request defensive actions, system approves
 * - Maintains tactical shape while allowing individual decisions
 */

class DefenseSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Track defensive assignments
        this.pressingPlayer = null;
        this.coveringPlayer = null;
        this.interceptingPlayers = [];
        
        // Defensive line tracking
        this.defensiveLine = {
            team1: { minX: Infinity, maxX: -Infinity, avgY: 400 },
            team2: { minX: Infinity, maxX: -Infinity, avgY: 400 }
        };
    }
    
    /**
     * Update defensive coordination
     */
    update(team, players, ball, opponents, delta) {
        // Update defensive line metrics
        this.updateDefensiveLine(team, players);
        
        // Manage pressing priority
        this.managePressing(team, players, ball, delta);
        
        // Manage covering
        this.manageCovering(team, players, ball);
        
        // Manage interceptions
        this.manageInterceptions(team, players, ball);
        
        // Apply compactness rules
        this.enforceCompactness(team, players, ball);
        
        // Apply marking assignments
        this.assignMarking(team, players, opponents);
    }
    
    /**
     * Update defensive line position and spread
     */
    updateDefensiveLine(team, players) {
        const line = this.defensiveLine[`team${team}`];
        
        let minX = Infinity;
        let maxX = -Infinity;
        let totalY = 0;
        let count = 0;
        
        players.forEach(player => {
            if (player.state === 'DEFENSIVE' || player.state === 'COVERING') {
                minX = Math.min(minX, player.x);
                maxX = Math.max(maxX, player.x);
                totalY += player.y;
                count++;
            }
        });
        
        if (count > 0) {
            line.minX = minX;
            line.maxX = maxX;
            line.avgY = totalY / count;
        }
    }
    
    /**
     * Manage who gets to press (only 1 at a time)
     */
    managePressing(team, players, ball, delta) {
        // Check if we have a presser
        const currentPresser = players.find(p => p.state === 'PRESSING');
        
        if (currentPresser) {
            this.pressingPlayer = currentPresser;
            
            // Check if presser should give up
            const distToBall = MathHelpers.distance(
                currentPresser.x, currentPresser.y,
                ball.x, ball.y
            );
            
            // Too far or exhausted
            if (distToBall > GameConfig.AI.PRESSING_DISTANCE * 2 || 
                currentPresser.staminaCurrent < GameConfig.AI.STAMINA_CRITICAL) {
                this.pressingPlayer = null;
            }
        } else {
            this.pressingPlayer = null;
            
            // Find best candidate for pressing
            const ballZone = team === 1 ? 
                (ball.x < 600 ? 'defensive' : 'attacking') :
                (ball.x > 600 ? 'defensive' : 'attacking');
            
            if (ballZone === 'defensive') {
                const candidates = players.filter(p => {
                    const dist = MathHelpers.distance(p.x, p.y, ball.x, ball.y);
                    return dist < GameConfig.AI.PRESSING_DISTANCE && 
                           p.staminaCurrent > 30 &&
                           p.state !== 'RECOVERING';
                });
                
                if (candidates.length > 0) {
                    // Pick closest with best stamina
                    candidates.sort((a, b) => {
                        const distA = MathHelpers.distance(a.x, a.y, ball.x, ball.y);
                        const distB = MathHelpers.distance(b.x, b.y, ball.x, ball.y);
                        const staminaWeight = 0.3;
                        
                        const scoreA = distA - (a.staminaCurrent * staminaWeight);
                        const scoreB = distB - (b.staminaCurrent * staminaWeight);
                        
                        return scoreA - scoreB;
                    });
                    
                    // Assign new presser
                    this.pressingPlayer = candidates[0];
                }
            }
        }
    }
    
    /**
     * Manage covering player (supports presser)
     */
    manageCovering(team, players, ball) {
        if (!this.pressingPlayer) {
            this.coveringPlayer = null;
            return;
        }
        
        // Find best covering position
        const candidates = players.filter(p => 
            p !== this.pressingPlayer &&
            p.staminaCurrent > 20 &&
            p.state !== 'RECOVERING'
        );
        
        if (candidates.length === 0) {
            this.coveringPlayer = null;
            return;
        }
        
        // Find player closest to ideal covering position
        const goalX = team === 1 ? 70 : 1130;
        const goalY = 400;
        
        const idealCoverX = (ball.x + goalX) / 2;
        const idealCoverY = (ball.y + goalY) / 2;
        
        let bestCandidate = null;
        let bestScore = Infinity;
        
        candidates.forEach(p => {
            const dist = MathHelpers.distance(p.x, p.y, idealCoverX, idealCoverY);
            const distToPresser = MathHelpers.distance(
                p.x, p.y,
                this.pressingPlayer.x, this.pressingPlayer.y
            );
            
            // Score based on distance to ideal position and not too far from presser
            const score = dist + (distToPresser > 150 ? 100 : 0);
            
            if (score < bestScore) {
                bestScore = score;
                bestCandidate = p;
            }
        });
        
        this.coveringPlayer = bestCandidate;
    }
    
    /**
     * Manage interception attempts
     */
    manageInterceptions(team, players, ball) {
        const ballSpeed = Math.sqrt(
            ball.body.velocity.x ** 2 + 
            ball.body.velocity.y ** 2
        );
        
        this.interceptingPlayers = [];
        
        if (ballSpeed < 100) return; // Ball too slow to intercept
        
        // Find players who can intercept
        players.forEach(p => {
            if (p.staminaCurrent < 20 || p.state === 'RECOVERING') return;
            if (p === this.pressingPlayer || p === this.coveringPlayer) return;
            
            const probability = MathHelpers.calculateInterceptProbability(
                p,
                { x: ball.x, y: ball.y },
                { 
                    x: ball.x + ball.body.velocity.x * 0.5, 
                    y: ball.y + ball.body.velocity.y * 0.5 
                },
                ballSpeed
            );
            
            if (probability > 0.5) {
                this.interceptingPlayers.push(p);
            }
        });
        
        // Limit to max 1 interceptor to avoid clustering
        if (this.interceptingPlayers.length > 1) {
            this.interceptingPlayers = [this.interceptingPlayers[0]];
        }
    }
    
    /**
     * Enforce defensive compactness
     * Keeps defensive line tight and organized
     */
    enforceCompactness(team, players, ball) {
        const line = this.defensiveLine[`team${team}`];
        const spread = line.maxX - line.minX;
        
        // Calculate desired spread based on ball position
        const ballThreat = this.calculateBallThreat(team, ball);
        const targetSpread = MathHelpers.lerp(
            GameConfig.AI.MIN_LINE_WIDTH,
            GameConfig.AI.MAX_LINE_WIDTH,
            1 - ballThreat // More threat = more compact
        );
        
        if (spread > targetSpread) {
            // Line too wide - pull players in
            const center = (line.minX + line.maxX) / 2;
            
            players.forEach(player => {
                if (player.state === 'DEFENSIVE' || player.state === 'IDLE') {
                    const distFromCenter = Math.abs(player.x - center);
                    
                    if (distFromCenter > targetSpread / 2) {
                        // Nudge toward center
                        const pullStrength = 0.05;
                        const targetX = player.x + (center - player.x) * pullStrength;
                        
                        player.compactnessTarget = {
                            x: targetX,
                            y: player.y
                        };
                    }
                }
            });
        }
    }
    
    /**
     * Calculate how threatening ball position is
     * Returns 0-1 (0 = no threat, 1 = critical)
     */
    calculateBallThreat(team, ball) {
        if (team === 1) {
            // Team 1 defends left
            const goalDist = Math.abs(ball.x - 70);
            const threat = 1 - MathHelpers.clamp(goalDist / 500, 0, 1);
            
            // Extra threat if ball is in dangerous area
            if (ball.y > 300 && ball.y < 500 && ball.x < 300) {
                return Math.min(1, threat * 1.5);
            }
            
            return threat;
        } else {
            // Team 2 defends right
            const goalDist = Math.abs(ball.x - 1130);
            const threat = 1 - MathHelpers.clamp(goalDist / 500, 0, 1);
            
            if (ball.y > 300 && ball.y < 500 && ball.x > 900) {
                return Math.min(1, threat * 1.5);
            }
            
            return threat;
        }
    }
    
    /**
     * Assign man-marking to specific opponents
     */
    assignMarking(team, players, opponents) {
        // Simple nearest-opponent marking
        players.forEach(player => {
            if (player.state === 'DEFENSIVE' && !player.markingTarget) {
                // Find closest unmarked opponent
                let closest = null;
                let minDist = Infinity;
                
                opponents.forEach(opp => {
                    const alreadyMarked = players.some(p => 
                        p.markingTarget === opp && p !== player
                    );
                    
                    if (!alreadyMarked) {
                        const dist = MathHelpers.distance(
                            player.x, player.y,
                            opp.x, opp.y
                        );
                        
                        if (dist < minDist && dist < 200) {
                            minDist = dist;
                            closest = opp;
                        }
                    }
                });
                
                player.markingTarget = closest;
            }
            
            // Clear marking if too far
            if (player.markingTarget) {
                const dist = MathHelpers.distance(
                    player.x, player.y,
                    player.markingTarget.x,
                    player.markingTarget.y
                );
                
                if (dist > 250) {
                    player.markingTarget = null;
                }
            }
        });
    }
    
    /**
     * Get defensive priority for a player
     * Higher number = more important role
     */
    getDefensivePriority(player) {
        if (player === this.pressingPlayer) return 3;
        if (player === this.coveringPlayer) return 2;
        if (this.interceptingPlayers.includes(player)) return 2.5;
        return 1;
    }
    
    /**
     * Check if player is assigned a defensive role
     */
    hasDefensiveRole(player) {
        return player === this.pressingPlayer ||
               player === this.coveringPlayer ||
               this.interceptingPlayers.includes(player);
    }
}
