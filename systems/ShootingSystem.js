/**
 * ShootingSystem.js
 * 
 * Sistema para chutes, delegando lógica de kick do Player.
 */

class ShootingSystem {
    handleShoot(player, ball, targetX, targetY, chargeTime) {
        player.kick(ball, targetX, targetY, chargeTime); // Chama o método refatorado
    }
}
