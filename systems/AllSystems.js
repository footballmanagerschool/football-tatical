/**
 * DefenseSystem.js
 */
class DefenseSystem {
    constructor(scene) {
        this.scene = scene;
    }
    
    calculateDefensivePosition(player, ball, opponentWithBall) {
        // Posiciona-se entre o oponente e o gol
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

/**
 * ShootingSystem.js
 */
class ShootingSystem {
    constructor() {}
    
    handleShoot(player, ball, targetX, targetY, chargeTime) {
        return player.kick(ball, targetX, targetY, chargeTime);
    }
    
    calculateShootPower(player, chargeTime) {
        const maxCharge = 1.5;
        const normalizedCharge = Math.min(chargeTime, maxCharge) / maxCharge;
        return player.stats.shootPower * normalizedCharge;
    }
}
