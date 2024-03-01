import { ColorRGBA } from '../common';
import { Component } from '../component';

export class Test extends Component {
    override onInit() {
        console.log('onInit');
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
