import {
    BufferContainerAttribute,
    BufferContainerInfo,
} from '../CommandWebGL2CommandProcessorFragment';
import { GRAPHICS_TYPE_FLOAT } from '../Graphics';
import { ColorRGBA } from '../common';
import { Component } from '../component';

export class Test extends Component {
    bufferContainerIndex: number;

    override async onInit(): Promise<void> {
        const data = new Float32Array([0, 0, 100, 0, 100, 100, 0, 100]);
        const bufferObjectIndex = this.graphics.createBufferObject(data);
        const containerInfo = new BufferContainerInfo(0, bufferObjectIndex, [
            new BufferContainerAttribute(2, GRAPHICS_TYPE_FLOAT, false, 0, 0),
        ]);

        this.bufferContainerIndex =
            this.graphics.createBufferContainer(containerInfo);
    }

    override onRender(): void {
        this.graphics.mapScreen(-200, -200, 200, 200);

        this.graphics.renderTileLayer(
            this.bufferContainerIndex,
            new ColorRGBA(0.5, 0.5, 0.5, 1),
            [0],
            [6],
            1,
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
