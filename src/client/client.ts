import { DemoReader } from '@/demo';
import { Graphics } from './Graphics';
import { UI } from './UI';
import { UIRect } from './UIRect';
import { Component } from './component';
import { Camera } from './components/camera';
import { Controls } from './components/controls';
import { Test } from './components/test';
import { RenderTools } from './render';
import { GameLayer } from '@/datafile/Layer';

export class Client {
    canvas: HTMLCanvasElement;
    input: HTMLInputElement;
    ctx: WebGL2RenderingContext;
    graphics: Graphics;
    components: Component[];

    ui: UI;
    renderTools: RenderTools;
    demo: DemoReader;

    test: Test;
    controls: Controls;
    camera: Camera;

    //TODO: remove this cringe
    gameLayer: GameLayer;

    pointerLocked: boolean;

    constructor(canvas: HTMLCanvasElement, input: HTMLInputElement) {
        this.canvas = canvas;
        this.input = input;
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

        this.input.onchange = async (e) => {
            const target = e.target as HTMLInputElement;

            if (target.files && target.files[0]) {
                const data = await target.files[0].arrayBuffer();
                this.onDemoLoad(new Uint8Array(data));
            }
        };

        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'l':
                    this.input.click();
                    break;
                case '-':
                    this.camera.zoomMinus();
                    break;
                case '=':
                    this.camera.zoomPlus();
                    break;
            }
        });

        //components
        this.test = new Test(this);
        this.controls = new Controls(this);
        this.camera = new Camera(this);

        this.components = [this.test, this.controls, this.camera];
    }

    async init(): Promise<void> {
        await this.graphics.init(this.canvas.width, this.canvas.height);

        this.ui = new UI(this.graphics);
        this.renderTools = new RenderTools(this.graphics);
        //move it to UI class
        UIRect.init(this.graphics);

        for (const component of this.components) {
            await component.onInit();
        }
    }

    onDemoLoad(data: Uint8Array) {
        this.demo = new DemoReader(data);

        for (const group of this.demo.demo.map.groups) {
            if (group.name === 'Game') {
                for (const layer of group.layers) {
                    if (layer instanceof GameLayer) {
                        this.gameLayer = layer;
                    }
                }
            }
        }

        for (const component of this.components) {
            component.onMapLoad();
        }
    }

    run(): void {
        window.requestAnimationFrame(() => this.render());
    }

    render(): void {
        this.graphics.clear(0, 0, 0, false);

        for (const component of this.components) {
            component.onRender();
        }

        this.graphics.swap();
        window.requestAnimationFrame(() => this.render());
    }

    onWindowResize(): void {
        for (const component of this.components) {
            component.onWindowResize();
        }

        this.graphics.gotResized(this.canvas.width, this.canvas.height);
    }

    onMouseMove(e: MouseEvent): void {
        for (const component of this.components) {
            component.onCursorMove(e.movementX, e.movementY);
        }
    }
}

//NOTE: i dont really like making functions which create
//instance of a class but it's the best way i could do it
export async function createClient(
    canvas: HTMLCanvasElement,
    input: HTMLInputElement,
): Promise<Client> {
    const client = new Client(canvas, input);
    await client.init();

    return client;
}
