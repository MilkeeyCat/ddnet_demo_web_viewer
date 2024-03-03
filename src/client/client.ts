import { Graphics } from './Graphics';
import { UI } from './UI';
import { UIRect } from './UIRect';
import { Component } from './component';
import { Camera } from './components/camera';
import { Controls } from './components/controls';
import { Test } from './components/test';
import { RenderTools } from './render';

export class Client {
    canvas: HTMLCanvasElement;
    ctx: WebGL2RenderingContext;
    graphics: Graphics;
    components: Component[];

    ui: UI;
    renderTools: RenderTools;

    test: Test;
    controls: Controls;
    camera: Camera;

    pointerLocked: boolean;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = this.canvas.getContext('webgl2');
        if (!ctx) {
            throw new Error('failed to get context');
        }
        this.ctx = ctx;
        this.graphics = new Graphics(this.ctx);

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            this.onWindowResize();
        });

        this.pointerLocked = false;
        window.addEventListener('click', (_) => {
            if (this.pointerLocked) {
                document.exitPointerLock();
            } else {
                this.canvas.requestPointerLock();
            }

            this.pointerLocked = !this.pointerLocked;
        });

        window.addEventListener('mousemove', (e) => {
            this.onMouseMove(e);
        });

        //components
        this.test = new Test(this);
        this.controls = new Controls(this);
        this.camera = new Camera(this);

        this.components = [this.test, this.controls, this.camera];
    }

    async init() {
        await this.graphics.init(this.canvas.width, this.canvas.height);

        this.ui = new UI(this.graphics);
        this.renderTools = new RenderTools(this.graphics);
        //move it to UI class
        UIRect.init(this.graphics);

        for (const component of this.components) {
            await component.onInit();
        }
    }

    run() {
        window.requestAnimationFrame(() => this.render());
    }

    render() {
        this.graphics.clear(0, 0, 0, false);

        for (const component of this.components) {
            component.onRender();
        }

        this.graphics.swap();
        window.requestAnimationFrame(() => this.render());
    }

    onWindowResize() {
        for (const component of this.components) {
            component.onWindowResize();
        }

        this.graphics.gotResized(this.canvas.width, this.canvas.height);
    }

    onMouseMove(e: MouseEvent) {
        for (const component of this.components) {
            component.onCursorMove(e.movementX, e.movementY);
        }
    }
}

//NOTE: i dont really like making functions which create
//instance of a class but it's the best way i could do it
export async function createClient(canvas: HTMLCanvasElement): Promise<Client> {
    const client = new Client(canvas);
    await client.init();

    return client;
}
