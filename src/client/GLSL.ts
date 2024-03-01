export class GLSL {
    ctx: WebGLRenderingContext;
    shader: WebGLShader;

    constructor(ctx: WebGLRenderingContext, source: string, type: number) {
        this.ctx = ctx;
        const shader = ctx.createShader(type);
        if (!shader) {
            throw new Error('Failed to generate a shader');
        }

        this.ctx.shaderSource(shader, source);
        this.ctx.compileShader(shader);

        this.shader = shader;
    }

    deleteShader() {
        this.ctx.deleteShader(this.shader);
    }
}
