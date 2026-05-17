import { Scene } from 'phaser';
import { GameState } from '../core/game-state.manager';

export class UIScene extends Scene {
    goldText: Phaser.GameObjects.Text | undefined;
    livesText: Phaser.GameObjects.Text | undefined;

    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        this.goldText = this.add.text(20, 20, 'Oro: 0', { fontSize: '24px', color: '#ffd700' });
        this.livesText = this.add.text(20, 50, 'Vidas: 20', { fontSize: '24px', color: '#ff0000' });
    }

    override update() {
        if (this.goldText) {
            this.goldText.setText(`Oro: ${GameState.gold()}`);
        }
        if (this.livesText) {
            this.livesText.setText(`Vidas: ${GameState.lives()}`);
        }
    }
}
