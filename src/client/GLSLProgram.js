import { GLSL } from './GLSL';
import { glDbg } from './gl_dbg';

export class GLSLProgram {
    /** @param {WebGL2RenderingContext} ctx */
    constructor(ctx) {
        /** @type {WebGL2RenderingContext} */
        this.ctx = ctx;
    }

    createProgram() {
        const program = this.ctx.createProgram();
        if (!program) {
            throw new Error("Coudn't create a WebGLProgram");
        }

        /** @type {WebGLProgram} */
        this.program = program;
    }

    /** @param {GLSL} shader */
    addShader(shader) {
        glDbg(this.ctx, () => {
            this.ctx.attachShader(this.program, shader.shader);
        });
    }

    /** @param {GLSL} shader */
    detachShader(shader) {
        glDbg(this.ctx, () => {
            this.ctx.detachShader(this.program, shader.shader);
        });
    }

    linkProgram() {
        glDbg(this.ctx, () => {
            this.ctx.linkProgram(this.program);
        });
    }

    useProgram() {
        glDbg(this.ctx, () => {
            this.ctx.useProgram(this.program);
        });
    }

    /**
     * @param {WebGLProgram} program
     * @param {string} name
     * @returns {?WebGLUniformLocation}
     */
    getUniformLoc(
        program,
        name,
    ) {
        return this.ctx.getUniformLocation(program, name);
    }

    /**
     * @param {WebGLUniformLocation} uniform
     * @param {Float32Array} data
     */
    setUniformVec4(uniform, data) {
        this.ctx.uniform4fv(uniform, data);
    }
}
