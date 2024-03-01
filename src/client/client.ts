import { Graphics } from './Graphics';
import { UI } from './UI';
import { UIRect } from './UIRect';
import { Component } from './component';
import { Test } from './components/test';

export class Client {
    canvas: HTMLCanvasElement;
    ctx: WebGL2RenderingContext;
    graphics: Graphics;
    components: Component[];

    ui: UI;
    test: Test;

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

        //components
        this.test = new Test(this);

        this.components = [this.test];
    }

    async init() {
        await this.graphics.init(this.canvas.width, this.canvas.height);

        this.ui = new UI(this.graphics);

        //move it to UI class
        UIRect.init(this.graphics);

        for (const component of this.components) {
            component.onInit();
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
}

//NOTE: i dont really like making functions which create
//instance of a class but it's the best way i could do it
export async function createClient(canvas: HTMLCanvasElement): Promise<Client> {
    const client = new Client(canvas);
    await client.init();

    return client;
}
