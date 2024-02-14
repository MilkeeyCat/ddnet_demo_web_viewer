import { GLSL } from "./GLSL";

export class GLSLProgram {
    glContext: WebGLRenderingContext;
    private program!: WebGLProgram;

    constructor(ctx: WebGLRenderingContext) {
        this.glContext = ctx;
    }

    createProgram() {
        const program = this.glContext.createProgram();

        if (!program) {
            throw new Error("Coudn't create a WebGLProgram")
        }

        this.program = program;
    }

    addShader(shader: GLSL) {
        this.glContext.attachShader(this.program, shader.shader);
    }

    detachShader(shader: GLSL) {
        this.glContext.detachShader(this.program, shader.shader);
    }

    linkProgram() {
        this.glContext.linkProgram(this.program);
        console.log("are we fukcked", this.glContext.getProgramInfoLog(this.program));
    }

    useProgram() {
        this.glContext.useProgram(this.program);
    }
}
