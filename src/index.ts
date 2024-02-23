import {
    CORNER_BL,
    CORNER_BR,
    CORNER_TL,
    CORNER_TR,
    Graphics,
} from './client/Graphics';
import { ColorRGBA } from './client/common';

function update(graphics: Graphics) {
    graphics.clear(0, 0, 0, false);

    graphics.drawRect(
        500,
        100,
        100,
        100,
        new ColorRGBA(1, 1, 1, 1),
        CORNER_BL | CORNER_TR | CORNER_BR | CORNER_TL,
        50,
    );

    graphics.quadsBegin();

    graphics.setColor(1, 1, 1, 1);

    graphics.drawRectExt(100, 100, 100, 100, 0, 0);

    graphics.quadsSetRotation(Math.PI / 4);
    graphics.drawRectExt(300, 100, 100, 100, 0, 0);

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
