import { Component } from '../component';
import { TextureHandle } from '../Graphics';

export class Test extends Component {
    handle1: TextureHandle;
    handle2: TextureHandle;

    override async onInit(): Promise<void> {
        const img = await this.graphics.loadImage('/assets/skins/default.png');
        this.handle1 = this.graphics.loadTexture(img);

        const img2 = await this.graphics.loadImage('/assets/skins/saddo.png');
        this.handle2 = this.graphics.loadTexture(img2);
    }

    override onRender(): void {
        this.ui.mapScreen();

        this.graphics.textureSet(this.handle1);
        this.graphics.quadsBegin();
        this.graphics.drawRectExt(100, 100, 100, 100, 0, 0);
        this.graphics.quadsEnd();
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
