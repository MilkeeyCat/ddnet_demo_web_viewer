import { createClient } from './client/client';

async function main() {
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');

    if (!canvas) {
        throw new Error("Couldn't find the canvas!");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const client = await createClient(canvas);

    client.run();
}

main();
