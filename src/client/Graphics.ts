import { clampf } from '@/utils/clampf';
import { CommandBuffer } from './CommandBuffer';
import { GraphicsBackend } from './GraphicsBackend';
import {
    Command,
    CommandClear,
    CommandCreateBufferContainer,
    CommandCreateBufferObject,
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

function normalizeColorComponent(colorComponent: number): number {
    return clampf(colorComponent, 0, 1) * 255 + 0.5; // +0.5 to round to nearest
}

export class State {
    blendMode: number;
    wrapMode: number;
    texture: number;
    screenTL: Point;
    screenBR: Point;

    // clip
    clipEnable: boolean;
    clipX: number;
    clipY: number;
    clipW: number;
    clipH: number;

    constructor() {
        this.screenTL = new Point(0, 0);
        this.screenBR = new Point(0, 0);
        this.clipEnable = false;
        this.clipX = 0;
        this.clipY = 0;
        this.clipH = 0;
        this.clipW = 0;
        this.texture = -1;
        this.blendMode = CommandBuffer.BLEND_NONE;
        this.wrapMode = CommandBuffer.WRAP_CLAMP;
    }

    clone(): State {
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
    constructor(
        public width: number,
        public height: number,
        public data: Uint8Array,
    ) {}
}

class ColorVertex {
    index: number;
    r: number;
    g: number;
    b: number;
    a: number;

    constructor(index: number, color: ColorRGBA) {
        this.index = index;
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;
        this.a = color.a;
    }
}

export class TextureHandle {
    constructor(public id: number) {}

    isValid(): boolean {
        return this.id >= 0;
    }

    isNullTexture(): boolean {
        return this.id == 0;
    }

    invalidate(): void {
        this.id = -1;
    }
}

class VertexArrayInfo {
    constructor(
        public associatedBufferObjectIndex: number,
        public freeIndex: number,
    ) {}
}

export class Graphics {
    screenWidth: number;
    screenHeight: number;

    backend: GraphicsBackend;
    commandBuffers: CommandBuffer[];
    commandBuffer: CommandBuffer;
    currentCommandBuffer: number;

    drawing: number;
    color: [ColorRGBA, ColorRGBA, ColorRGBA, ColorRGBA];
    texture: [TexCoord, TexCoord, TexCoord, TexCoord];
    vertices: Vertex[];
    numVertices: number;
    rotation: number;
    state: State;
    textureIndices: number[];
    bufferObjectIndices: number[];
    vertexArrayInfo: VertexArrayInfo[];
    firstFreeTexture: number;
    firstFreeVertexArrayInfo: number;
    firstFreeBufferObjectIndex: number;

    ctx2d: CanvasRenderingContext2D;

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
        this.drawing = 0;
        this.numVertices = 0;
        this.rotation = 0;
        this.texture = new Array(4)
            .fill(null)
            .map(() => new TexCoord(0, 0)) as [
            TexCoord,
            TexCoord,
            TexCoord,
            TexCoord,
        ];
        this.state = new State();
        this.textureIndices = new Array(CommandBuffer.MAX_TEXTURES)
            .fill(null)
            .map((_, i) => i + 1);
        this.bufferObjectIndices = [];
        this.vertexArrayInfo = [];
        this.firstFreeTexture = 0;
        this.firstFreeBufferObjectIndex = -1;
        this.firstFreeVertexArrayInfo = -1;
        this.color = new Array(4)
            .fill(null)
            .map(() => new ColorRGBA(0, 0, 0, 0)) as [
            ColorRGBA,
            ColorRGBA,
            ColorRGBA,
            ColorRGBA,
        ];
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

        this.currentCommandBuffer = 0;
        this.commandBuffers = new Array(NUM_CMDBUFFERS)
            .fill(null)
            .map(() => new CommandBuffer());
        this.commandBuffer = this.commandBuffers[0]!;
        this.backend = new GraphicsBackend(ctx);

        const canv = document.createElement('canvas');
        this.ctx2d = canv.getContext('2d')!;
    }

    adjustViewport() {
        if (this.screenHeight > (4 * this.screenWidth) / 5) {
            this.screenHeight = (4 * this.screenWidth) / 5;
        }
    }

    gotResized(w: number, h: number): void {
        this.screenWidth = w;
        this.screenHeight = h;

        this.adjustViewport();
        this.updateViewport(0, 0, this.screenWidth, this.screenHeight);
        this.kickCommandBuffer();
    }

    updateViewport(x: number, y: number, w: number, h: number): void {
        const command = new CommandUpdateViewport(x, y, w, h);

        this.addCmd(command);
    }

    screenAspect(): number {
        return this.screenWidth / this.screenHeight;
    }

    async kickCommandBuffer(): Promise<void> {
        await this.backend.runBuffer(this.commandBuffer);

        //TODO: warnings!?!??

        this.currentCommandBuffer ^= 1;
        this.commandBuffer = this.commandBuffers[this.currentCommandBuffer]!;
        this.commandBuffer.reset();
    }

    async init(width: number, height: number) {
        this.screenWidth = width;
        this.screenHeight = height;
        this.gotResized(this.screenWidth, this.screenHeight);

        const cmd = new CommandInit();
        this.addCmd(cmd);

        await this.kickCommandBuffer();
    }

    swap(): void {
        //some magic shit...

        this.kickCommandBuffer();
    }

    mapScreen(tlX: number, tlY: number, brX: number, brY: number): void {
        this.state.screenTL.x = tlX;
        this.state.screenTL.y = tlY;
        this.state.screenBR.x = brX;
        this.state.screenBR.y = brY;
    }

    getScreen(): [number, number, number, number] {
        return [
            this.state.screenTL.x,
            this.state.screenTL.y,
            this.state.screenBR.x,
            this.state.screenBR.y,
        ];
    }

    quadsSetSubset(tlU: number, tlV: number, brU: number, brV: number): void {
        this.texture[0].u = tlU;
        this.texture[1].u = brU;
        this.texture[0].v = tlV;
        this.texture[1].v = tlV;

        this.texture[2].u = brU;
        this.texture[3].u = tlU;
        this.texture[2].v = brV;
        this.texture[3].v = brV;
    }

    quadsSetRotation(angle: number): void {
        this.rotation = angle;
    }

    setColor(r: number, g: number, b: number, a: number): void {
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

    setColorVertex(data: ColorVertex[]): void {
        for (const vertex of data) {
            const color = this.color[vertex.index]!;
            color.r = normalizeColorComponent(vertex.r);
            color.g = normalizeColorComponent(vertex.g);
            color.b = normalizeColorComponent(vertex.b);
            color.a = normalizeColorComponent(vertex.a);
        }
    }

    setColor4(
        colorTopLeft: ColorRGBA,
        colorTopRight: ColorRGBA,
        colorBottomLeft: ColorRGBA,
        colorBottomRight: ColorRGBA,
    ): void {
        this.setColorVertex([
            new ColorVertex(0, colorTopLeft),
            new ColorVertex(1, colorTopRight),
            new ColorVertex(2, colorBottomLeft),
            new ColorVertex(3, colorBottomRight),
        ]);
    }

    setColorC(color: ColorRGBA): void {
        this.setColor(color.r, color.g, color.b, color.a);
    }

    setVertexColor(vertex: Vertex, colorIndex: number): void {
        vertex.color = this.color[colorIndex]!.clone();
    }

    rotate(rCenter: Point, i: number, numPoints: number): void {
        const c = Math.cos(this.rotation);
        const s = Math.sin(this.rotation);
        let x = 0,
            y = 0;

        for (let j = i; j < i + numPoints; j++) {
            x = this.vertices[j]!.pos.x - rCenter.x;
            y = this.vertices[j]!.pos.y - rCenter.y;

            this.vertices[j]!.pos.x = x * c - y * s + rCenter.x;
            this.vertices[j]!.pos.y = x * s + y * c + rCenter.y;
        }
    }

    //NOTE: add rotation
    quadsDrawTL(quads: QuadItem[]): void {
        const center = new Point(0, 0);

        if (this.drawing !== DRAWING_QUADS) {
            throw new Error('im out');
        }

        for (let i = 0; i < quads.length; i++) {
            this.vertices[this.numVertices + 4 * i]!.pos.x = quads[i]!.x;
            this.vertices[this.numVertices + 4 * i]!.pos.y = quads[i]!.y;
            this.vertices[this.numVertices + 4 * i]!.tex = this.texture[0];
            this.setVertexColor(this.vertices[this.numVertices + 4 * i]!, 0);

            this.vertices[this.numVertices + 4 * i + 1]!.pos.x =
                quads[i]!.x + quads[i]!.width;
            this.vertices[this.numVertices + 4 * i + 1]!.pos.y = quads[i]!.y;
            this.vertices[this.numVertices + 4 * i + 1]!.tex = this.texture[1];
            this.setVertexColor(
                this.vertices[this.numVertices + 4 * i + 1]!,
                1,
            );

            this.vertices[this.numVertices + 4 * i + 2]!.pos.x =
                quads[i]!.x + quads[i]!.width;
            this.vertices[this.numVertices + 4 * i + 2]!.pos.y =
                quads[i]!.y + quads[i]!.height;
            this.vertices[this.numVertices + 4 * i + 2]!.tex = this.texture[2];
            this.setVertexColor(
                this.vertices[this.numVertices + 4 * i + 2]!,
                2,
            );

            this.vertices[this.numVertices + 4 * i + 3]!.pos.x = quads[i]!.x;
            this.vertices[this.numVertices + 4 * i + 3]!.pos.y =
                quads[i]!.y + quads[i]!.height;
            this.vertices[this.numVertices + 4 * i + 3]!.tex = this.texture[3];
            this.setVertexColor(
                this.vertices[this.numVertices + 4 * i + 3]!,
                3,
            );

            if (this.rotation != 0) {
                center.x = quads[i]!.x + quads[i]!.width / 2;
                center.y = quads[i]!.y + quads[i]!.height / 2;

                this.rotate(center, this.numVertices + 4 * i, 4);
            }
        }

        this.addVertices(4 * quads.length);
    }

    //TODO: make it look gut
    flushVertices(keepVertices = false): void {
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

    quadsEnd(): void {
        if (this.drawing != DRAWING_QUADS) {
            throw new Error('AAAAAAAAAAAAAAAAAAa');
        }

        this.flushVertices();
        this.drawing = 0;
    }

    quadsDrawFreeform(freeform: FreeformItem[]): void {
        if (
            this.drawing != DRAWING_QUADS &&
            this.drawing != DRAWING_TRIANGLES
        ) {
            throw new Error('You fucking buffoon, call begin first');
        }

        if (this.drawing === DRAWING_TRIANGLES) {
            for (let i = 0; i < freeform.length; i++) {
                this.vertices[this.numVertices + 6 * i]!.pos.x =
                    freeform[i]!.x0;
                this.vertices[this.numVertices + 6 * i]!.pos.y =
                    freeform[i]!.y0;
                this.vertices[this.numVertices + 6 * i]!.tex = this.texture[0];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i]!,
                    0,
                );

                this.vertices[this.numVertices + 6 * i + 1]!.pos.x =
                    freeform[i]!.x1;
                this.vertices[this.numVertices + 6 * i + 1]!.pos.y =
                    freeform[i]!.y1;
                this.vertices[this.numVertices + 6 * i + 1]!.tex =
                    this.texture[1];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 1]!,
                    1,
                );

                this.vertices[this.numVertices + 6 * i + 2]!.pos.x =
                    freeform[i]!.x3;
                this.vertices[this.numVertices + 6 * i + 2]!.pos.y =
                    freeform[i]!.y3;
                this.vertices[this.numVertices + 6 * i + 2]!.tex =
                    this.texture[3];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 2]!,
                    3,
                );

                this.vertices[this.numVertices + 6 * i + 3]!.pos.x =
                    freeform[i]!.x0;
                this.vertices[this.numVertices + 6 * i + 3]!.pos.y =
                    freeform[i]!.y0;
                this.vertices[this.numVertices + 6 * i + 3]!.tex =
                    this.texture[0];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 3]!,
                    0,
                );

                this.vertices[this.numVertices + 6 * i + 4]!.pos.x =
                    freeform[i]!.x3;
                this.vertices[this.numVertices + 6 * i + 4]!.pos.y =
                    freeform[i]!.y3;
                this.vertices[this.numVertices + 6 * i + 4]!.tex =
                    this.texture[3];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 4]!,
                    3,
                );

                this.vertices[this.numVertices + 6 * i + 5]!.pos.x =
                    freeform[i]!.x2;
                this.vertices[this.numVertices + 6 * i + 5]!.pos.y =
                    freeform[i]!.y2;
                this.vertices[this.numVertices + 6 * i + 5]!.tex =
                    this.texture[2];
                this.setVertexColor(
                    this.vertices[this.numVertices + 6 * i + 5]!,
                    2,
                );
            }

            this.addVertices(3 * 2 * freeform.length);
        } else {
            for (let i = 0; i < freeform.length; i++) {
                this.vertices[this.numVertices + 4 * i]!.pos.x =
                    freeform[i]!.x0;
                this.vertices[this.numVertices + 4 * i]!.pos.y =
                    freeform[i]!.y0;
                this.vertices[this.numVertices + 4 * i]!.tex = this.texture[0];
                this.setVertexColor(
                    this.vertices[this.numVertices + 4 * i]!,
                    0,
                );

                this.vertices[this.numVertices + 4 * i + 1]!.pos.x =
                    freeform[i]!.x1;
                this.vertices[this.numVertices + 4 * i + 1]!.pos.y =
                    freeform[i]!.y1;
                this.vertices[this.numVertices + 4 * i + 1]!.tex =
                    this.texture[1];
                this.setVertexColor(
                    this.vertices[this.numVertices + 4 * i + 1]!,
                    1,
                );

                this.vertices[this.numVertices + 4 * i + 2]!.pos.x =
                    freeform[i]!.x3;
                this.vertices[this.numVertices + 4 * i + 2]!.pos.y =
                    freeform[i]!.y3;
                this.vertices[this.numVertices + 4 * i + 2]!.tex =
                    this.texture[3];
                this.setVertexColor(
                    this.vertices[this.numVertices + 4 * i + 2]!,
                    3,
                );

                this.vertices[this.numVertices + 4 * i + 3]!.pos.x =
                    freeform[i]!.x2;
                this.vertices[this.numVertices + 4 * i + 3]!.pos.y =
                    freeform[i]!.y2;
                this.vertices[this.numVertices + 4 * i + 3]!.tex =
                    this.texture[2];
                this.setVertexColor(
                    this.vertices[this.numVertices + 4 * i + 3]!,
                    2,
                );
            }

            this.addVertices(4 * freeform.length);
        }
    }

    addVertices(count: number): void {
        this.numVertices += count;
        if (this.numVertices + count >= CommandBuffer.MAX_VERTICES) {
            this.flushVertices();
        }
    }

    textureClear(): void {
        this.textureSet(new TextureHandle(-1));
    }

    drawRect(
        x: number,
        y: number,
        w: number,
        h: number,
        color: ColorRGBA,
        corners: number,
        rounding: number,
    ): void {
        this.textureClear();
        this.quadsBegin();
        this.setColorC(color);
        this.drawRectExt(x, y, w, h, rounding, corners);
        this.quadsEnd();
    }

    drawRectExt(
        x: number,
        y: number,
        w: number,
        h: number,
        r: number,
        corners: number,
    ): void {
        const numSegments = 8;
        const segmentsAngle = Math.PI / 2 / numSegments;
        const freeform: FreeformItem[] = [];

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

    drawRect4(
        x: number,
        y: number,
        w: number,
        h: number,
        colorTopLeft: ColorRGBA,
        colorTopRight: ColorRGBA,
        colorBottomLeft: ColorRGBA,
        colorBottomRight: ColorRGBA,
        corners: number,
        rounding: number,
    ): void {
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

    drawRectExt4(
        x: number,
        y: number,
        w: number,
        h: number,
        colorTopLeft: ColorRGBA,
        colorTopRight: ColorRGBA,
        colorBottomLeft: ColorRGBA,
        colorBottomRight: ColorRGBA,
        r: number,
        corners: number,
    ): void {
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

    drawCircle(
        centerX: number,
        centerY: number,
        radius: number,
        segments: number,
    ): void {
        const items: FreeformItem[] = [];
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

    quadsBegin(): void {
        if (this.drawing != 0) {
            throw new Error('BAD!');
        }

        this.drawing = DRAWING_QUADS;

        this.quadsSetSubset(0, 0, 1, 1);
        this.quadsSetRotation(0);
        this.setColor(1, 1, 1, 1);
    }

    addCmd(cmd: Command): void {
        this.commandBuffer.addCommand(cmd);
    }

    clear(r: number, g: number, b: number, forceClearNow: boolean): void {
        const commandClear = new CommandClear(
            new ColorRGBA(r, g, b, 1),
            forceClearNow,
        );

        this.addCmd(commandClear);
    }

    loadImage(src: string): Promise<ImageInfo> {
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

    findFreeTextureIndex(): TextureHandle {
        const size = this.textureIndices.length;
        if (this.firstFreeTexture === size) {
            throw new Error(
                'holy shit, how many textures are you gonna make???',
            );
            //TODO: resize this.textureIndices array
        }
        const tex = this.firstFreeTexture;
        this.firstFreeTexture = this.textureIndices[tex]!;
        this.textureIndices[tex] = -1;

        return new TextureHandle(tex);
    }

    loadTextureCreateCommand(
        textureId: number,
        width: number,
        height: number,
        data: Uint8Array,
    ): CommmandTextureCreate {
        const cmd = new CommmandTextureCreate(textureId, width, height, data);

        //FIXME: do i need flags here??

        return cmd;
    }

    loadTexture(
        width: number,
        height: number,
        data: Uint8Array,
    ): TextureHandle {
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

    textureSet(textureId: TextureHandle): void {
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

    createBufferObject(data: ArrayBufferLike): number {
        let index: number;

        if (this.firstFreeBufferObjectIndex === -1) {
            index = this.bufferObjectIndices.length;
            this.bufferObjectIndices.push(index);
        } else {
            index = this.firstFreeBufferObjectIndex;
            this.firstFreeBufferObjectIndex = this.bufferObjectIndices[index]!;
            this.bufferObjectIndices[index] = index;
        }

        const cmd = new CommandCreateBufferObject(index, data);
        this.addCmd(cmd);

        return index;
    }

    createBufferContainer(containerInfo: BufferContainerInfo): number {
        let index: number;

        if (this.firstFreeVertexArrayInfo) {
            index = this.vertexArrayInfo.length;
            this.vertexArrayInfo.push(new VertexArrayInfo(-1, 0));
        } else {
            index = this.firstFreeVertexArrayInfo;
            this.firstFreeVertexArrayInfo =
                this.vertexArrayInfo[index]!.freeIndex;
            this.vertexArrayInfo[index]!.freeIndex = index;
        }

        const cmd = new CommandCreateBufferContainer(
            index,
            containerInfo.stride,
            containerInfo.vertBufferBindingIndex,
            containerInfo.attributes,
        );

        this.vertexArrayInfo[index]!.associatedBufferObjectIndex =
            containerInfo.vertBufferBindingIndex;
        this.addCmd(cmd);

        return index;
    }

    renderTileLayer(
        bufferContainerIndex: number,
        color: ColorRGBA,
        offsets: number[],
        indicedVertexDrawNum: number[],
        numIndicesOffset: number,
    ): void {
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
}
