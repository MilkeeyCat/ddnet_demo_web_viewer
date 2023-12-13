import { Graphics } from "./Graphics";

const canvas: HTMLCanvasElement | null = document.querySelector("#canvas");

if (!canvas) {
    throw new Error("Deez nuts");
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("webgl2");

if (!ctx) {
    throw new Error("Deez nuts #2");
}

const graphics = new Graphics(ctx);
