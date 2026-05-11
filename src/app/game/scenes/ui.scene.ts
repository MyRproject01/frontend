import { Scene } from 'phaser';
import { GameState } from '../core/game-state.manager';

/**
 * Escena de Interfaz de Usuario (UIScene)
 * 
 * Gestiona elementos visuales estáticos como textos de Oro y Vidas.
 * NOTA: Actualmente se está migrando a UI de HTML/Angular (game.html),
 * esta escena muestra el texto "legacy" de Phaser.
 */
export class UIScene extends Scene {
    // Textos del HUD
    goldText: Phaser.GameObjects.Text | undefined;
    livesText: Phaser.GameObjects.Text | undefined;

    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Crear textos simples
        this.goldText = this.add.text(20, 20, 'Oro: 0', { fontSize: '24px', color: '#ffd700' }); // Dorado
        this.livesText = this.add.text(20, 50, 'Vidas: 20', { fontSize: '24px', color: '#ff0000' }); // Rojo
    }

    override update() {
        // Actualizar textos con el estado global
        if (this.goldText) {
            this.goldText.setText(`Oro: ${GameState.gold()}`);
        }
        if (this.livesText) {
            this.livesText.setText(`Vidas: ${GameState.lives()}`);
        }
    }
}
