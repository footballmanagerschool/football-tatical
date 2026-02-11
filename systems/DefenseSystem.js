/**
 * DefenseSystem.js
 */
class DefenseSystem {
    constructor(scene) {
        this.scene = scene;
    }
    
    calculateDefensivePosition(player, ball, opponentWithBall) {
        const goalX = player.team === 1 ? 0 : GameConfig.FIELD.WIDTH;
        const goalY = GameConfig.FIELD.HEIGHT / 2;
        
        if (opponentWithBall) {
            const midX = (opponentWithBall.x + goalX) / 2;
            const midY = (opponentWithBall.y + goalY) / 2;
            return { x: midX, y: midY };
        }
        
        return player.basePosition;
    }
}

