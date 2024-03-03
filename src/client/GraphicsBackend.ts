import { CommandBuffer } from './CommandBuffer';
import { CommandProcessor } from './CommandProcessor';

export class GraphicsBackend {
    processor: CommandProcessor;
    ctx: WebGL2RenderingContext;

    async runBuffer(buffer: CommandBuffer) {
        await this.processor.runBuffer(buffer);
    }

    constructor(ctx: WebGL2RenderingContext) {
        this.ctx = ctx;
        this.processor = new CommandProcessor(ctx);
    }
}
