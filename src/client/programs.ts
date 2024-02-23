import { GLSLProgram } from './GLSLProgram';

export class GLSLTWProgram extends GLSLProgram {
    locPos: WebGLUniformLocation;

    constructor(glContext: WebGL2RenderingContext) {
        super(glContext);
    }
}

export class GLSLPrimitiveProgram extends GLSLTWProgram {}
