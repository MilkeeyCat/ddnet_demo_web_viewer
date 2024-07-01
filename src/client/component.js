import { DemoReader } from '@/demo';
import { Graphics } from './Graphics';
import { UI } from './UI';
import { Client } from './client';
import { RenderTools } from './render';

export class Component {
    /** @param {Client} client */
    constructor(client) {
        this.client = client;
    }

    /** @returns {Graphics} */
    get graphics() {
        return this.client.graphics;
    }

    /** @returns {RenderTools} */
    get renderTools() {
        return this.client.renderTools;
    }

    /** @returns {DemoReader} */
    get demo() {
        return this.client.demo;
    }

    /** @returns {UI} */
    get ui() {
        return this.client.ui;
    }

    async onInit() { }

    onReset() { }

    onWindowResize() { }

    onRender() { }

    onMapLoad() { }

    onRelease() { }

    /**
     * @param {number} x
     * @param {number} y
     */
    onCursorMove(x, y) { }

    onInput() { }
}
