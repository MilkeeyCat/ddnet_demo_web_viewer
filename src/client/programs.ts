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
