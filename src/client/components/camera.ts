import { Client } from '../client';
import { Point } from '../common';
import { Component } from '../component';

export class Camera extends Component {
    center: Point;

    constructor(client: Client) {
        super(client);
        this.center = new Point(0, 0);
    }

    override onRender() {
        this.center = this.client.controls.mousePos.clone();
    }
}
