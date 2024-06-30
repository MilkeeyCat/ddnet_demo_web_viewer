export class GLSL {
    /**
     * @param {WebGL2RenderingContext} ctx
     * @param {string} source
     * @param {number} type
     * @param {Object.<string, string>} [defines = {}]
     */
    constructor(ctx, source, type, defines = {}) {
        /** @type {WebGL2RenderingContext} */
        this.ctx = ctx;

        /** @type {?WebGLShader} */
        const shader = ctx.createShader(type);
        if (!shader) {
            throw new Error('Failed to generate a shader');
        }

        /** @type {string} */
        const definesString = Object.keys(defines)
            .map((key) => `#define ${key} ${defines[key]}`)
            .join('\n');

        let shaderSource = '#version 300 es\n';

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

        /** @type {WebGLShader} */
        this.shader = shader;
    }

    deleteShader() {
        this.ctx.deleteShader(this.shader);
    }
}
