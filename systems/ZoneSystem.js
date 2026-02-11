/**
 * ZoneSystem.js
 * 
 * Sistema que divide o campo em zonas e gerencia posicionamento de jogadores
 */

class ZoneSystem {
    constructor(scene) {
        this.scene = scene;
        this.zones = this.createZones();
    }
    
    /**
     * Cria grade de zonas no campo
     */
    createZones() {
        const zones = [];
        const zoneWidth = GameConfig.FIELD.WIDTH / 6;
        const zoneHeight = GameConfig.FIELD.HEIGHT / 4;
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
                zones.push({
                    id: `zone_${row}_${col}`,
                    x: col * zoneWidth + zoneWidth / 2,
                    y: row * zoneHeight + zoneHeight / 2,
                    width: zoneWidth,
                    height: zoneHeight,
                    assignedPlayers: []
                });
            }
        }
        
        return zones;
    }
    
    /**
     * Atribui zonas aos jogadores baseado em posição
     */
    assignPlayerZones(players) {
        players.forEach(player => {
            const zone = this.getZoneAtPosition(player.basePosition.x, player.basePosition.y);
            if (zone) {
                zone.assignedPlayers.push(player);
                player.assignedZone = zone;
            }
        });
    }
    
    /**
     * Retorna zona em determinada posição
     */
    getZoneAtPosition(x, y) {
        return this.zones.find(zone => {
            return x >= zone.x - zone.width / 2 &&
                   x <= zone.x + zone.width / 2 &&
                   y >= zone.y - zone.height / 2 &&
                   y <= zone.y + zone.height / 2;
        });
    }
    
    /**
     * Retorna zona mais próxima da bola
     */
    getZoneNearBall(ball) {
        let closest = this.zones[0];
        let minDist = MathHelpers.distance(ball.x, ball.y, closest.x, closest.y);
        
        this.zones.forEach(zone => {
            const dist = MathHelpers.distance(ball.x, ball.y, zone.x, zone.y);
            if (dist < minDist) {
                minDist = dist;
                closest = zone;
            }
        });
        
        return closest;
    }
}
