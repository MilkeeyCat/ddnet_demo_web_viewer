import { GLSL } from './GLSL';
import { glDbg } from './gl_dbg';

export class GLSLProgram {
    program: WebGLProgram;

    constructor(public glContext: WebGL2RenderingContext) {}

    createProgram() {
        const program = this.glContext.createProgram();

        if (!program) {
            throw new Error("Coudn't create a WebGLProgram");
        }

        this.program = program;
    }

    addShader(shader: GLSL) {
        glDbg(this.glContext, () => {
            this.glContext.attachShader(this.program, shader.shader);
        });
    }

    detachShader(shader: GLSL) {
        glDbg(this.glContext, () => {
            this.glContext.detachShader(this.program, shader.shader);
        });
    }

    linkProgram() {
        glDbg(this.glContext, () => {
            this.glContext.linkProgram(this.program);
        });
    }

    useProgram() {
        glDbg(this.glContext, () => {
            this.glContext.useProgram(this.program);
        });
    }

    getUniformLoc(
        program: WebGLProgram,
        name: string,
    ): WebGLUniformLocation | null {
        return this.glContext.getUniformLocation(program, name);
    }
}
