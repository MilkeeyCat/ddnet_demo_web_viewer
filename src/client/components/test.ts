import { ColorRGBA } from '../common';
import { Component } from '../component';
import { CORNER_NONE, TextureHandle } from '../Graphics';

export class Test extends Component {
    handle: TextureHandle;

    override async onInit(): Promise<void> {}

    override onRender(): void {
        this.graphics.mapScreen(0, 0, 1, 1);
        this.graphics.drawRect(
            0,
            0,
            1,
            1,
            new ColorRGBA(0.5, 0.5, 0.5, 1),
            0,
            CORNER_NONE,
        );

        this.renderTools.mapScreenToGroup(
            this.client.camera.center.x,
            this.client.camera.center.y,
            {
                parallaxX: 100,
                parallaxY: 100,
                offsetX: 0,
                offsetY: 0,
            },
            this.client.camera.zoom,
        );

        this.graphics.drawRect(
            0,
            0,
            100,
            100,
            new ColorRGBA(1, 1, 1, 1),
            0,
            CORNER_NONE,
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
