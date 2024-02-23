import { GLSLProgram } from './GLSLProgram';
import { Point } from './common';

export class GLSLTWProgram extends GLSLProgram {
    locPos: WebGLUniformLocation;
    lastScreenTL: Point;
    lastScreenBR: Point;

    constructor(glContext: WebGL2RenderingContext) {
        super(glContext);
        this.lastScreenTL = new Point(0, 0);
        this.lastScreenBR = new Point(0, 0);
    }
}

export class GLSLPrimitiveProgram extends GLSLTWProgram {}
