import { CommandBuffer } from './CommandBuffer';
import { CommandProcessor } from './CommandProcessor';

export class GraphicsBackend {
    /** @param {WebGL2RenderingContext} ctx */
    constructor(ctx) {
        /** @type {WebGL2RenderingContext} */
        this.ctx = ctx;
        /** @type {CommandProcessor} */
        this.processor = new CommandProcessor(ctx);
    }

    /** @param {CommandBuffer} buffer */
    async runBuffer(buffer) {
        await this.processor.runBuffer(buffer);
    }
}
