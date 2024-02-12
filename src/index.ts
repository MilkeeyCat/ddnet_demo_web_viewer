import { Graphics } from "./client/Graphics";

function update(graphics: Graphics) {
    graphics.clear(.5, .1, 1, false);

    graphics.quadsBegin();
    graphics.setColor(.5, .5, 1, 1);
    graphics.drawRect(0, 0, 100, 100, 3, 2);
    graphics.quadsEnd();

    graphics.swap();

    window.requestAnimationFrame(() => update(graphics));
}

// entry point to the whole program
function main() {
    const canvas = document.querySelector<HTMLCanvasElement>("#canvas");

    if (!canvas) {
        throw new Error("Couldn't find the canvas!");
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("webgl2");

    if (!ctx) {
        throw new Error("Couldn't create a rendering context");
    }

    const graphics = new Graphics(ctx);


    window.requestAnimationFrame(() => update(graphics));
}

main();

