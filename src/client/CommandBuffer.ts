import { Command } from "./commands";
//NOTE: dont forget about TypedArray.subarray

export class CommandBuffer {
    // cmdBuffer
    // commandCount
    // dataBuffer
    static PRIMTYPE_INVALID = 0;
    static PRIMTYPE_LINES = 1;
    static PRIMTYPE_QUADS = 2;
    static PRIMTYPE_TRIANGLES = 3;

    static MAX_TEXTURES = 1024 * 8;
    static MAX_VERTICES = 32 * 1024;

    renderCallCount: number;
    cmdBufferHead: Command | null;
    cmdBufferTail: Command | null;

    constructor() {
        this.cmdBufferHead = null;
        this.cmdBufferTail = null;
        this.renderCallCount = 0;
    }

    addCommand(command: Command) {
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

    addRenderCalls(count: number) {
        this.renderCallCount += count;
    }
}
