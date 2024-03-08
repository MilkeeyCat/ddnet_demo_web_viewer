import { clampf } from '@/utils/clampf';
import { Client } from '../client';
import { Point } from '../common';
import { Component } from '../component';

export class Controls extends Component {
    mousePos: Point;

    constructor(client: Client) {
        super(client);

        this.mousePos = new Point(0, 0);
    }

    clampMousePos() {
        let w: number;
        let h: number;

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

    override onCursorMove(x: number, y: number) {
        this.mousePos.x += x;
        this.mousePos.y += y;

        this.clampMousePos();
    }
}
