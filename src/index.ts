import { Graphics } from './client/Graphics';
import { UI } from './client/UI';
import { UIRect } from './client/UIRect';
import { ColorRGBA } from './client/common';

function onWindowResize(
    graphics: Graphics,
    ui: UI,
    canvas: HTMLCanvasElement,
    ctx: WebGL2RenderingContext,
) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    ctx.viewport(0, 0, canvas.width, canvas.height);
    graphics.onWindowResize(canvas.width, canvas.height);
    ui.mapScreen();
}

function update(graphics: Graphics) {
    graphics.clear(0, 0, 0, false);

    graphics.drawRect(100, 100, 100, 100, new ColorRGBA(1, 1, 1, 1), 0, 0);

    graphics.swap();

    window.requestAnimationFrame(() => update(graphics));
}

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
    const ui = new UI(graphics);
    ui.mapScreen();
    UIRect.init(graphics);

    window.addEventListener('resize', () => {
        onWindowResize(graphics, ui, canvas, ctx);
    });
    window.requestAnimationFrame(() => update(graphics));
}

main();
