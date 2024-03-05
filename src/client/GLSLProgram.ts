import { GLSL } from './GLSL';
import { glDbg } from './gl_dbg';

export class GLSLProgram {
    program: WebGLProgram;

    constructor(public ctx: WebGL2RenderingContext) {}

    createProgram(): void {
        const program = this.ctx.createProgram();

        if (!program) {
            throw new Error("Coudn't create a WebGLProgram");
        }

        this.program = program;
    }

    addShader(shader: GLSL): void {
        glDbg(this.ctx, () => {
            this.ctx.attachShader(this.program, shader.shader);
        });
    }

    detachShader(shader: GLSL): void {
        glDbg(this.ctx, () => {
            this.ctx.detachShader(this.program, shader.shader);
        });
    }

    linkProgram(): void {
        glDbg(this.ctx, () => {
            this.ctx.linkProgram(this.program);
        });
    }

    useProgram(): void {
        glDbg(this.ctx, () => {
            this.ctx.useProgram(this.program);
        });
    }

    getUniformLoc(
        program: WebGLProgram,
        name: string,
    ): WebGLUniformLocation | null {
        return this.ctx.getUniformLocation(program, name);
    }
}
