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

        let shaderSource = "#version 300 es\n";

        if (type === ctx.FRAGMENT_SHADER) {
            shaderSource += `precision highp float;
            precision highp sampler2D;
            precision highp sampler3D;
            precision highp samplerCube;
            precision highp samplerCubeShadow;
            precision highp sampler2DShadow;
            precision highp sampler2DArray;
            precision highp sampler2DArrayShadow;
            `;
        }

        shaderSource += definesString + '\n' + source;

        this.ctx.shaderSource(shader, shaderSource);
        this.ctx.compileShader(shader);

        this.shader = shader;
    }

    deleteShader(): void {
        this.ctx.deleteShader(this.shader);
    }
}
