import { GLSLProgram } from './GLSLProgram';
import { Point } from './common';

export class GLSLTWProgram extends GLSLProgram {
    /** @param {WebGL2RenderingContext} ctx */
    constructor(ctx) {
        super(ctx);
        /** @type {Point} */
        this.lastScreenTL = new Point(0, 0);
        /** @type {Point} */
        this.lastScreenBR = new Point(0, 0);
        /** @type {WebGLUniformLocation} */
        this.locPos = -1;
        /** @type {WebGLUniformLocation} */
        this.locTextureSampler = -1;
    }
}

export class GLSLPrimitiveProgram extends GLSLTWProgram {}

export class GLSLTileProgram extends GLSLTWProgram {
    /** @param {WebGL2RenderingContext} ctx */
    constructor(ctx) {
        super(ctx);

        /** @type {WebGLUniformLocation} */
        this.locColor = -1;
        /** @type {WebGLUniformLocation} */
        this.locOffset = -1;
        /** @type {WebGLUniformLocation} */
        this.locDir = -1;
        /** @type {WebGLUniformLocation} */
        this.locNum = -1;
        /** @type {WebGLUniformLocation} */
        this.locJumpIndex = -1;
        /** @type {WebGLUniformLocation} */
        this.locScale = -1;
    }
}
