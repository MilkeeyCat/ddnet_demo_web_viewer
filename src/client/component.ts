import { DemoReader } from '@/demo';
import { Graphics } from './Graphics';
import { UI } from './UI';
import { Client } from './client';
import { RenderTools } from './render';

export class Component {
    constructor(protected client: Client) {}

    get graphics(): Graphics {
        return this.client.graphics;
    }

    get renderTools(): RenderTools {
        return this.client.renderTools;
    }

    get demo(): DemoReader {
        return this.client.demo;
    }

    get ui(): UI {
        return this.client.ui;
    }

    async onInit(): Promise<void> {}
    onReset(): void {}
    onWindowResize(): void {}
    onRender(): void {}
    onRelease(): void {}
    onCursorMove(_x: number, _y: number): void {}
    onInput(): void {}
}
