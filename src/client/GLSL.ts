export class GLSL {
    ctx: WebGLRenderingContext;
    shader: WebGLShader;

    constructor(
        ctx: WebGLRenderingContext,
        source: string,
        type: number,
        defines: Record<string, string> = {},
    ) {
        this.ctx = ctx;
        const shader = ctx.createShader(type);
        if (!shader) {
            throw new Error('Failed to generate a shader');
        }

        const definesString = Object.keys(defines)
            .map((key) => `#define ${key} ${defines[key]}`)
            .join('\n');
        source = '#version 300 es\n' + definesString + '\n' + source;

        this.ctx.shaderSource(shader, source);
        this.ctx.compileShader(shader);

        this.shader = shader;
    }

    deleteShader(): void {
        this.ctx.deleteShader(this.shader);
    }
}
