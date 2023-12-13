import { Graphics } from "./client/Graphics";

function update(graphics: Graphics) {
    graphics.clear(.5, .1, 1, false);
    graphics.swap();
    window.requestAnimationFrame(() => update(graphics));

}

function main() {
    const canvas = document.querySelector<HTMLCanvasElement>("#canvas");

    if (!canvas) {
        throw new Error("Couldn't find the canvas!");
    }

    const ctx = canvas.getContext("webgl2");

    if (!ctx) {
        throw new Error("Couldn't create a rendering context");
    }

    const graphics = new Graphics(ctx);


    window.requestAnimationFrame(() => update(graphics));
}

main();

