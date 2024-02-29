import { Client } from "./client";

export class Component {
    protected client: Client;

    onInit(): void { }
    onReset(): void { }
    onWindowResize(): void { }
    onRender(): void { }
    onRelease(): void { }
    onCursorMove(): void { }
    onInput(): void { }
}
