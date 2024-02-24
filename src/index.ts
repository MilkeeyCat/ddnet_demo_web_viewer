import {
    CORNER_ALL,
    Graphics,
} from './client/Graphics';
import { UIRect } from './client/UIRect';
import { ColorRGBA } from './client/common';

const rect = new UIRect(100, 100, 100, 100);

function update(graphics: Graphics) {
    graphics.clear(0, 0, 0, false);

    rect.draw4(new ColorRGBA(.5, .5, 1, 1), new ColorRGBA(1, 1, .5, 1), new ColorRGBA(1, .5, 1, 1), new ColorRGBA(.5, 1, 1, 1), CORNER_ALL, 50);

    graphics.swap();

    window.requestAnimationFrame(() => update(graphics));
}

// entry point to the whole program. nobody whould've guessed
async function main() {
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

    const graphics = new Graphics(canvas.width, canvas.height, ctx);

    await graphics.init();
    UIRect.init(graphics);

    window.requestAnimationFrame(() => update(graphics));
}

main();
