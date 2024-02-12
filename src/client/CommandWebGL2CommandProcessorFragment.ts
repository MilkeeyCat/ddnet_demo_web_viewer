import { CommandBuffer } from "./CommandBuffer";
import { Command, CommandBufferCMD, CommandClear, CommandInit, CommandRender } from "./commands";
import { RunCommandReturnTypes } from "./enums"

const MAX_STREAM_BUFFER_COUNT = 10;

export class CommandWebGL2CommandProcessorFragment {
    glContext: WebGL2RenderingContext;

    static CMD_PRE_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL;
    static CMD_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 1;
    static CMD_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 2;
    static CMD_POST_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 3;

    primitiveDrawBufferTex3d: WebGLBuffer | null;
    primitiveDrawBuffer: (WebGLBuffer | null)[];


    constructor(ctx: WebGL2RenderingContext) {
        this.glContext = ctx;

        this.primitiveDrawBufferTex3d = null
        this.primitiveDrawBuffer = new Array(MAX_STREAM_BUFFER_COUNT).fill(null);
    }

    cmdInit(command: CommandInit) {
        console.log("Im in a init command", command);

        this.primitiveDrawBufferTex3d = this.glContext.createBuffer();
        for (let i = 0; i < this.primitiveDrawBuffer.length; i++) {
            this.primitiveDrawBuffer[i] = this.glContext.createBuffer();
        }

        console.log("Initialized shtuff", command);
    }

    cmdRender(command: CommandRender) {
        command;

        const program = `
        You gotta add own glsl primitive program
        `;

        this.glContext.useProgram(program);
        //this shit doesnt work
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

    uploadStreamBufferData(primitiveType: number, vertices: any[], primitiveCount: number, asTex3d = false) {
        let count = 0;

        switch (primitiveType) {
            case CommandBuffer.PRIMTYPE_LINES:
                count = primitiveCount * 2;
                break;
            case CommandBuffer.PRIMTYPE_TRIANGLES:
                count = primitiveCount * 3;
                break;
            case CommandBuffer.PRIMTYPE_QUADS:
                count = primitiveCount * 4;
                break;
            default:
                return
        }

        if (asTex3d) {
            this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, m_PrimitiveDrawBufferIDTex3D);
        } else {
            this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, m_aPrimitiveDrawBufferID[m_LastStreamBuffer]);
        }

        this.glContext.bufferData(this.glContext.ARRAY_BUFFER, new ArrayBuffer(10), this.glContext.STREAM_DRAW);
    }
}
