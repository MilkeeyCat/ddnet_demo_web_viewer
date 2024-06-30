import { Client } from '../client';
import { Point } from '../common';
import { Component } from '../component';

export class Camera extends Component {
    static ZOOM_STEP = 0.866025;

    /** @param {Client} client */
    constructor(client) {
        super(client);

        /** @type number */
        this.zoom = 1;
        /** @type Point */
        this.center = new Point(0, 0);
    }

    /** @override */
    onRender() {
        this.center = this.client.controls.mousePos.clone();
    }

    /** @param {number} factor */
    scaleZoom(factor) {
        this.zoom *= factor;
    }

    zoomPlus() {
        this.scaleZoom(Camera.ZOOM_STEP);
    }

    zoomMinus() {
        this.scaleZoom(1 / Camera.ZOOM_STEP);
    }
}
