/**
 * DecisionSystem.js
 */
class DecisionSystem {
    constructor(scene, defenseSystem, movementSystem, zoneSystem) {
        this.scene = scene;
        this.defenseSystem = defenseSystem;
        this.movementSystem = movementSystem;
        this.zoneSystem = zoneSystem;
    }
    
    makeDecision(player, ball, allPlayers) {
        const distToBall = MathHelpers.distance(player.x, player.y, ball.x, ball.y);
        
        // Se está perto da bola, tenta interceptar
        if (distToBall < 100) {
            this.movementSystem.interceptBall(player, ball);
        } else {
            // Retorna à posição base
            this.movementSystem.returnToBasePosition(player);
        }
    }
}
