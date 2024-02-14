export class GLSL {
    glContext: WebGLRenderingContext;
    shader!: WebGLShader;

    constructor(ctx: WebGLRenderingContext, source: string, type: number) {
        this.glContext = ctx;
        const shader = ctx.createShader(type);

        if (!shader) {
            throw new Error("Failed to generate a shader");
        }

        ctx.shaderSource(shader, source);
        ctx.compileShader(shader);

        this.shader = shader;
    }

    deleteShader() {
        this.glContext.deleteShader(this.shader);
    }
}
