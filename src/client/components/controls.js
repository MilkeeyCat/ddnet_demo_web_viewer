import { clampf } from '@/utils/clampf';
import { Client } from '../client';
import { Point } from '../common';
import { Component } from '../component';

export class Controls extends Component {
    //mousePos: Point;

    /** @param {Client} client */
    constructor(client) {
        super(client);

        /** @type {Point} */
        this.mousePos = new Point(0, 0);
    }

    clampMousePos() {
        /** @type {number} */
        let w;
        /** @type {number} */
        let h;

        if (this.client.gameLayer) {
            w = this.client.gameLayer.tiles.loadInfo.size[0];
            h = this.client.gameLayer.tiles.loadInfo.size[1];
        } else {
            w = 1;
            h = 1;
        }

        this.mousePos.x = clampf(this.mousePos.x, -201 * 32, (w + 201) * 32);
        this.mousePos.y = clampf(this.mousePos.y, -201 * 32, (h + 201) * 32);
    }

    /**
     * @override
     * @param {number} x
     * @param {number} y
     */
    onCursorMove(x, y) {
        this.mousePos.x += x;
        this.mousePos.y += y;

        this.clampMousePos();
    }
}
