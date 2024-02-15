import { CommandBuffer } from './CommandBuffer';
import { GLSL } from './GLSL';
import { GLSLProgram } from './GLSLProgram';
import {
    Command,
    CommandBufferCMD,
    CommandClear,
    CommandInit,
    CommandRender,
} from './commands';
import { Vertex } from './common';
import { RunCommandReturnTypes } from './enums';
import { glDbg } from './gl_dbg';

const MAX_STREAM_BUFFER_COUNT = 10;

export class CommandWebGL2CommandProcessorFragment {
    static CMD_PRE_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL;
    static CMD_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 1;
    static CMD_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 2;
    static CMD_POST_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 3;

    primitiveProgram!: GLSLProgram;

    primitiveDrawVertex!: WebGLBuffer[];
    primitiveDrawVertexTex3d!: WebGLBuffer;
    primitiveDrawBufferTex3d!: WebGLBuffer;
    primitiveDrawBuffer!: WebGLBuffer[];
    lastStreamBuffer!: number;

    quadDrawIndexBuffer!: WebGLBuffer;

    constructor(public glContext: WebGL2RenderingContext) {}

    async cmdInit(command: CommandInit) {
        console.log('Im in a init command', command);

        this.primitiveProgram = new GLSLProgram(this.glContext);

        const buffer = this.glContext.createBuffer();
        if (!buffer) {
            throw new Error('Failed to create buffer');
        }
        this.primitiveDrawBufferTex3d = buffer;

        this.primitiveDrawBuffer = new Array(MAX_STREAM_BUFFER_COUNT);
        for (let i = 0; i < this.primitiveDrawBuffer.length; i++) {
            const buffer = this.glContext.createBuffer();
            if (!buffer) {
                throw new Error('Failed to create buffer');
            }

            this.primitiveDrawBuffer[i] = buffer;
        }

        const vertexArray = this.glContext.createVertexArray();
        if (!vertexArray) {
            throw new Error('Failed to create vertex array object');
        }
        this.primitiveDrawVertexTex3d = vertexArray;

        this.primitiveDrawVertex = new Array(MAX_STREAM_BUFFER_COUNT);
        for (let i = 0; i < this.primitiveDrawVertex.length; i++) {
            const vertexArray = this.glContext.createVertexArray();
            if (!vertexArray) {
                throw new Error('Failed to create vertex array object');
            }

            this.primitiveDrawVertex[i] = vertexArray;
        }

        for (let i = 0; i < MAX_STREAM_BUFFER_COUNT; i++) {
            this.glContext.bindBuffer(
                this.glContext.ARRAY_BUFFER,
                this.primitiveDrawBuffer[i]!,
            );
            this.glContext.bindVertexArray(this.primitiveDrawVertex[i]!);
            this.glContext.enableVertexAttribArray(0);
            this.glContext.enableVertexAttribArray(1);
            this.glContext.enableVertexAttribArray(2);

            this.glContext.vertexAttribPointer(
                0,
                2,
                this.glContext.FLOAT,
                false,
                2 * 4 + 2 * 4 + 4 * 4,
                0,
            );
            this.glContext.vertexAttribPointer(
                1,
                2,
                this.glContext.FLOAT,
                false,
                2 * 4 + 2 * 4 + 4 * 4,
                4 * 2,
            );
            this.glContext.vertexAttribPointer(
                2,
                4,
                this.glContext.UNSIGNED_BYTE,
                true,
                2 * 4 + 2 * 4 + 4 * 4,
                4 * 4,
            );
        }

        this.lastStreamBuffer = 0;

        //primitive program
        const primitiveVertexShader = new GLSL(
            this.glContext,
            (await import('../../shaders/prim.vert?raw')).default,
            this.glContext.VERTEX_SHADER,
        );
        const primitiveFragmentShader = new GLSL(
            this.glContext,
            (await import('../../shaders/prim.frag?raw')).default,
            this.glContext.FRAGMENT_SHADER,
        );

        this.primitiveProgram.createProgram();
        this.primitiveProgram.addShader(primitiveVertexShader);
        this.primitiveProgram.addShader(primitiveFragmentShader);
        this.primitiveProgram.linkProgram();
        this.useProgram(this.primitiveProgram);

        this.glContext.bindVertexArray(null);
        const quadDrawIndexBuffer = this.glContext.createBuffer();
        if (!quadDrawIndexBuffer) {
            throw new Error('Failed to create buffer');
        }

        this.quadDrawIndexBuffer = quadDrawIndexBuffer;

        glDbg(this.glContext, () => {
            this.glContext.bindBuffer(
                this.glContext.ELEMENT_ARRAY_BUFFER,
                this.quadDrawIndexBuffer,
            );
        });

        const indices = new Array((CommandBuffer.MAX_VERTICES / 4) * 6);
        let primq = 0;

        for (let i = 0; i < (CommandBuffer.MAX_VERTICES / 4) * 6; i += 6) {
            indices[i] = primq;
            indices[i + 1] = primq + 1;
            indices[i + 2] = primq + 2;
            indices[i + 3] = primq;
            indices[i + 4] = primq + 2;
            indices[i + 5] = primq + 3;

            primq += 4;
        }

        this.glContext.bufferData(
            this.glContext.ELEMENT_ARRAY_BUFFER,
            new Uint8Array(indices),
            this.glContext.STATIC_DRAW,
        );

        console.log('Initialized stuff', command);
    }

    useProgram(program: GLSLProgram) {
        program.useProgram();
    }

    cmdRender(command: CommandRender) {
        this.useProgram(this.primitiveProgram);

        this.uploadStreamBufferData(
            command.primType,
            command.vertices,
            command.primCount,
        );

        glDbg(this.glContext, () => {
            this.glContext.bindVertexArray(this.primitiveDrawVertex[0]!);
        });

        switch (command.primType) {
            case CommandBuffer.PRIMTYPE_LINES:
                glDbg(this.glContext, () => {
                    this.glContext.drawArrays(
                        this.glContext.LINES,
                        0,
                        command.primCount * 2,
                    );
                });

                break;
            case CommandBuffer.PRIMTYPE_TRIANGLES:
                glDbg(this.glContext, () => {
                    this.glContext.drawArrays(
                        this.glContext.TRIANGLES,
                        0,
                        command.primCount * 3,
                    );
                });

                break;
            case CommandBuffer.PRIMTYPE_QUADS:
                glDbg(this.glContext, () => {
                    this.glContext.bindBuffer(
                        this.glContext.ELEMENT_ARRAY_BUFFER,
                        this.quadDrawIndexBuffer,
                    );
                });

                //if (m_aLastIndexBufferBound[m_LastStreamBuffer] != m_QuadDrawIndexBufferID) {
                //    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, m_QuadDrawIndexBufferID);
                //    m_aLastIndexBufferBound[m_LastStreamBuffer] = m_QuadDrawIndexBufferID;
                //}

                glDbg(this.glContext, () => {
                    this.glContext.drawElements(
                        this.glContext.TRIANGLES,
                        6,
                        this.glContext.UNSIGNED_INT,
                        0,
                    );
                });
                break;

            default:
                throw new Error(`Unkdown primtype ${command.primType}`);
        }
    }

    cmdClear(command: CommandClear) {
        this.glContext.clearColor(
            command.color.r,
            command.color.g,
            command.color.b,
            command.color.a,
        );

        glDbg(this.glContext, () => {
            this.glContext.clear(
                this.glContext.COLOR_BUFFER_BIT |
                    this.glContext.DEPTH_BUFFER_BIT,
            );
        });
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

    uploadStreamBufferData(
        primitiveType: number,
        vertices: Vertex[],
        primitiveCount: number,
        asTex3d = false,
    ) {
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
                return;
        }

        if (asTex3d) {
            glDbg(this.glContext, () => {
                this.glContext.bindBuffer(
                    this.glContext.ARRAY_BUFFER,
                    this.primitiveDrawBufferTex3d,
                );
            });
        } else {
            glDbg(this.glContext, () => {
                this.glContext.bindBuffer(
                    this.glContext.ARRAY_BUFFER,
                    this.primitiveDrawBuffer[this.lastStreamBuffer]!,
                );
            });
        }

        const arr: number[] = [];

        for (let i = 0; i < vertices.length; i++) {
            arr.push(vertices[i]!.pos.x);
            arr.push(vertices[i]!.pos.y);

            arr.push(vertices[i]!.tex.u);
            arr.push(vertices[i]!.tex.v);

            arr.push(vertices[i]!.color.r);
            arr.push(vertices[i]!.color.g);
            arr.push(vertices[i]!.color.b);
            arr.push(vertices[i]!.color.a);
        }

        glDbg(this.glContext, () => {
            this.glContext.bufferData(
                this.glContext.ARRAY_BUFFER,
                new Float32Array(arr),
                this.glContext.STREAM_DRAW,
            );
        });
    }
}
