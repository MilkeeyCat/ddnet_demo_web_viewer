//NOTE: kill me, its garbage

import { CommandBuffer } from "./CommandBuffer";
import { GraphicsBackend } from "./GraphicsBackend";
import { Command, CommandClear, CommandRender } from "./commands";
import { ColorRGBA, FreeformItem, Point, QuadItem, TexCoord, Vertex } from "./common";

function clampf(value: number, min: number, max: number) {
    if (value > max) {
        return max;
    } else if (value < min) {
        return min;
    }

    return value;
}

const CMD_BUFFER_DATA_BUFFER_SIZE = 1024 * 1024 * 2;
const CMD_BUFFER_CMD_BUFFER_SIZE = 1024 * 256;

const NUM_CMDBUFFERS = 2;

const DRAWING_QUADS = 1;
const DRAWING_LINES = 2;
const DRAWING_TRIANGLES = 3;


const CORNER_NONE = 0;
const CORNER_TL = 1;
const CORNER_TR = 2;
const CORNER_BL = 4;
const CORNER_BR = 8;

const CORNER_T = CORNER_TL | CORNER_TR;
const CORNER_B = CORNER_BL | CORNER_BR;
const CORNER_R = CORNER_TR | CORNER_BR;
const CORNER_L = CORNER_TL | CORNER_BL;

const CORNER_ALL = CORNER_T | CORNER_B;


const PRIMTYPE_INVALID = 0;
const PRIMTYPE_LINES = 1;
const PRIMTYPE_QUADS = 2;
const PRIMTYPE_TRIANGLES = 3;


export class Graphics {
    backend: GraphicsBackend;
    commandBuffers: Array<CommandBuffer>;
    commandBuffer: CommandBuffer;
    currentCommandBuffer: number;

    //Normalized color
    //color: Color[4];
    drawing: number;
    angle: number;
    color: [ColorRGBA, ColorRGBA, ColorRGBA, ColorRGBA];
    texture: [TexCoord, TexCoord, TexCoord, TexCoord];
    vertices: Vertex[];

    static MAX_TEXTURES = 1024 * 8;
    static MAX_VERTICES = 32 * 1024;

    static TEXFORMAT_INVALID = 0;
    static TEXFORMAT_RGBA = 1;

    static TEXFLAG_NOMIPMAPS = 1;
    static TEXFLAG_TO_3D_TEXTURE = (1 << 3);
    static TEXFLAG_TO_2D_ARRAY_TEXTURE = (1 << 4);
    static TEXFLAG_NO_2D_TEXTURE = (1 << 5);

    static PRIMTYPE_INVALID = 0;
    static PRIMTYPE_LINES = 1;
    static PRIMTYPE_QUADS = 2;
    static PRIMTYPE_TRIANGLES = 3;

    static BLEND_NONE = 0;
    static BLEND_ALPHA = 1;
    static BLEND_ADDITIVE = 2;

    static WRAP_REPEAT = 0;
    static WRAP_CLAMP = 1;

    constructor(ctx: WebGL2RenderingContext) {
        this.drawing = 0;
        this.angle = 0;
        this.texture = new Array(4).fill(new TexCoord(0, 0)) as [TexCoord, TexCoord, TexCoord, TexCoord];
        this.color = new Array(4).fill(new ColorRGBA(0, 0, 0, 0)) as [ColorRGBA, ColorRGBA, ColorRGBA, ColorRGBA];
        this.vertices = [];

        this.currentCommandBuffer = 0;
        this.commandBuffers = new Array(NUM_CMDBUFFERS).fill(null);

        for (let [i, _] of this.commandBuffers.entries()) {
            this.commandBuffers[i] = new CommandBuffer();
        }

        this.commandBuffer = this.commandBuffers[0]!;
        this.backend = new GraphicsBackend(ctx);

        console.log(this);
    }

    kickCommandBuffer() {
        this.backend.runBuffer(this.commandBuffer);

        //TODO: warnings!?!??

        this.currentCommandBuffer ^= 1;
        this.commandBuffer = this.commandBuffers[this.currentCommandBuffer]!;
        this.commandBuffer.reset();
    }

    swap() {
        //some magic shit...

        this.kickCommandBuffer();
    }

    //not sure the fuck is this
    quadsSetSubset(tlU: number, tlV: number, brU: number, brV: number) {
        this.texture[0].u = tlU;
        this.texture[1].u = brU;
        this.texture[0].v = tlV;
        this.texture[1].v = tlV;

        this.texture[2].u = brU;
        this.texture[3].u = tlU;
        this.texture[2].v = brV;
        this.texture[3].v = brV;
    }

    quadsSetRotation(angle: number) {
        this.angle = angle;
    }

    setColor(r: number, g: number, b: number, a: number) {
        let clampedR = clampf(r, 0, 1);
        let clampedG = clampf(g, 0, 1);
        let clampedB = clampf(b, 0, 1);
        let clampedA = clampf(a, 0, 1);

        clampedR *= 255;
        clampedG *= 255;
        clampedB *= 255;
        clampedA *= 255;

        for (let color of this.color) {
            color.r = clampedR;
            color.g = clampedG;
            color.b = clampedB;
            color.a = clampedA;
        }
    }

    //NOTE: add rotation
    quadsDrawTL(quads: QuadItem[]) {
        const center = new Point(0, 0);

        console.assert(this.drawing == DRAWING_QUADS, "error OWO");

        for (const quad of quads) {
            //first triange

            this.vertices.push(
                new Vertex(
                    new Point(quad.x, quad.y),
                    this.texture[0],
                    this.color[0]
                )
            );

            this.vertices.push(
                new Vertex(
                    new Point(quad.x + quad.width, quad.y),
                    this.texture[1],
                    this.color[1]
                )
            );

            this.vertices.push(
                new Vertex(
                    new Point(quad.x + quad.width, quad.y + quad.height),
                    this.texture[2],
                    this.color[2]
                )
            );

            //second triangle


            this.vertices.push(
                new Vertex(
                    new Point(quad.x, quad.y),
                    this.texture[0],
                    this.color[0]
                )
            );

            this.vertices.push(
                new Vertex(
                    new Point(quad.x + quad.width, quad.y + quad.height),
                    this.texture[2],
                    this.color[2]
                )
            );

            this.vertices.push(
                new Vertex(
                    new Point(quad.x, quad.y + quad.height),
                    this.texture[3],
                    this.color[3]
                )
            );
        }

    }

    //TODO: make it look gut
    flushVertices(keepVertices: boolean) {
        keepVertices;
        console.log(this.vertices.length);
        const cmd = new CommandRender(null, PRIMTYPE_QUADS, this.vertices.length, this.vertices);

        this.addCmd(cmd);
    }

    quadsEnd() {
        console.assert(this.drawing == DRAWING_QUADS, "Nonoonon");

        this.flushVertices(false);
        this.drawing = 0;
    }

    drawRect(x: number, y: number, w: number, h: number, r: number, corners: number) {
        const numSegments = 8;
        const segmentsAngle = Math.PI / 2 / numSegments;
        const freeform: FreeformItem[] = [];

        for (let i = 0; i < numSegments; i++) {
            const a1 = i * segmentsAngle;
            const a2 = (i + 1) * segmentsAngle;
            const a3 = (i + 2) * segmentsAngle;
            const Ca1 = Math.cos(a1);
            const Ca2 = Math.cos(a2);
            const Ca3 = Math.cos(a3);
            const Sa1 = Math.sin(a1);
            const Sa2 = Math.sin(a2);
            const Sa3 = Math.sin(a3);

            if (corners & CORNER_TL) {
                freeform.push(new FreeformItem(
                    x + r, y + r,
                    x + (1 - Ca1) * r, y + (1 - Sa1) * r,
                    x + (1 - Ca3) * r, y + (1 - Sa3) * r,
                    x + (1 - Ca2) * r, y + (1 - Sa2) * r)
                );
            }

            if (corners & CORNER_TR) {
                freeform.push(
                    new FreeformItem(
                        x + w - r, y + r,
                        x + w - r + Ca1 * r, y + (1 - Sa1) * r,
                        x + w - r + Ca3 * r, y + (1 - Sa3) * r,
                        x + w - r + Ca2 * r, y + (1 - Sa2) * r)
                );
            }

            if (corners & CORNER_BL) {
                freeform.push(
                    new FreeformItem(
                        x + r, y + h - r,
                        x + (1 - Ca1) * r, y + h - r + Sa1 * r,
                        x + (1 - Ca3) * r, y + h - r + Sa3 * r,
                        x + (1 - Ca2) * r, y + h - r + Sa2 * r)
                );
            }

            if (corners & CORNER_BR) {
                freeform.push(
                    new FreeformItem(
                        x + w - r, y + h - r,
                        x + w - r + Ca1 * r, y + h - r + Sa1 * r,
                        x + w - r + Ca3 * r, y + h - r + Sa3 * r,
                        x + w - r + Ca2 * r, y + h - r + Sa2 * r)
                );
            }
        }

        //this.quadsDrawFreeform(freeform);

        const quads: QuadItem[] = [];

        quads.push(new QuadItem(x + r, y + r, w - r * 2, h - r * 2)); // center
        quads.push(new QuadItem(x + r, y, w - r * 2, r)); // top
        quads.push(new QuadItem(x + r, y + h - r, w - r * 2, r)); // bottom
        quads.push(new QuadItem(x, y + r, r, h - r * 2)); // left
        quads.push(new QuadItem(x + w - r, y + r, r, h - r * 2)); // right

        if (!(corners & CORNER_TL)) {
            quads.push(new QuadItem(x, y, r, r));
        }
        if (!(corners & CORNER_TR)) {
            quads.push(new QuadItem(x + w, y, -r, r));
        }
        if (!(corners & CORNER_BL)) {
            quads.push(new QuadItem(x, y + h, r, -r));
        }
        if (!(corners & CORNER_BR)) {
            quads.push(new QuadItem(x + w, y + h, -r, -r));
        }

        //TL - top left btw
        this.quadsDrawTL(quads);

    }

    quadsBegin() {
        console.assert(this.drawing == 0, "You're fucked");

        this.drawing = DRAWING_QUADS;

        this.quadsSetSubset(0, 0, 1, 1);
        this.quadsSetRotation(0);
        this.setColor(1, 1, 1, 1);
    }

    addCmd(cmd: Command) {
        this.commandBuffer.addCommand(cmd);
    }

    clear(r: number, g: number, b: number, forceClearNow: boolean) {
        const commandClear = new CommandClear(new ColorRGBA(r, g, b, 1), forceClearNow);

        this.addCmd(commandClear);
    }
}
