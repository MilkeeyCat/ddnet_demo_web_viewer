import { ColorRGBA } from '../common';
import { Component } from '../component';

export class Test extends Component {
    override async onInit() {
        const img = await this.graphics.loadImage('/assets/skins/default.png');
        const smth = this.graphics.loadTexture(img);
        const img2 = await this.graphics.loadImage('/assets/skins/saddo.png');
        const smth2 = this.graphics.loadTexture(img2);
        console.log(smth);
        console.log(smth2);
        this.graphics.textureSet(smth);
    }

    override onRender() {
        this.ui.mapScreen();

        this.graphics.drawRect(
            100,
            100,
            100,
            100,
            new ColorRGBA(1, 1, 1, 1),
            0,
            0,
        );
    }

    override onReset() {
        console.log('onReset');
    }

    override onWindowResize() {
        console.log('onWindowResize');
    }

    override onRelease() {
        console.log('onRelease');
    }

    override onCursorMove() {
        console.log('onCursorMove');
    }

    override onInput() {
        console.log('onInput');
    }
}
