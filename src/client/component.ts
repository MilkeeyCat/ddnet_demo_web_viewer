import { Graphics } from './Graphics';
import { UI } from './UI';
import { Client } from './client';

export class Component {
    constructor(protected client: Client) {}

    get graphics(): Graphics {
        return this.client.graphics;
    }

    get ui(): UI {
        return this.client.ui;
    }

    onInit(): void {}
    onReset(): void {}
    onWindowResize(): void {}
    onRender(): void {}
    onRelease(): void {}
    onCursorMove(): void {}
    onInput(): void {}
}
