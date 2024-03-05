import { CommandBuffer } from './CommandBuffer';
import { CommandProcessor } from './CommandProcessor';

export class GraphicsBackend {
    processor: CommandProcessor;
    ctx: WebGL2RenderingContext;

    constructor(ctx: WebGL2RenderingContext) {
        this.ctx = ctx;
        this.processor = new CommandProcessor(ctx);
    }

    async runBuffer(buffer: CommandBuffer): Promise<void> {
        await this.processor.runBuffer(buffer);
    }
}
