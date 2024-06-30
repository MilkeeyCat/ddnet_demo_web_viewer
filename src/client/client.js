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
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLInputElement} input
     */
    constructor(canvas, input) {
        /** @type {HTMLCanvasElement} */
        this.canvas = canvas;
        /** @type {HTMLInputElement} */
        this.input = input;

        /** @type {?WebGL2RenderingContext} */
        const ctx = this.canvas.getContext('webgl2');
        if (!ctx) {
            throw new Error('failed to get context');
        }

        /** @type {WebGL2RenderingContext} */
        this.ctx = ctx;
        /** @type {Graphics} */
        this.graphics = new Graphics(this.ctx);

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            this.onWindowResize();
        });

        /** @type {boolean} */
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
            const target = /** @type {!HTMLInputElement} */ (e.target);

            if (target.files && target.files[0]) {
                /** @type {ArrayBuffer} */
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

        /** @type {Test} */
        this.test = new Test(this);
        /** @type {Controls} */
        this.controls = new Controls(this);
        /** @type {Camera} */
        this.camera = new Camera(this);
        /** @type {Component[]} */
        this.components = [this.test, this.controls, this.camera];
    }

    async init() {
        await this.graphics.init(this.canvas.width, this.canvas.height);

        /** @type {UI} */
        this.ui = new UI(this.graphics);
        /** @type {RenderTools} */
        this.renderTools = new RenderTools(this.graphics);
        //move it to UI class
        UIRect.init(this.graphics);

        for (const component of this.components) {
            await component.onInit();
        }
    }

    /** @param {Uint8Array} data */
    onDemoLoad(data) {
        /** @type {DemoReader} */
        this.demo = new DemoReader(data);

        for (const group of this.demo.demo.map.groups) {
            if (group.name === 'Game') {
                for (const layer of group.layers) {
                    if (layer instanceof GameLayer) {
                        /** @type {GameLayer} */
                        this.gameLayer = layer;
                    }
                }
            }
        }

        for (const component of this.components) {
            component.onMapLoad();
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

    /** @param {MouseEvent} e */
    onMouseMove(e) {
        for (const component of this.components) {
            component.onCursorMove(e.movementX, e.movementY);
        }
    }
}

//NOTE: i dont really like making functions which create
//instance of a class but it's the best way i could do it
/**
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLInputElement} input
 * @returns {Promise<Client>}
 */
export async function createClient(canvas, input) {
    const client = new Client(canvas, input);
    await client.init();

    return client;
}
