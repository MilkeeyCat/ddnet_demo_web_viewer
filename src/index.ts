import {
    CORNER_BL,
    CORNER_BR,
    CORNER_TL,
    CORNER_TR,
    Graphics,
} from './client/Graphics';

function update(graphics: Graphics) {
    graphics.clear(0.5, 0.1, 1, false);

    graphics.quadsBegin();
    graphics.setColor(1, 0, 0, 1);
    graphics.drawRect(100, 100, 100, 100, 50, CORNER_BL | CORNER_TR);
    graphics.quadsEnd();

    graphics.quadsBegin();
    graphics.setColor(0, 1, 0, 1);
    graphics.drawRect(300, 100, 100, 100, 50, CORNER_TL | CORNER_BR);
    graphics.quadsEnd();

    graphics.quadsBegin();
    graphics.setColor(0, 0, 1, 1);
    graphics.drawRect(100, 300, 100, 100, 50, CORNER_TL | CORNER_BR);
    graphics.quadsEnd();

    graphics.quadsBegin();
    graphics.setColor(0.5, 1, 1, 1);
    graphics.drawRect(300, 300, 100, 100, 50, CORNER_BL | CORNER_TR);
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
