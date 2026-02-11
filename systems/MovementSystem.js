/**
 * MovementSystem.js
 * 
 * Sistema que gerencia movimento de jogadores
 */

class MovementSystem {
    constructor(scene) {
        this.scene = scene;
    }
    
    /**
     * Move jogador para posição alvo
     */
    movePlayerTo(player, targetX, targetY, sprint = false) {
        player.moveTo(targetX, targetY, sprint);
    }
    
    /**
     * Retorna jogador à sua posição base
     */
    returnToBasePosition(player) {
        const dist = MathHelpers.distance(
            player.x, player.y, 
            player.basePosition.x, player.basePosition.y
        );
        
        if (dist > 50) {
            player.moveTo(player.basePosition.x, player.basePosition.y, false);
        } else {
            player.stop();
        }
    }
    
    /**
     * Intercepta bola
     */
    interceptBall(player, ball) {
        // Predição da posição da bola
        const predictTime = 0.5; // 500ms à frente
        const predictedX = ball.x + ball.body.velocity.x * predictTime;
        const predictedY = ball.y + ball.body.velocity.y * predictTime;
        
        player.moveTo(predictedX, predictedY, true);
    }
    
    /**
     * Verifica se jogador pode alcançar a bola
     */
    canReachBall(player, ball) {
        const dist = MathHelpers.distance(player.x, player.y, ball.x, ball.y);
        return dist < 50;
    }
}
