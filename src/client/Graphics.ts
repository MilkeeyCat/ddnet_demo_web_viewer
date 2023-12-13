//NOTE: kill me, its garbage

import { CommandBuffer } from "./CommandBuffer";
import { GraphicsBackend } from "./GraphicsBackend";
import { ColorRGBA, Command, CommandClear, CommandInit } from "./commands";

const CMD_BUFFER_DATA_BUFFER_SIZE = 1024 * 1024 * 2;
const CMD_BUFFER_CMD_BUFFER_SIZE = 1024 * 256;

const NUM_CMDBUFFERS = 2;

export class Graphics {
    backend: GraphicsBackend;
    commandBuffers: Array<CommandBuffer>;
    commandBuffer: CommandBuffer;
    currentCommandBuffer: number;

    //Normalized color
    //color: Color[4];

    static MAX_TEXTURES = 1024 * 8;
    static MAX_VERTICES = 32 * 1024;


    static TEXFORMAT_INVALID = 0;
    static TEXFORMAT_RGBA = 1;

    static TEXFLAG_NOMIPMAPS = 1;
    static TEXFLAG_TO_3D_TEXTURE = (1 << 3);
    static TEXFLAG_TO_2D_ARRAY_TEXTURE = (1 << 4);
    static TEXFLAG_NO_2D_TEXTURE = (1 << 5);


    static PRIMTYPE_INVALID = 0;
    static PRIMTYPE_LINES = 1;
    static PRIMTYPE_QUADS = 2;
    static PRIMTYPE_TRIANGLES = 3;


    static BLEND_NONE = 0;
    static BLEND_ALPHA = 1;
    static BLEND_ADDITIVE = 2;


    static WRAP_REPEAT = 0;
    static WRAP_CLAMP = 1;

    constructor(ctx: WebGL2RenderingContext) {
        this.currentCommandBuffer = 0;
        this.commandBuffers = new Array(NUM_CMDBUFFERS).fill(null);

        for (let [i, _] of this.commandBuffers.entries()) {
            this.commandBuffers[i] = new CommandBuffer();
        }

        this.commandBuffer = this.commandBuffers[0]!;
        this.backend = new GraphicsBackend(ctx);

        console.log(this);
    }

    kickCommandBuffer() {
        this.backend.runBuffer(this.commandBuffer);

        //TODO: warnings!?!??

        this.currentCommandBuffer ^= 1;
        this.commandBuffer = this.commandBuffers[this.currentCommandBuffer]!;
        this.commandBuffer.reset();
    }

    swap() {
        //some magic shit...

        this.kickCommandBuffer();
    }

    addCmd(cmd: Command) {
        this.commandBuffer.addCommand(cmd);
    }

    clear(r: number, g: number, b: number, forceClearNow: boolean) {
        const commandClear = new CommandClear(new ColorRGBA(r, g, b, 1), forceClearNow);

        this.addCmd(commandClear);
    }
}
