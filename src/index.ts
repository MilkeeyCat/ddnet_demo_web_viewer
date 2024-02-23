import {
    Graphics,
} from './client/Graphics';
import { ColorRGBA } from './client/common';

function update(graphics: Graphics) {
    graphics.clear(0, 0, 0, false);

    graphics.drawRect(100, 100, 100, 100, new ColorRGBA(1, 0, 0, 1), 0, 50);

    graphics.swap();

    window.requestAnimationFrame(() => update(graphics));
}

// entry point to the whole program. nobody whould've guessed
function main() {
    const canvas = document.querySelector<HTMLCanvasElement>('#canvas');

    if (!canvas) {
        throw new Error("Couldn't find the canvas!");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('webgl2');

    if (!ctx) {
        throw new Error("Couldn't create a rendering context");
    }

    const graphics = new Graphics(ctx);

    window.requestAnimationFrame(() => update(graphics));
}

main();
