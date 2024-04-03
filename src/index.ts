import { createClient } from './client/client';

async function main(): Promise<void> {
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');

    if (!canvas) {
        throw new Error("Couldn't find the canvas!");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const input = document.querySelector<HTMLInputElement>('#input');

    if (!input) {
        throw new Error("Couldn't find the input!");
    }

    const client = await createClient(canvas, input);

    client.run();
}

main();
