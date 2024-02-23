import {
    CORNER_BL,
    Graphics,
} from './client/Graphics';
import { ColorRGBA } from './client/common';

function update(graphics: Graphics) {
    graphics.clear(0, 0, 0, false);

    graphics.quadsBegin();

    graphics.quadsSetRotation(.1);
    graphics.setColor(1, 1, 1, 1);
    graphics.drawRectExt(100, 100, 100, 100, 50, 0);

    graphics.quadsEnd();

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
