import { Command, CommandBufferCMD, CommandClear, CommandInit, CommandRender } from "./commands";
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

    cmdRender(command: CommandRender) {
        command;
        //this shit wont work that easily
    }

    cmdClear(command: CommandClear) {
        this.glContext.clearColor(command.color.r, command.color.g, command.color.b, command.color.a);
        this.glContext.clear(this.glContext.COLOR_BUFFER_BIT | this.glContext.DEPTH_BUFFER_BIT);
    }

    runCommand(baseCommand: Command): RunCommandReturnTypes {
        switch (baseCommand.cmd) {
            case CommandWebGL2CommandProcessorFragment.CMD_INIT:
                this.cmdInit(baseCommand);
                break;
            case CommandBufferCMD.CMD_RENDER:
                this.cmdRender(baseCommand as CommandRender);
                break;
            case CommandBufferCMD.CMD_CLEAR:
                this.cmdClear(baseCommand as CommandClear);
                break;
        }

        return RunCommandReturnTypes.RUN_COMMAND_COMMAND_HANDLED;
    }
}
