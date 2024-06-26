import { CommandBuffer } from './CommandBuffer';
import { CommandWebGL2CommandProcessorFragment } from './CommandWebGL2CommandProcessorFragment';
import { RunCommandReturnTypes } from './enums';

export class CommandProcessor {
    /** @param {WebGL2RenderingContext} ctx */
    constructor(ctx) {
        /** @type {CommandWebGL2CommandProcessorFragment} */
        this.glBackend = new CommandWebGL2CommandProcessorFragment(ctx);
    }

    /** @param {CommandBuffer} buffer */
    async runBuffer(buffer) {
        for (
            let command = buffer.cmdBufferHead;
            command;
            command = command.next
        ) {
            /** @type {number} */
            const res = await this.glBackend.runCommand(command);
            if (res == RunCommandReturnTypes.RUN_COMMAND_COMMAND_HANDLED) {
                continue;
            } else if (res == RunCommandReturnTypes.RUN_COMMAND_COMMAND_ERROR) {
                console.log('Yikes, we fucked up kek');
                return;
            } else if (
                res == RunCommandReturnTypes.RUN_COMMAND_COMMAND_WARNING
            ) {
                console.log('We are not really that fucked but not gud');
                return;
            }
        }
    }
}
