import { Command, CommandBufferCMD, CommandInit } from "./commands";
import { RunCommandReturnTypes } from "./enums"

export class CommandWebGL2CommandProcessorFragment {
    glContext: WebGL2RenderingContext;

    static CMD_PRE_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL;
    static CMD_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 1;
    static CMD_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 2;
    static CMD_POST_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 3;

    constructor(ctx: WebGL2RenderingContext) {
        this.glContext = ctx;
    }

    cmdInit(command: CommandInit) {
        console.log("Im in a init command", command);
    }

    runCommand(baseCommand: Command): RunCommandReturnTypes {
        switch (baseCommand.cmd) {
            case CommandWebGL2CommandProcessorFragment.CMD_INIT:
                this.cmdInit(baseCommand);
                break;
        }

        return RunCommandReturnTypes.RUN_COMMAND_COMMAND_HANDLED;
    }
}
