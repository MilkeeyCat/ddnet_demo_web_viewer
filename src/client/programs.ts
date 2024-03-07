import { GLSLProgram } from './GLSLProgram';
import { Point } from './common';

export class GLSLTWProgram extends GLSLProgram {
    locPos: WebGLUniformLocation;
    //NOTE: idk what this thing is for, i dont rly use it anywhere :\
    locTextureSampler: WebGLUniformLocation;
    lastScreenTL: Point;
    lastScreenBR: Point;

    constructor(ctx: WebGL2RenderingContext) {
        super(ctx);
        this.lastScreenTL = new Point(0, 0);
        this.lastScreenBR = new Point(0, 0);
    }
}

export class GLSLPrimitiveProgram extends GLSLTWProgram {}

export class GLSLTileProgram extends GLSLTWProgram {
    locColor: WebGLUniformLocation;
    locOffset: WebGLUniformLocation;
    locDir: WebGLUniformLocation;
    locScale: WebGLUniformLocation;
    locNum: WebGLUniformLocation;
    locJumpIndex: WebGLUniformLocation;

    constructor(ctx: WebGL2RenderingContext) {
        super(ctx);

        this.locColor = -1;
        this.locOffset = -1;
        this.locDir = -1;
        this.locNum = -1;
        this.locJumpIndex = -1;
        this.locScale = -1;
    }
}
