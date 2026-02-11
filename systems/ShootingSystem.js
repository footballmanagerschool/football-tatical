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
