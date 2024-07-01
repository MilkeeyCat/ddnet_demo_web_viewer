import { clampf } from '@/utils/clampf';
import { CommandBuffer } from './CommandBuffer';
import { GraphicsBackend } from './GraphicsBackend';
import {
    Command,
    CommandClear,
    CommandCreateBufferContainer,
    CommandCreateBufferObject,
    CommandIndicesRequiredNumNotify,
    CommandInit,
    CommandRender,
    CommandRenderTileLayer,
    CommandUpdateViewport,
    CommmandTextureCreate,
} from './commands';
import {
    ColorRGBA,
    FreeformItem,
    Point,
    QuadItem,
    TexCoord,
    Vertex,
} from './common';
import { BufferContainerInfo } from './CommandWebGL2CommandProcessorFragment';

const CMD_BUFFER_DATA_BUFFER_SIZE = 1024 * 1024 * 2;
const CMD_BUFFER_CMD_BUFFER_SIZE = 1024 * 256;

const NUM_CMDBUFFERS = 2;

const DRAWING_QUADS = 1;
const DRAWING_LINES = 2;
const DRAWING_TRIANGLES = 3;

export const CORNER_NONE = 0;
export const CORNER_TL = 1;
export const CORNER_TR = 2;
export const CORNER_BL = 4;
export const CORNER_BR = 8;

export const CORNER_T = CORNER_TL | CORNER_TR;
export const CORNER_B = CORNER_BL | CORNER_BR;
export const CORNER_R = CORNER_TR | CORNER_BR;
export const CORNER_L = CORNER_TL | CORNER_BL;

export const CORNER_ALL = CORNER_T | CORNER_B;

export const GRAPHICS_TYPE_UNSIGNED_BYTE = 0x1401;
export const GRAPHICS_TYPE_FLOAT = 0x1406;

/**
 * @param {number} colorComponent
 * @returns {number}
 */
function normalizeColorComponent(colorComponent) {
    return clampf(colorComponent, 0, 1) * 255 + 0.5; // +0.5 to round to nearest
}

export class State {
    constructor() {
        /** @type {Point} */
        this.screenTL = new Point(0, 0);
        /** @type {Point} */
        this.screenBR = new Point(0, 0);
        /** @type {boolean} */
        this.clipEnable = false;
        /** @type {number} */
        this.clipX = 0;
        /** @type {number} */
        this.clipY = 0;
        /** @type {number} */
        this.clipH = 0;
        /** @type {number} */
        this.clipW = 0;
        /** @type {number} */
        this.texture = -1;
        /** @type {number} */
        this.blendMode = CommandBuffer.BLEND_NONE;
        /** @type {number} */
        this.wrapMode = CommandBuffer.WRAP_CLAMP;
    }

    /** @returns {State} */
    clone() {
        const state = new State();

        state.screenTL = this.screenTL.clone();
        state.screenBR = this.screenBR.clone();
        state.clipEnable = this.clipEnable;
        state.clipX = this.clipX;
        state.clipY = this.clipY;
        state.clipH = this.clipH;
        state.clipW = this.clipW;
        state.texture = this.texture;
        state.blendMode = this.blendMode;
        state.wrapMode = this.wrapMode;

        return state;
    }
}

class ImageInfo {
    /**
     * @param {number} width
     * @param {number} height
     * @param {Uint8Array} data
     */
    constructor(
        width,
        height,
        data,
    ) {
        /** @type {number} */
        this.width = width;
        /** @type {number} */
        this.height = height;
        /** @type {Uint8Array} */
        this.data = data;
    }
}

class ColorVertex {
    /**
     * @param {number} index
     * @param {ColorRGBA} color
     */
    constructor(index, color) {
        /** @type {number} */
        this.index = index;
        /** @type {number} */
        this.r = color.r;
        /** @type {number} */
        this.g = color.g;
        /** @type {number} */
        this.b = color.b;
        /** @type {number} */
        this.a = color.a;
    }
}

export class TextureHandle {
    /** @param {number} id */
    constructor(id) {
        /** @type {number} */
        this.id = id
    }

    /** @returns {boolean} */
    isValid() {
        return this.id >= 0;
    }

    /** @returns {boolean} */
    isNullTexture() {
        return this.id == 0;
    }

    invalidate() {
        this.id = -1;
    }
}

class VertexArrayInfo {
    /**
     * @param {number} associatedBufferObjectIndex
     * @param {number} freeIndex
     */
    constructor(
        associatedBufferObjectIndex,
        freeIndex,
    ) {
        /** @type {number} */
        this.associatedBufferObjectIndex = associatedBufferObjectIndex;
        /** @type {number} */
        this.freeIndex = freeIndex;
    }
}

export class Graphics {
    static TEXFORMAT_INVALID = 0;
    static TEXFORMAT_RGBA = 1;

    static TEXFLAG_NOMIPMAPS = 1;
    static TEXFLAG_TO_3D_TEXTURE = 1 << 3;
    static TEXFLAG_TO_2D_ARRAY_TEXTURE = 1 << 4;
    static TEXFLAG_NO_2D_TEXTURE = 1 << 5;

    static PRIMTYPE_INVALID = 0;
    static PRIMTYPE_LINES = 1;
    static PRIMTYPE_QUADS = 2;
    static PRIMTYPE_TRIANGLES = 3;

    constructor(ctx: WebGL2RenderingContext) {
        /** @type {number} */
        this.drawing = 0;
        /** @type {number} */
        this.numVertices = 0;
        /** @type {number} */
        this.rotation = 0;
        /** @type{[TexCoord, TexCoord, TexCoord, TexCoord]} */
        this.texture = new Array(4)
            .fill(null)
            .map(() => new TexCoord(0, 0));
        /** @type {State} */
        this.state = new State();
        /** @type {number[]} */
        this.textureIndices = new Array(CommandBuffer.MAX_TEXTURES)
            .fill(null)
            .map((_, i) => i + 1);
        /** @type {number[]} */
        this.bufferObjectIndices = [];
        /** @type {VertexArrayInfo[]} */
        this.vertexArrayInfo = [];
        /** @type {number} */
        this.firstFreeTexture = 0;
        /** @type {number} */
        this.firstFreeBufferObjectIndex = -1;
        /** @type {number} */
        this.firstFreeVertexArrayInfo = -1;
        /** @type {[ColorRGBA, ColorRGBA, ColorRGBA, ColorRGBA]} */
        this.color = new Array(4)
            .fill(null)
            .map(() => new ColorRGBA(0, 0, 0, 0));

        /** @type {Vertex[]} */
        this.vertices = new Array(CommandBuffer.MAX_VERTICES)
            .fill(null)
            .map(
                () =>
                    new Vertex(
                        new Point(0, 0),
                        new TexCoord(0, 0),
                        new ColorRGBA(0, 0, 0, 0),
                    ),
            );
        /** @type {number} */
        this.currentCommandBuffer = 0;
        /** @type {CommandBuffer[]} */
        this.commandBuffers = new Array(NUM_CMDBUFFERS)
            .fill(null)
            .map(() => new CommandBuffer());
        /** @type {CommandBuffer} */
        this.commandBuffer = this.commandBuffers[0];
        /** @type {GraphicsBackend} */
        this.backend = new GraphicsBackend(ctx);

        const canv = document.createElement('canvas');
        /** @type {CanvasRenderingContext2D} */
        this.ctx2d = canv.getContext('2d');
    }

    adjustViewport() {
        if (this.screenHeight > (4 * this.screenWidth) / 5) {
            this.screenHeight = (4 * this.screenWidth) / 5;
        }
    }

    /**
     * @param {number} w
     * @param {number} h
     */
    gotResized(w, h) {
        /** @type {number} */
        this.screenWidth = w;
        /** @type {number} */
        this.screenHeight = h;

        this.adjustViewport();
        this.updateViewport(0, 0, this.screenWidth, this.screenHeight);
        this.kickCommandBuffer();
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    updateViewport(x, y, w, h) {
        const command = new CommandUpdateViewport(x, y, w, h);

        this.addCmd(command);
    }

    /** @returns {number} */
    screenAspect() {
        return this.screenWidth / this.screenHeight;
    }

    async kickCommandBuffer() {
        await this.backend.runBuffer(this.commandBuffer);

        //TODO: warnings!?!??

        this.currentCommandBuffer ^= 1;
        this.commandBuffer = this.commandBuffers[this.currentCommandBuffer]!;
        this.commandBuffer.reset();
    }

    /**
     * @param {number} width
     * @param {number} height
     */
    async init(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.gotResized(this.screenWidth, this.screenHeight);

        const cmd = new CommandInit();
        this.addCmd(cmd);

        await this.kickCommandBuffer();
    }

    swap() {
        //some magic shit...

        this.kickCommandBuffer();
    }

    /**
     * @param {number} tlX
     * @param {number} tlY
     * @param {number} brX
     * @param {number} brY
     */
    mapScreen(tlX, tlY, brX, brY) {
        this.state.screenTL.x = tlX;
        this.state.screenTL.y = tlY;
        this.state.screenBR.x = brX;
        this.state.screenBR.y = brY;
    }

    /** @returns {[number, number, number, number]} */
    getScreen() {
        return [
            this.state.screenTL.x,
            this.state.screenTL.y,
            this.state.screenBR.x,
            this.state.screenBR.y,
        ];
    }

    /**
     * @param {number} tlU
     * @param {number} tlV
     * @param {number} brU
     * @param {number} brV
     */
    quadsSetSubset(tlU, tlV, brU, brV) {
        this.texture[0].u = tlU;
        this.texture[1].u = brU;
        this.texture[0].v = tlV;
        this.texture[1].v = tlV;

        this.texture[2].u = brU;
        this.texture[3].u = tlU;
        this.texture[2].v = brV;
        this.texture[3].v = brV;
    }

    /** @param {number} angle */
    quadsSetRotation(angle) {
        this.rotation = angle;
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    setColor(r, g, b, a) {
        let clampedR = clampf(r, 0, 1);
        let clampedG = clampf(g, 0, 1);
        let clampedB = clampf(b, 0, 1);
        let clampedA = clampf(a, 0, 1);

        clampedR *= 255;
        clampedG *= 255;
        clampedB *= 255;
        clampedA *= 255;

        for (const color of this.color) {
            color.r = clampedR;
            color.g = clampedG;
            color.b = clampedB;
            color.a = clampedA;
        }
    }

    /** @param {ColorVertex[]} data */
    setColorVertex(data) {
        for (const vertex of data) {
            const color = this.color[vertex.index];
            color.r = normalizeColorComponent(vertex.r);
            color.g = normalizeColorComponent(vertex.g);
            color.b = normalizeColorComponent(vertex.b);
            color.a = normalizeColorComponent(vertex.a);
        }
    }

    /**
     * @param {ColorRGBA} colorTopLeft
     * @param {ColorRGBA} colorTopRight
     * @param {ColorRGBA} colorBottomLeft
     * @param {ColorRGBA} colorBottomRight
     */
    setColor4(
        colorTopLeft,
        colorTopRight,
        colorBottomLeft,
        colorBottomRight,
    ) {
        this.setColorVertex([
            new ColorVertex(0, colorTopLeft),
            new ColorVertex(1, colorTopRight),
            new ColorVertex(2, colorBottomLeft),
            new ColorVertex(3, colorBottomRight),
        ]);
    }

    /** @param {ColorRGBA} color */
    setColorC(color) {
        this.setColor(color.r, color.g, color.b, color.a);
    }

    /**
     * @param {Vertex} vertex
     * @param {number} colorIndex
     */
    setVertexColor(vertex, colorIndex) {
        vertex.color = this.color[colorIndex].clone();
    }

    /**
     * @param {Point} rCenter
     * @param {number} i
     * @param {number} numPoints
     */
    rotate(rCenter, i, numPoints) {
        const c = Math.cos(this.rotation);
        const s = Math.sin(this.rotation);
        let x = 0,
            y = 0;

        for (let j = i; j < i + numPoints; j++) {
            x = this.vertices[j].pos.x - rCenter.x;
            y = this.vertices[j].pos.y - rCenter.y;

            this.vertices[j].pos.x = x * c - y * s + rCenter.x;
            this.vertices[j].pos.y = x * s + y * c + rCenter.y;
        }
    }

    //NOTE: add rotation
    /** @param {QuadItem[]} quads */
    quadsDrawTL(quads) {
        const center = new Point(0, 0);

        if (this.drawing !== DRAWING_QUADS) {
            throw new Error('im out');
        }

        for (let i = 0; i < quads.length; i++) {
            this.vertices[this.numVertices + 4 * i].pos.x = quads[i].x;
            this.vertices[this.numVertices + 4 * i].pos.y = quads[i].y;
            this.vertices[this.numVertices + 4 * i].tex = this.texture[0];
            this.setVertexColor(this.vertices[this.numVertices + 4 * i], 0);

            this.vertices[this.numVertices + 4 * i + 1].pos.x =
                quads[i].x + quads[i].width;
            this.vertices[this.numVertices + 4 * i + 1].pos.y = quads[i].y;
            this.vertices[this.numVertices + 4 * i + 1].tex = this.texture[1];
            this.setVertexColor(
                this.vertices[this.numVertices + 4 * i + 1],
                1,
            );

            this.vertices[this.numVertices + 4 * i + 2].pos.x =
                quads[i]!.x + quads[i].width;
            this.vertices[this.numVertices + 4 * i + 2].pos.y =
                quads[i]!.y + quads[i].height;
            this.vertices[this.numVertices + 4 * i + 2].tex = this.texture[2];
            this.setVertexColor(
                this.vertices[this.numVertices + 4 * i + 2],
                2,
            );

            this.vertices[this.numVertices + 4 * i + 3].pos.x = quads[i].x;
            this.vertices[this.numVertices + 4 * i + 3].pos.y =
                quads[i].y + quads[i].height;
            this.vertices[this.numVertices + 4 * i + 3].tex = this.texture[3];
            this.setVertexColor(
                this.vertices[this.numVertices + 4 * i + 3],
                3,
            );

            if (this.rotation != 0) {
                center.x = quads[i].x + quads[i].width / 2;
                center.y = quads[i].y + quads[i].height / 2;

                this.rotate(center, this.numVertices + 4 * i, 4);
            }
        }

        this.addVertices(4 * quads.length);
    }

    //TODO: make it look gut
    /** @param {boolean} [keepVertices = false] */
    flushVertices(keepVertices = false) {
        const cmd = new CommandRender(
            this.state.clone(),
            CommandBuffer.PRIMTYPE_QUADS,
            this.numVertices / 4,
            this.vertices.map((vertex) => vertex.clone()),
        );

        if (!keepVertices) {
            this.numVertices = 0;
        }

        this.addCmd(cmd);
        this.commandBuffer.addRenderCalls(1);
    }

    quadsEnd() {
        if (this.drawing != DRAWING_QUADS) {
            throw new Error('AAAAAAAAAAAAAAAAAAa');
        }

        this.flushVertices();
        this.drawing = 0;
    }

    /** @param {FreeformItem[]} freeform */
    quadsDrawFreeform(freeform) {
        if (
            this.drawing != DRAWING_QUADS &&
            this.drawing != DRAWING_TRIANGLES
        ) {
            throw new Error('You fucking buffoon, call begin first');
        }

        if (this.drawing === DRAWING_TRIANGLES) {
            for (let i = 0; i < freeform.length; i++) {
                this.vertices[this.numVertices + 6 * i].pos.x =
                    freeform[i].x0;
                this.vertices[this.numVertices + 6 * i].pos.y =
                    freeform[i].y0;
                this.vertices[this.numVertices + 6 * i].tex = this.texture[0];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i],
                    0,
                );

                this.vertices[this.numVertices + 6 * i + 1].pos.x =
                    freeform[i].x1;
                this.vertices[this.numVertices + 6 * i + 1].pos.y =
                    freeform[i].y1;
                this.vertices[this.numVertices + 6 * i + 1].tex =
                    this.texture[1];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 1],
                    1,
                );

                this.vertices[this.numVertices + 6 * i + 2].pos.x =
                    freeform[i].x3;
                this.vertices[this.numVertices + 6 * i + 2].pos.y =
                    freeform[i].y3;
                this.vertices[this.numVertices + 6 * i + 2].tex =
                    this.texture[3];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 2],
                    3,
                );

                this.vertices[this.numVertices + 6 * i + 3].pos.x =
                    freeform[i].x0;
                this.vertices[this.numVertices + 6 * i + 3].pos.y =
                    freeform[i].y0;
                this.vertices[this.numVertices + 6 * i + 3].tex =
                    this.texture[0];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 3],
                    0,
                );

                this.vertices[this.numVertices + 6 * i + 4].pos.x =
                    freeform[i].x3;
                this.vertices[this.numVertices + 6 * i + 4].pos.y =
                    freeform[i].y3;
                this.vertices[this.numVertices + 6 * i + 4].tex =
                    this.texture[3];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 4],
                    3,
                );

                this.vertices[this.numVertices + 6 * i + 5].pos.x =
                    freeform[i].x2;
                this.vertices[this.numVertices + 6 * i + 5].pos.y =
                    freeform[i].y2;
                this.vertices[this.numVertices + 6 * i + 5].tex =
                    this.texture[2];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 5],
                    2,
                );
            }

            this.addVertices(3 * 2 * freeform.length);
        } else {
            for (let i = 0; i < freeform.length; i++) {
                this.vertices[this.numVertices + 4 * i].pos.x =
                    freeform[i].x0;
                this.vertices[this.numVertices + 4 * i].pos.y =
                    freeform[i].y0;
                this.vertices[this.numVertices + 4 * i].tex = this.texture[0];
                this.setVertexColor(
                    this.vertices[this.numVertices + 4 * i],
                    0,
                );

                this.vertices[this.numVertices + 4 * i + 1].pos.x =
                    freeform[i].x1;
                this.vertices[this.numVertices + 4 * i + 1].pos.y =
                    freeform[i].y1;
                this.vertices[this.numVertices + 4 * i + 1].tex =
                    this.texture[1];
                this.setVertexColor(
                    this.vertices[this.numVertices + 4 * i + 1],
                    1,
                );

                this.vertices[this.numVertices + 4 * i + 2].pos.x =
                    freeform[i].x3;
                this.vertices[this.numVertices + 4 * i + 2].pos.y =
                    freeform[i].y3;
                this.vertices[this.numVertices + 4 * i + 2].tex =
                    this.texture[3];
                this.setVertexColor(
                    this.vertices[this.numVertices + 4 * i + 2],
                    3,
                );

                this.vertices[this.numVertices + 4 * i + 3].pos.x =
                    freeform[i].x2;
                this.vertices[this.numVertices + 4 * i + 3].pos.y =
                    freeform[i].y2;
                this.vertices[this.numVertices + 4 * i + 3].tex =
                    this.texture[2];
                this.setVertexColor(
                    this.vertices[this.numVertices + 4 * i + 3],
                    2,
                );
            }

            this.addVertices(4 * freeform.length);
        }
    }

    /** @param {number} count */
    addVertices(count) {
        this.numVertices += count;
        if (this.numVertices + count >= CommandBuffer.MAX_VERTICES) {
            this.flushVertices();
        }
    }

    textureClear() {
        this.textureSet(new TextureHandle(-1));
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {ColorRGBA} color
     * @param {number} corners
     * @param {number} rounding
     */
    drawRect(
        x,
        y,
        w,
        h,
        color,
        corners,
        rounding,
    ) {
        this.textureClear();
        this.quadsBegin();
        this.setColorC(color);
        this.drawRectExt(x, y, w, h, rounding, corners);
        this.quadsEnd();
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} r
     * @param {number} corners
     */
    drawRectExt(
        x,
        y,
        w,
        h,
        r,
        corners,
    ) {
        const numSegments = 8;
        const segmentsAngle = Math.PI / 2 / numSegments;
        /** @type {FreeformItem[]} */
        const freeform = [];

        for (let i = 0; i < numSegments; i += 2) {
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
                freeform.push(
                    new FreeformItem(
                        x + r,
                        y + r,
                        x + (1 - Ca1) * r,
                        y + (1 - Sa1) * r,
                        x + (1 - Ca3) * r,
                        y + (1 - Sa3) * r,
                        x + (1 - Ca2) * r,
                        y + (1 - Sa2) * r,
                    ),
                );
            }

            if (corners & CORNER_TR) {
                freeform.push(
                    new FreeformItem(
                        x + w - r,
                        y + r,
                        x + w - r + Ca1 * r,
                        y + (1 - Sa1) * r,
                        x + w - r + Ca3 * r,
                        y + (1 - Sa3) * r,
                        x + w - r + Ca2 * r,
                        y + (1 - Sa2) * r,
                    ),
                );
            }

            if (corners & CORNER_BL) {
                freeform.push(
                    new FreeformItem(
                        x + r,
                        y + h - r,
                        x + (1 - Ca1) * r,
                        y + h - r + Sa1 * r,
                        x + (1 - Ca3) * r,
                        y + h - r + Sa3 * r,
                        x + (1 - Ca2) * r,
                        y + h - r + Sa2 * r,
                    ),
                );
            }

            if (corners & CORNER_BR) {
                freeform.push(
                    new FreeformItem(
                        x + w - r,
                        y + h - r,
                        x + w - r + Ca1 * r,
                        y + h - r + Sa1 * r,
                        x + w - r + Ca3 * r,
                        y + h - r + Sa3 * r,
                        x + w - r + Ca2 * r,
                        y + h - r + Sa2 * r,
                    ),
                );
            }
        }

        this.quadsDrawFreeform(freeform);

        /** @type {QuadItem[]} */
        const quads = [];

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

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {ColorRGBA} colorTopLeft
     * @param {ColorRGBA} colorTopRight
     * @param {ColorRGBA} colorBottomLeft
     * @param {ColorRGBA} colorBottomRight
     * @param {number} corners
     * @param {number} rounding
     */
    drawRect4(
        x,
        y,
        w,
        h,
        colorTopLeft,
        colorTopRight,
        colorBottomLeft,
        colorBottomRight,
        corners,
        rounding,
    ) {
        this.quadsBegin();
        this.drawRectExt4(
            x,
            y,
            w,
            h,
            colorTopLeft,
            colorTopRight,
            colorBottomLeft,
            colorBottomRight,
            rounding,
            corners,
        );
        this.quadsEnd();
    }

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {ColorRGBA} colorTopLeft
     * @param {ColorRGBA} colorTopRight
     * @param {ColorRGBA} colorBottomLeft
     * @param {ColorRGBA} colorBottomRight
     * @param {number} r
     * @param {number} corners
     */
    drawRectExt4(
        x,
        y,
        w,
        h,
        colorTopLeft,
        colorTopRight,
        colorBottomLeft,
        colorBottomRight,
        r,
        corners,
    ) {
        if (corners == 0 || r == 0) {
            this.setColor4(
                colorTopLeft,
                colorTopRight,
                colorBottomLeft,
                colorBottomRight,
            );
            this.quadsDrawTL([new QuadItem(x, y, w, h)]);
            return;
        }

        const numSegments = 8;
        const segmentsAngle = Math.PI / 2 / numSegments;
        for (let i = 0; i < numSegments; i += 2) {
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
                this.setColorC(colorTopLeft);
                const itemF = new FreeformItem(
                    x + r,
                    y + r,
                    x + (1 - Ca1) * r,
                    y + (1 - Sa1) * r,
                    x + (1 - Ca3) * r,
                    y + (1 - Sa3) * r,
                    x + (1 - Ca2) * r,
                    y + (1 - Sa2) * r,
                );
                this.quadsDrawFreeform([itemF]);
            }

            if (corners & CORNER_TR) {
                this.setColorC(colorTopRight);
                const itemF = new FreeformItem(
                    x + w - r,
                    y + r,
                    x + w - r + Ca1 * r,
                    y + (1 - Sa1) * r,
                    x + w - r + Ca3 * r,
                    y + (1 - Sa3) * r,
                    x + w - r + Ca2 * r,
                    y + (1 - Sa2) * r,
                );
                this.quadsDrawFreeform([itemF]);
            }

            if (corners & CORNER_BL) {
                this.setColorC(colorBottomLeft);
                const itemF = new FreeformItem(
                    x + r,
                    y + h - r,
                    x + (1 - Ca1) * r,
                    y + h - r + Sa1 * r,
                    x + (1 - Ca3) * r,
                    y + h - r + Sa3 * r,
                    x + (1 - Ca2) * r,
                    y + h - r + Sa2 * r,
                );
                this.quadsDrawFreeform([itemF]);
            }

            if (corners & CORNER_BR) {
                this.setColorC(colorBottomRight);
                const itemF = new FreeformItem(
                    x + w - r,
                    y + h - r,
                    x + w - r + Ca1 * r,
                    y + h - r + Sa1 * r,
                    x + w - r + Ca3 * r,
                    y + h - r + Sa3 * r,
                    x + w - r + Ca2 * r,
                    y + h - r + Sa2 * r,
                );
                this.quadsDrawFreeform([itemF]);
            }
        }

        this.setColor4(
            colorTopLeft,
            colorTopRight,
            colorBottomLeft,
            colorBottomRight,
        );
        let itemQ = new QuadItem(x + r, y + r, w - r * 2, h - r * 2); // center
        this.quadsDrawTL([itemQ]);

        this.setColor4(
            colorTopLeft,
            colorTopRight,
            colorBottomLeft,
            colorBottomRight,
        );
        itemQ = new QuadItem(x + r, y, w - r * 2, r); // top
        this.quadsDrawTL([itemQ]);

        this.setColor4(
            colorTopLeft,
            colorTopRight,
            colorBottomLeft,
            colorBottomRight,
        );
        itemQ = new QuadItem(x + r, y + h - r, w - r * 2, r); // bottom
        this.quadsDrawTL([itemQ]);

        this.setColor4(
            colorTopLeft,
            colorTopRight,
            colorBottomLeft,
            colorBottomRight,
        );
        itemQ = new QuadItem(x, y + r, r, h - r * 2); // left
        this.quadsDrawTL([itemQ]);

        this.setColor4(
            colorTopLeft,
            colorTopRight,
            colorBottomLeft,
            colorBottomRight,
        );
        itemQ = new QuadItem(x + w - r, y + r, r, h - r * 2); // right
        this.quadsDrawTL([itemQ]);

        if (!(corners & CORNER_TL)) {
            this.setColorC(colorTopLeft);
            itemQ = new QuadItem(x, y, r, r);
            this.quadsDrawTL([itemQ]);
        }

        if (!(corners & CORNER_TR)) {
            this.setColorC(colorTopRight);
            itemQ = new QuadItem(x + w, y, -r, r);
            this.quadsDrawTL([itemQ]);
        }

        if (!(corners & CORNER_BL)) {
            this.setColorC(colorBottomLeft);
            itemQ = new QuadItem(x, y + h, r, -r);
            this.quadsDrawTL([itemQ]);
        }

        if (!(corners & CORNER_BR)) {
            this.setColorC(colorBottomRight);
            itemQ = new QuadItem(x + w, y + h, -r, -r);
            this.quadsDrawTL([itemQ]);
        }
    }

    /**
     * @param {number} centerX
     * @param {number} centerY
     * @param {number} radius
     * @param {number} segments
     */
    drawCircle(
        centerX,
        centerY,
        radius,
        segments,
    ) {
        /** @type {FreeformItem[]} */
        const items = [];
        const segmentsAngle = (2 * Math.PI) / segments;

        for (let i = 0; i < segments; i += 2) {
            const a1 = i * segmentsAngle;
            const a2 = (i + 1) * segmentsAngle;
            const a3 = (i + 2) * segmentsAngle;
            items.push(
                new FreeformItem(
                    centerX,
                    centerY,
                    centerX + Math.cos(a1) * radius,
                    centerY + Math.sin(a1) * radius,
                    centerX + Math.cos(a3) * radius,
                    centerY + Math.sin(a3) * radius,
                    centerX + Math.cos(a2) * radius,
                    centerY + Math.sin(a2) * radius,
                ),
            );
        }

        this.quadsDrawFreeform(items);
    }

    quadsBegin() {
        if (this.drawing != 0) {
            throw new Error('BAD!');
        }

        this.drawing = DRAWING_QUADS;

        this.quadsSetSubset(0, 0, 1, 1);
        this.quadsSetRotation(0);
        this.setColor(1, 1, 1, 1);
    }

    /** @param {Command} cmd */
    addCmd(cmd) {
        this.commandBuffer.addCommand(cmd);
    }

    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {boolean} forceClearNow
     */
    clear(r, g, b, forceClearNow) {
        const commandClear = new CommandClear(
            new ColorRGBA(r, g, b, 1),
            forceClearNow,
        );

        this.addCmd(commandClear);
    }

    /**
     * @param {string} src
     * @returns {Promise<ImageInfo>}
     */
    loadImage(src) {
        const image = new Image();
        image.src = src;

        return new Promise((res, rej) => {
            image.addEventListener('load', () => {
                this.ctx2d.drawImage(image, 0, 0);
                res(
                    new ImageInfo(
                        image.width,
                        image.height,
                        new Uint8Array(
                            this.ctx2d.getImageData(
                                0,
                                0,
                                image.width,
                                image.height,
                            ).data,
                        ),
                    ),
                );
            });

            image.addEventListener('error', () => {
                rej(new Error('failed to load image'));
            });
        });
    }

    /** @returns {TextureHandle} */
    findFreeTextureIndex() {
        const size = this.textureIndices.length;
        if (this.firstFreeTexture === size) {
            throw new Error(
                'holy shit, how many textures are you gonna make???',
            );
            //TODO: resize this.textureIndices array
        }
        const tex = this.firstFreeTexture;
        this.firstFreeTexture = this.textureIndices[tex];
        this.textureIndices[tex] = -1;

        return new TextureHandle(tex);
    }

    /**
     * @param {number} textureId
     * @param {number} width
     * @param {number} height
     * @param {Uint8Array} data
     * @returns {CommmandTextureCreate}
     */
    loadTextureCreateCommand(
        textureId,
        width,
        height,
        data,
    ) {
        const cmd = new CommmandTextureCreate(textureId, width, height, data);

        //FIXME: do i need flags here??

        return cmd;
    }

    /**
     * @param {number} width
     * @param {number} height
     * @param {Uint8Array} data
     * @returns {TextureHandle}
     */
    loadTexture(
        width,
        height,
        data,
    ) {
        const textureHandle = this.findFreeTextureIndex();
        const cmd = this.loadTextureCreateCommand(
            textureHandle.id,
            width,
            height,
            data,
        );

        this.addCmd(cmd);

        return textureHandle;
    }

    /** @param {TextureHandle} textureId */
    textureSet(textureId) {
        if (this.drawing !== 0) {
            throw new Error('called graphics.textureSet within begin');
        }
        if (textureId.isValid() && this.textureIndices[textureId.id] !== -1) {
            throw new Error(
                'Texture handle was not invalid, but also did not correlate to an existing texture.',
            );
        }

        this.state.texture = textureId.id;
    }

    /**
     * @param {ArrayBufferLike} data
     * @returns {number}
     */
    createBufferObject(data) {
        /** @type {number} */
        let index;

        if (this.firstFreeBufferObjectIndex === -1) {
            index = this.bufferObjectIndices.length;
            this.bufferObjectIndices.push(index);
        } else {
            index = this.firstFreeBufferObjectIndex;
            this.firstFreeBufferObjectIndex = this.bufferObjectIndices[index];
            this.bufferObjectIndices[index] = index;
        }

        const cmd = new CommandCreateBufferObject(index, data);
        this.addCmd(cmd);

        return index;
    }

    /**
     * @param {BufferContainerInfo} containerInfo
     * @returns {number}
     */
    createBufferContainer(containerInfo) {
        /** @type {number} */
        let index;

        if (this.firstFreeVertexArrayInfo) {
            index = this.vertexArrayInfo.length;
            this.vertexArrayInfo.push(new VertexArrayInfo(-1, 0));
        } else {
            index = this.firstFreeVertexArrayInfo;
            this.firstFreeVertexArrayInfo =
                this.vertexArrayInfo[index].freeIndex;
            this.vertexArrayInfo[index].freeIndex = index;
        }

        const cmd = new CommandCreateBufferContainer(
            index,
            containerInfo.stride,
            containerInfo.vertBufferBindingIndex,
            containerInfo.attributes,
        );

        this.vertexArrayInfo[index].associatedBufferObjectIndex =
            containerInfo.vertBufferBindingIndex;
        this.addCmd(cmd);

        return index;
    }

    /**
     * @param {number} bufferContainerIndex
     * @param {ColorRGBA} color
     * @param {number[]} offsets
     * @param {number[]} indicedVertexDrawNum
     * @param {number} numIndicesOffset
     */
    renderTileLayer(
        bufferContainerIndex,
        color,
        offsets,
        indicedVertexDrawNum,
        numIndicesOffset,
    ) {
        const cmd = new CommandRenderTileLayer(
            this.state.clone(),
            color,
            offsets,
            indicedVertexDrawNum,
            numIndicesOffset,
            bufferContainerIndex,
        );

        this.addCmd(cmd);
        this.commandBuffer.addRenderCalls(numIndicesOffset);
    }

    /** @param {number} requiredIndicesCount */
    indicesNumRequiredNotify(requiredIndicesCount) {
        const cmd = new CommandIndicesRequiredNumNotify(requiredIndicesCount);

        this.addCmd(cmd);
    }
}
