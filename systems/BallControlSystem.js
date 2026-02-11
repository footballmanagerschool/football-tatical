/**
 * BallControlSystem.js
 */
class BallControlSystem {
    constructor() {}
    
    updateDribble(player, ball) {
        // Mantém a bola próxima ao jogador durante drible
        const angle = player.targetDirection || 0;
        const offset = 20;
        
        ball.setPosition(
            player.x + Math.cos(angle) * offset,
            player.y + Math.sin(angle) * offset
        );
    }
    
    checkBallControl(player, ball) {
        const dist = MathHelpers.distance(player.x, player.y, ball.x, ball.y);
        return dist < 30;
    }
}
