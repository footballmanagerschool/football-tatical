/**
 * ZoneSystem.js
 * 
 * Manages field zones for tactical positioning.
 * Dynamically divides field based on ball position and team strategy.
 * 
 * ARCHITECTURAL DECISION:
 * - Zones guide AI positioning without being rigid
 * - Dynamic zones adapt to game situation
 * - Players can leave zones tactically (not hardcoded)
 */

class ZoneSystem {
    constructor(scene) {
        this.scene = scene;
        this.zones = this.createZones();
        
        // Debug visualization
        if (GameConfig.DEBUG.SHOW_ZONES) {
            this.zoneGraphics = scene.add.graphics();
            this.zoneGraphics.setDepth(1);
        }
    }
    
    /**
     * Create initial zone structure
     * Zones are: DEFENSIVE, MID_DEFENSIVE, MID_ATTACKING, ATTACKING
     */
    createZones() {
        const field = GameConfig.FIELD;
        const zoneWidth = field.WIDTH / 4;
        
        return {
            team1: {
                DEFENSIVE: {
                    x: field.X,
                    y: field.Y,
                    width: zoneWidth,
                    height: field.HEIGHT,
                    priority: 1.5 // Higher priority = more important to cover
                },
                MID_DEFENSIVE: {
                    x: field.X + zoneWidth,
                    y: field.Y,
                    width: zoneWidth,
                    height: field.HEIGHT,
                    priority: 1.2
                },
                MID_ATTACKING: {
                    x: field.X + zoneWidth * 2,
                    y: field.Y,
                    width: zoneWidth,
                    height: field.HEIGHT,
                    priority: 1.0
                },
                ATTACKING: {
                    x: field.X + zoneWidth * 3,
                    y: field.Y,
                    width: zoneWidth,
                    height: field.HEIGHT,
                    priority: 0.8
                }
            },
            team2: {
                ATTACKING: {
                    x: field.X,
                    y: field.Y,
                    width: zoneWidth,
                    height: field.HEIGHT,
                    priority: 0.8
                },
                MID_ATTACKING: {
                    x: field.X + zoneWidth,
                    y: field.Y,
                    width: zoneWidth,
                    height: field.HEIGHT,
                    priority: 1.0
                },
                MID_DEFENSIVE: {
                    x: field.X + zoneWidth * 2,
                    y: field.Y,
                    width: zoneWidth,
                    height: field.HEIGHT,
                    priority: 1.2
                },
                DEFENSIVE: {
                    x: field.X + zoneWidth * 3,
                    y: field.Y,
                    width: zoneWidth,
                    height: field.HEIGHT,
                    priority: 1.5
                }
            }
        };
    }
    
    /**
     * Assign players to zones based on their base position
     */
    assignPlayerZones(players) {
        players.forEach(player => {
            const teamZones = this.zones[`team${player.team}`];
            
            // Find which zone player's base position is in
            for (let zoneName in teamZones) {
                const zone = teamZones[zoneName];
                
                if (MathHelpers.pointInRect(
                    player.basePosition.x,
                    player.basePosition.y,
                    zone.x, zone.y,
                    zone.width, zone.height
                )) {
                    player.zone = zoneName;
                    break;
                }
            }
        });
    }
    
    /**
     * Get zone for a specific position
     */
    getZoneAt(x, y, team) {
        const teamZones = this.zones[`team${team}`];
        
        for (let zoneName in teamZones) {
            const zone = teamZones[zoneName];
            
            if (MathHelpers.pointInRect(x, y, zone.x, zone.y, zone.width, zone.height)) {
                return zoneName;
            }
        }
        
        return null;
    }
    
    /**
     * Get zone object
     */
    getZone(team, zoneName) {
        return this.zones[`team${team}`][zoneName];
    }
    
    /**
     * Calculate zone density (number of players in zone)
     */
    getZoneDensity(team, zoneName, players) {
        const zone = this.getZone(team, zoneName);
        if (!zone) return 0;
        
        return players.filter(p => 
            p.team === team &&
            MathHelpers.pointInRect(p.x, p.y, zone.x, zone.y, zone.width, zone.height)
        ).length;
    }
    
    /**
     * Get optimal position within a zone
     * Considers: ball position, teammates, opponents
     */
    getOptimalZonePosition(player, ball, teammates, opponents) {
        const zone = this.getZone(player.team, player.zone);
        if (!zone) return player.basePosition;
        
        // Start with zone center
        let targetX = zone.x + zone.width / 2;
        let targetY = zone.y + zone.height / 2;
        
        // Adjust based on ball position
        const ballInZone = MathHelpers.pointInRect(
            ball.x, ball.y,
            zone.x, zone.y,
            zone.width, zone.height
        );
        
        if (ballInZone) {
            // Move toward ball if it's in our zone
            targetX = MathHelpers.lerp(targetX, ball.x, 0.6);
            targetY = MathHelpers.lerp(targetY, ball.y, 0.6);
        } else {
            // Bias toward side of zone closest to ball
            if (ball.x < zone.x) {
                targetX = zone.x + zone.width * 0.25;
            } else if (ball.x > zone.x + zone.width) {
                targetX = zone.x + zone.width * 0.75;
            }
            
            // Vertical tracking
            const verticalOffset = (ball.y - 400) * 0.3;
            targetY = MathHelpers.clamp(
                targetY + verticalOffset,
                zone.y + 50,
                zone.y + zone.height - 50
            );
        }
        
        // Avoid clustering with teammates
        teammates.forEach(teammate => {
            if (teammate === player) return;
            
            const dist = MathHelpers.distance(targetX, targetY, teammate.x, teammate.y);
            if (dist < 60) {
                // Push away from teammate
                const angle = MathHelpers.angleBetween(teammate.x, teammate.y, targetX, targetY);
                targetX += Math.cos(angle) * (60 - dist);
                targetY += Math.sin(angle) * (60 - dist);
            }
        });
        
        // Clamp to zone bounds
        targetX = MathHelpers.clamp(targetX, zone.x + 20, zone.x + zone.width - 20);
        targetY = MathHelpers.clamp(targetY, zone.y + 20, zone.y + zone.height - 20);
        
        return { x: targetX, y: targetY };
    }
    
    /**
     * Should player leave zone for tactical reason?
     */
    shouldAbandonZone(player, ball, context) {
        const zone = this.getZone(player.team, player.zone);
        if (!zone) return false;
        
        // Ball is very close - always pursue regardless of zone
        const distToBall = MathHelpers.distance(player.x, player.y, ball.x, ball.y);
        if (distToBall < 100) {
            return Math.random() < GameConfig.AI.ZONE_ABANDON_THRESHOLD * 1.3;
        }
        
        // Ball in zone - stay
        const ballInZone = MathHelpers.pointInRect(
            ball.x, ball.y,
            zone.x, zone.y,
            zone.width, zone.height
        );
        
        if (ballInZone) {
            return false; // Never abandon if ball is in our zone
        }
        
        // Check if zone is overcrowded
        const density = this.getZoneDensity(player.team, player.zone, context.allPlayers);
        if (density > 2) {
            return Math.random() < GameConfig.AI.ZONE_ABANDON_THRESHOLD * 0.7;
        }
        
        // Critical defensive situation - can leave zone
        if (player.team === 1 && ball.x < 200) {
            return Math.random() < GameConfig.AI.ZONE_ABANDON_THRESHOLD;
        }
        if (player.team === 2 && ball.x > 1000) {
            return Math.random() < GameConfig.AI.ZONE_ABANDON_THRESHOLD;
        }
        
        return false;
    }
    
    /**
     * Update and render zones (debug)
     */
    update(ball) {
        if (!GameConfig.DEBUG.SHOW_ZONES || !this.zoneGraphics) return;
        
        this.zoneGraphics.clear();
        
        // Draw team 1 zones
        this.drawTeamZones(this.zones.team1, 0x0000ff);
        
        // Draw team 2 zones
        this.drawTeamZones(this.zones.team2, 0xff0000);
    }
    
    drawTeamZones(teamZones, color) {
        for (let zoneName in teamZones) {
            const zone = teamZones[zoneName];
            
            this.zoneGraphics.lineStyle(2, color, 0.3);
            this.zoneGraphics.strokeRect(zone.x, zone.y, zone.width, zone.height);
            
            // Zone name label
            this.zoneGraphics.fillStyle(color, 0.1);
            this.zoneGraphics.fillRect(zone.x, zone.y, zone.width, zone.height);
        }
    }
    
    destroy() {
        if (this.zoneGraphics) {
            this.zoneGraphics.destroy();
        }
    }
}
