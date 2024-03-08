import { BufferContainerAttribute } from './CommandWebGL2CommandProcessorFragment';
import { State } from './Graphics';
import { ColorRGBA, Vertex } from './common';

export enum CommandBufferCMD {
    // command groups
    CMDGROUP_CORE = 0, // commands that everyone has to implement
    CMDGROUP_PLATFORM_GL = 10000, // commands specific to a platform
    CMDGROUP_PLATFORM_SDL = 20000,

    //
    CMD_FIRST = CMDGROUP_CORE,
    CMD_NOP = CMD_FIRST,

    //
    CMD_RUNBUFFER,

    // synchronization
    CMD_SIGNAL,

    // texture commands
    CMD_TEXTURE_CREATE,
    CMD_TEXTURE_DESTROY,
    CMD_TEXTURE_UPDATE,
    CMD_TEXT_TEXTURES_CREATE,
    CMD_TEXT_TEXTURES_DESTROY,
    CMD_TEXT_TEXTURE_UPDATE,

    // rendering
    CMD_CLEAR,
    CMD_RENDER,
    CMD_RENDER_TEX3D,

    // opengl 2.0+ commands (some are just emulated and only exist in opengl 3.3+)
    CMD_CREATE_BUFFER_OBJECT, // create vbo
    CMD_RECREATE_BUFFER_OBJECT, // recreate vbo
    CMD_UPDATE_BUFFER_OBJECT, // update vbo
    CMD_COPY_BUFFER_OBJECT, // copy vbo to another
    CMD_DELETE_BUFFER_OBJECT, // delete vbo

    CMD_CREATE_BUFFER_CONTAINER, // create vao
    CMD_DELETE_BUFFER_CONTAINER, // delete vao
    CMD_UPDATE_BUFFER_CONTAINER, // update vao

    CMD_INDICES_REQUIRED_NUM_NOTIFY, // create indices that are required

    CMD_RENDER_TILE_LAYER, // render a tilelayer
    CMD_RENDER_BORDER_TILE, // render one tile multiple times
    CMD_RENDER_QUAD_LAYER, // render a quad layer
    CMD_RENDER_TEXT, // render text
    CMD_RENDER_QUAD_CONTAINER, // render a quad buffer container
    CMD_RENDER_QUAD_CONTAINER_EX, // render a quad buffer container with extended parameters
    CMD_RENDER_QUAD_CONTAINER_SPRITE_MULTIPLE, // render a quad buffer container as sprite multiple times

    // swap
    CMD_SWAP,

    // misc
    CMD_MULTISAMPLING,
    CMD_VSYNC,
    CMD_TRY_SWAP_AND_SCREENSHOT,
    CMD_UPDATE_VIEWPORT,

    // in Android a window that minimizes gets destroyed
    CMD_WINDOW_CREATE_NTF,
    CMD_WINDOW_DESTROY_NTF,

    CMD_COUNT,
}

export class Command {
    next: null | Command;

    constructor(public cmd: CommandBufferCMD) {
        this.next = null;
    }
}

export class CommandClear extends Command {
    public color: ColorRGBA;
    public forceClear: boolean;

    constructor(color: ColorRGBA, forceClear: boolean) {
        super(CommandBufferCMD.CMD_CLEAR);

        this.color = color;
        this.forceClear = forceClear;
    }
}

class CommandSignal extends Command {}

class CommandRunBuffer extends Command {
    //NOTE: what should be used as command buffer :thonk:
    commandBuffer: any;

    constructor() {
        super(CommandBufferCMD.CMD_RUNBUFFER);
    }
}

export class CommandUpdateViewport extends Command {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number,
    ) {
        super(CommandBufferCMD.CMD_UPDATE_VIEWPORT);
    }
}

export class CommandRender extends Command {
    constructor(
        public state: State,
        public primType: number,
        public primCount: number,
        public vertices: Vertex[],
    ) {
        super(CommandBufferCMD.CMD_RENDER);
    }
}

export class CommmandTextureCreate extends Command {
    constructor(
        public slot: number,
        public width: number,
        public height: number,
        public data: Uint8Array,
    ) {
        super(CommandBufferCMD.CMD_TEXTURE_CREATE);
    }
}

export class CommandCreateBufferObject extends Command {
    constructor(
        public bufferIndex: number,
        public data: ArrayBufferLike,
    ) {
        super(CommandBufferCMD.CMD_CREATE_BUFFER_OBJECT);
    }
}

export class CommandCreateBufferContainer extends Command {
    constructor(
        public bufferContainerIndex: number,
        public stride: number,
        public vertBufferBindingIndex: number,
        public attributes: BufferContainerAttribute[],
    ) {
        super(CommandBufferCMD.CMD_CREATE_BUFFER_CONTAINER);
    }
}

export class CommandRenderTileLayer extends Command {
    constructor(
        public state: State,
        public color: ColorRGBA,
        public indicesOffsets: number[],
        public drawCount: number[],
        public indicesDrawNum: number,
        public bufferContainerIndex: number,
    ) {
        super(CommandBufferCMD.CMD_RENDER_TILE_LAYER);
    }
}

export class CommandIndicesRequiredNumNotify extends Command {
    constructor(public requiredIndicesNum: number) {
        super(CommandBufferCMD.CMD_INDICES_REQUIRED_NUM_NOTIFY);
    }
}

export class CommandInit extends Command {
    constructor() {
        super(10_000 + 1);
    }
}
