import { BufferContainerAttribute } from './CommandWebGL2CommandProcessorFragment';
import { State } from './Graphics';
import { ColorRGBA, Vertex } from './common';

/**
 * @enum {number}
 * @readonly
 */
export const CommandBufferCMD = {
    // command groups
    CMDGROUP_CORE: 0, // commands that everyone has to implement
    CMDGROUP_PLATFORM_GL: 10000, // commands specific to a platform
    CMDGROUP_PLATFORM_SDL: 20000,

    CMD_FIRST: 0, //CMDGROUP_CORE
    CMD_NOP: 0, //CMD_FIRST

    //
    CMD_RUNBUFFER: 1,

    // synchronization
    CMD_SIGNAL: 2,

    // texture commands
    CMD_TEXTURE_CREATE: 3,
    CMD_TEXTURE_DESTROY: 4,
    CMD_TEXTURE_UPDATE: 5,
    CMD_TEXT_TEXTURES_CREATE: 6,
    CMD_TEXT_TEXTURES_DESTROY: 7,
    CMD_TEXT_TEXTURE_UPDATE: 8,

    // rendering
    CMD_CLEAR: 9,
    CMD_RENDER: 10,
    CMD_RENDER_TEX3D: 11,

    // opengl 2.0+ commands (some are just emulated and only exist in opengl 3.3+)
    CMD_CREATE_BUFFER_OBJECT: 12, // create vbo
    CMD_RECREATE_BUFFER_OBJECT: 13, // recreate vbo
    CMD_UPDATE_BUFFER_OBJECT: 14, // update vbo
    CMD_COPY_BUFFER_OBJECT: 15, // copy vbo to another
    CMD_DELETE_BUFFER_OBJECT: 16, // delete vbo

    CMD_CREATE_BUFFER_CONTAINER: 17, // create vao
    CMD_DELETE_BUFFER_CONTAINER: 18, // delete vao
    CMD_UPDATE_BUFFER_CONTAINER: 19, // update vao

    CMD_INDICES_REQUIRED_NUM_NOTIFY: 20, // create indices that are required

    CMD_RENDER_TILE_LAYER: 21, // render a tilelayer
    CMD_RENDER_BORDER_TILE: 22, // render one tile multiple times
    CMD_RENDER_QUAD_LAYER: 23, // render a quad layer
    CMD_RENDER_TEXT: 24, // render text
    CMD_RENDER_QUAD_CONTAINER: 25, // render a quad buffer container
    CMD_RENDER_QUAD_CONTAINER_EX: 26, // render a quad buffer container with extended parameters
    CMD_RENDER_QUAD_CONTAINER_SPRITE_MULTIPLE: 27, // render a quad buffer container as sprite multiple times

    // swap
    CMD_SWAP: 28,

    // misc
    CMD_MULTISAMPLING: 29,
    CMD_VSYNC: 30,
    CMD_TRY_SWAP_AND_SCREENSHOT: 31,
    CMD_UPDATE_VIEWPORT: 32,

    // in Android a window that minimizes gets destroyed
    CMD_WINDOW_CREATE_NTF: 33,
    CMD_WINDOW_DESTROY_NTF: 34,

    CMD_COUNT: 35,
};

export class Command {
    /** @param {number} cmd */
    constructor(cmd) {
        /** @type {number} */
        this.cmd = cmd;
        /** @type {?number} */
        this.next = null;
    }
}

export class CommandClear extends Command {
    /**
     * @param {ColorRGBA} color
     * @param {boolean} forceClear
     */
    constructor(color, forceClear) {
        super(CommandBufferCMD.CMD_CLEAR);

        /** @type {ColorRGBA} */
        this.color = color;
        /** @type {boolean} */
        this.forceClear = forceClear;
    }
}

class CommandSignal extends Command { }

class CommandRunBuffer extends Command {
    //NOTE: what should be used as command buffer :thonk:
    //commandBuffer: any;

    constructor() {
        super(CommandBufferCMD.CMD_RUNBUFFER);
    }
}

export class CommandUpdateViewport extends Command {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    constructor(
        x,
        y,
        width,
        height,
    ) {
        super(CommandBufferCMD.CMD_UPDATE_VIEWPORT);

        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
        /** @type {number} */
        this.width = width;
        /** @type {number} */
        this.height = height;
    }
}

export class CommandRender extends Command {
    /**
     * @param {State} state
     * @param {number} primType
     * @param {number} primCount
     * @param {Vertex[]} vertices
     */
    constructor(
        state,
        primType,
        primCount,
        vertices
    ) {
        super(CommandBufferCMD.CMD_RENDER);

        /** @type {State} */
        this.state = state;
        /** @type {number} */
        this.primType = primType;
        /** @type {number} */
        this.primCount = primCount;
        /** @type {Vertex[]} */
        this.vertices = vertices;
    }
}

export class CommmandTextureCreate extends Command {
    /**
     * @param {number} slot
     * @param {number} width
     * @param {number} height
     * @param {Uint8Array} data
     */
    constructor(
        slot,
        width,
        height,
        data,
    ) {
        super(CommandBufferCMD.CMD_TEXTURE_CREATE);

        /** @type {number} */
        this.slot = slot;
        /** @type {number} */
        this.width = width;
        /** @type {number} */
        this.height = height;
        /** @type {Uint8Array} */
        this.data = data;
    }
}

export class CommandCreateBufferObject extends Command {
    /**
     * @param {number} bufferIndex
     * @param {ArrayBuffer} data
     */
    constructor(
        bufferIndex,
        data,
    ) {
        super(CommandBufferCMD.CMD_CREATE_BUFFER_OBJECT);

        /** @type {number} */
        this.bufferIndex = bufferIndex;
        /** @type {ArrayBuffer} */
        this.data = data;
    }
}

export class CommandCreateBufferContainer extends Command {
    /**
     * @param {number} bufferContainerIndex
     * @param {number} stride
     * @param {number} vertBufferBindingIndex
     * @param {BufferContainerAttribute[]} attributes
     */
    constructor(
        bufferContainerIndex,
        stride,
        vertBufferBindingIndex,
        attributes
    ) {
        super(CommandBufferCMD.CMD_CREATE_BUFFER_CONTAINER);

        /** @type {number} */
        this.bufferContainerIndex = bufferContainerIndex;
        /** @type {number} */
        this.stride = stride;
        /** @type {number} */
        this.vertBufferBindingIndex = vertBufferBindingIndex;
        /** @type {BufferContainerAttribute[]} */
        this.attributes = attributes;
    }
}

export class CommandRenderTileLayer extends Command {
    /**
     * @param {State} state
     * @param {ColorRGBA} color
     * @param {number[]} indicesOffsets
     * @param {number[]} drawCount
     * @param {number} indicesDrawNum
     * @param {number} bufferContainerIndex
     */
    constructor(
        state,
        color,
        indicesOffsets,
        drawCount,
        indicesDrawNum,
        bufferContainerIndex,
    ) {
        super(CommandBufferCMD.CMD_RENDER_TILE_LAYER);

        /** @type {State} */
        this.state = state;
        /** @type {ColorRGBA} */
        this.color = color;
        /** @type {number[]} */
        this.indicesOffsets = indicesOffsets;
        /** @type {number[]} */
        this.drawCount = drawCount;
        /** @type {number} */
        this.indicesDrawNum = indicesDrawNum;
        /** @type {number} */
        this.bufferContainerIndex = bufferContainerIndex;
    }
}

export class CommandIndicesRequiredNumNotify extends Command {
    /** @param {number} requiredIndicesNum */
    constructor(requiredIndicesNum) {
        super(CommandBufferCMD.CMD_INDICES_REQUIRED_NUM_NOTIFY);

        /** @type {number} */
        this.requiredIndicesNum = requiredIndicesNum;
    }
}

export class CommandInit extends Command {
    constructor() {
        super(10_000 + 1);
    }
}
