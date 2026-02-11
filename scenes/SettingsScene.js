/**
 * SettingsScene.js
 * 
 * Tela de configurações para ajustar FPS e outras opções.
 */

class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        this.add.text(600, 200, 'Settings', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        
        const fpsOptions = [30, 60, 120];
        fpsOptions.forEach((fps, i) => {
            const btn = this.add.text(600, 300 + i * 50, `FPS: ${fps}`, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setInteractive();
            btn.on('pointerdown', () => {
                this.scene.game.loop.targetFps = fps; // Reduz FPS
                this.scene.start('MainMenuScene');
            });
        });
        
        const backBtn = this.add.text(600, 500, 'Back', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        backBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }
}
