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
};

export class Command {
    next: null | Command

    constructor(public cmd: CommandBufferCMD) {
        this.next = null;
    }
}

export class CommandClear extends Command {
    //@ts-ignore NOTE: do it xd
    public color: ColorRGBA;
    public forceClear: boolean;

    constructor() {
        super(CommandBufferCMD.CMD_CLEAR);

        this.color = null;
        this.forceClear = false;
    }
}

class CommandSignal extends Command { }

class CommandRunBuffer extends Command {
    //NOTE: what should be used as command buffer :thonk:
    commandBuffer: any;

    constructor() {
        super(CommandBufferCMD.CMD_RUNBUFFER);
    }
}

export class CommandInit extends Command {
    constructor() {
        super(10_000 + 1);
    }
}
