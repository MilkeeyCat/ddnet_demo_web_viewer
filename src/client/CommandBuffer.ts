import { Command } from "./commands";
//NOTE: dont forget about TypedArray.subarray

export class CommandBuffer {
    // cmdBuffer
    // commandCount
    // renderCallCount
    // dataBuffer

    cmdBufferHead: Command | null;
    cmdBufferTail: Command | null;

    constructor() {
        this.cmdBufferHead = null;
        this.cmdBufferTail = null;
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
}
