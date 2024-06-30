import { Client, createClient } from './client/client';

async function main() {
    /** @type {?HTMLCanvasElement} */
    const canvas = document.querySelector('#canvas');
    if (!canvas) {
        throw new Error("Couldn't find the canvas!");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    /** @type {?HTMLInputElement} */
    const input = document.querySelector('#input');
    if (!input) {
        throw new Error("Couldn't find the input!");
    }

    /** @type {Client} */
    const client = await createClient(canvas, input);
    client.run();
}

main();
