/**
 * MainMenuScene.js
 * 
 * Tela inicial do jogo com opções para iniciar ou acessar configurações.
 */

class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        // Fundo gradient (ajuste conforme seu estilo)
        this.add.rectangle(600, 400, 1200, 800, 0x1a5f2e);
        this.add.text(600, 200, 'Tactical Football Manager', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);
        
        const startBtn = this.add.text(600, 400, 'Start Game', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        startBtn.on('pointerdown', () => this.scene.start('GameScene'));
        
        const configBtn = this.add.text(600, 450, 'Settings', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5).setInteractive();
        configBtn.on('pointerdown', () => this.scene.start('SettingsScene'));
    }
}
