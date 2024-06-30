import { Command } from './commands';

export class CommandBuffer {
    static PRIMTYPE_INVALID = 0;
    static PRIMTYPE_LINES = 1;
    static PRIMTYPE_QUADS = 2;
    static PRIMTYPE_TRIANGLES = 3;

    static MAX_TEXTURES = 1024 * 8;
    static MAX_VERTICES = 32 * 1024;

    static BLEND_NONE = 0;
    static BLEND_ALPHA = 1;
    static BLEND_ADDITIVE = 2;

    static WRAP_REPEAT = 0;
    static WRAP_CLAMP = 1;

    constructor() {
        /** @type {?Command} */
        this.cmdBufferHead = null;
        /** @type {?Command} */
        this.cmdBufferTail = null;
        /** @type {number} */
        this.renderCallCount = 0;
    }

    /** @param {Command} command */
    addCommand(command) {
        if (this.cmdBufferTail) {
            this.cmdBufferTail.next = command;
        }

        if (!this.cmdBufferHead) {
            this.cmdBufferHead = command;
        }

        this.cmdBufferTail = command;
    }

    reset() {
        this.cmdBufferHead = this.cmdBufferTail = null;
    }

    /** @param {number} count */
    addRenderCalls(count) {
        this.renderCallCount += count;
    }
}
