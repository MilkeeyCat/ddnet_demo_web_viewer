import { Graphics } from './Graphics';
import { UI } from './UI';
import { UIRect } from './UIRect';
import { ColorRGBA } from './common';

export class Client {
    canvas: HTMLCanvasElement;
    ctx: WebGL2RenderingContext;
    graphics: Graphics;
    ui: UI;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = this.canvas.getContext('webgl2');
        if (!ctx) {
            throw new Error('failed to get context');
        }
        this.ctx = ctx;
        this.graphics = new Graphics(
            this.canvas.width,
            this.canvas.height,
            this.ctx,
        );

        window.addEventListener('resize', () => {
            this.onWindowResize();
        });
    }

    async initGraphics() {
        await this.graphics.init();
    }

    run() {
        this.ui = new UI(this.graphics);
        this.ui.mapScreen();

        //move it to UI class
        UIRect.init(this.graphics);

        window.requestAnimationFrame(() => this.update());
    }

    update() {
        this.graphics.clear(0, 0, 0, false);

        this.graphics.drawRect(
            100,
            100,
            100,
            100,
            new ColorRGBA(1, 1, 1, 1),
            0,
            0,
        );

        this.graphics.swap();
        window.requestAnimationFrame(() => this.update());
    }

    onWindowResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.ctx.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.graphics.onWindowResize(this.canvas.width, this.canvas.height);
        this.ui.mapScreen();
    }
}

//NOTE: i dont really like making functions which create
//instance of a class but it's the best way i could do it
export async function createClient(canvas: HTMLCanvasElement): Promise<Client> {
    const client = new Client(canvas);
    await client.initGraphics();

    return client;
}
