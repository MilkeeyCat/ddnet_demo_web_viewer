import { CommandBuffer } from "./CommandBuffer";
import { CommandWebGL2CommandProcessorFragment } from "./CommandWebGL2CommandProcessorFragment";
import { RunCommandReturnTypes } from "./enums";

export class CommandProcessor {
    glBackend: CommandWebGL2CommandProcessorFragment;

    runBuffer(buffer: CommandBuffer) {
        // glBackend.startCommands isnt rly necessary coz its only
        // needed for vulkan losers

        for (let command = buffer.cmdBufferHead; command; command = command.next) {
            const res = this.glBackend.runCommand(command);
            if (res == RunCommandReturnTypes.RUN_COMMAND_COMMAND_HANDLED) {
                continue;
            } else if (res == RunCommandReturnTypes.RUN_COMMAND_COMMAND_ERROR) {
                console.log("Yikes, we fucked up kek");
                return;
            } else if (res == RunCommandReturnTypes.RUN_COMMAND_COMMAND_WARNING) {
                console.log("We are not really that fucked but not gud");
                return;
            }

            //sdl.RunCommand()
            //general.RunCommand();
        }
    }

    constructor(ctx: WebGL2RenderingContext) {
        this.glBackend = new CommandWebGL2CommandProcessorFragment(ctx);
    }
}
