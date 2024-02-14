import { CommandBuffer } from "./CommandBuffer";
import { GLSL } from "./GLSL";
import { GLSLProgram } from "./GLSLProgram";
import { Command, CommandBufferCMD, CommandClear, CommandInit, CommandRender } from "./commands";
import { RunCommandReturnTypes } from "./enums"

const MAX_STREAM_BUFFER_COUNT = 10;

export class CommandWebGL2CommandProcessorFragment {
    glContext: WebGL2RenderingContext;

    static CMD_PRE_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL;
    static CMD_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 1;
    static CMD_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 2;
    static CMD_POST_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 3;

    primitiveProgram: GLSLProgram;

    primitiveDrawBufferTex3d: WebGLBuffer | null;
    primitiveDrawBuffer: (WebGLBuffer | null)[];

    quadDrawIndexBuffer!: WebGLBuffer;


    constructor(ctx: WebGL2RenderingContext) {
        this.glContext = ctx;

        this.primitiveProgram = new GLSLProgram(this.glContext);
        this.primitiveDrawBufferTex3d = null
        this.primitiveDrawBuffer = new Array(MAX_STREAM_BUFFER_COUNT).fill(null);
    }

    async cmdInit(command: CommandInit) {
        console.log("Im in a init command", command);

        this.primitiveDrawBufferTex3d = this.glContext.createBuffer();
        for (let i = 0; i < this.primitiveDrawBuffer.length; i++) {
            this.primitiveDrawBuffer[i] = this.glContext.createBuffer();
        }

        //primitive program
        //@ts-ignore
        const primitiveVertexShader = new GLSL(this.glContext, (await import('../../shaders/prim.vert?raw')).default, this.glContext.VERTEX_SHADER);
        //@ts-ignore
        const primitiveFragmentShader = new GLSL(this.glContext, (await import('../../shaders/prim.frag?raw')).default, this.glContext.FRAGMENT_SHADER);

        this.primitiveProgram.createProgram();
        this.primitiveProgram.addShader(primitiveVertexShader);
        this.primitiveProgram.addShader(primitiveFragmentShader);
        this.primitiveProgram.linkProgram();
        this.useProgram(this.primitiveProgram);

        const quadDrawIndexBuffer = this.glContext.createBuffer();
        if (!quadDrawIndexBuffer) {
            throw new Error("Failed to create buffer");
        }

        this.quadDrawIndexBuffer = quadDrawIndexBuffer;

        this.glContext.bindBuffer(this.glContext.COPY_WRITE_BUFFER, this.quadDrawIndexBuffer);

        const indices = new Array(CommandBuffer.MAX_VERTICES / 4 * 6);
        let primq = 0;

        for (let i = 0; i < CommandBuffer.MAX_VERTICES / 4 * 6; i += 6) {
            indices[i] = primq;
            indices[i + 1] = primq + 1;
            indices[i + 2] = primq + 2;
            indices[i + 3] = primq;
            indices[i + 4] = primq + 2;
            indices[i + 5] = primq + 3;

            primq += 4;
        }

        this.glContext.bufferData(this.glContext.COPY_WRITE_BUFFER, new Uint8Array(indices), this.glContext.STATIC_DRAW);

        console.log("Initialized shtuff", command);
    }

    useProgram(program: GLSLProgram) {
        program.useProgram();
    }

    cmdRender(command: CommandRender) {
        command;
        this.useProgram(this.primitiveProgram);
    }

    cmdClear(command: CommandClear) {
        this.glContext.clearColor(command.color.r, command.color.g, command.color.b, command.color.a);
        this.glContext.clear(this.glContext.COLOR_BUFFER_BIT | this.glContext.DEPTH_BUFFER_BIT);
    }

    async runCommand(baseCommand: Command): Promise<RunCommandReturnTypes> {
        switch (baseCommand.cmd) {
            case CommandWebGL2CommandProcessorFragment.CMD_INIT:
                await this.cmdInit(baseCommand);
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
        vertices;
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
            //this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, primitiveDrawBufferIdTex3d);
        } else {
            //this.glContext.bindBuffer(this.glContext.ARRAY_BUFFER, primitiveDrawBufferId[lastStreamBuffer]);
        }

        this.glContext.bufferData(this.glContext.ARRAY_BUFFER, new ArrayBuffer(10), this.glContext.STREAM_DRAW);
    }
}
