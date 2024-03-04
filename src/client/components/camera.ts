import { Client } from '../client';
import { Point } from '../common';
import { Component } from '../component';

export class Camera extends Component {
    center: Point;
    zoom: number;

    static ZOOM_STEP = 0.866025;

    constructor(client: Client) {
        super(client);

        this.zoom = 1;
        this.center = new Point(0, 0);
    }

    override onRender() {
        this.center = this.client.controls.mousePos.clone();
    }

    scaleZoom(factor: number) {
        this.zoom *= factor;
    }

    zoomPlus() {
        this.scaleZoom(Camera.ZOOM_STEP);
    }

    zoomMinus() {
        this.scaleZoom(1 / Camera.ZOOM_STEP);
    }
}
