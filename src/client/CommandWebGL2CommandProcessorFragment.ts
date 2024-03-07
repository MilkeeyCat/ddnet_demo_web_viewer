import { CommandBuffer } from './CommandBuffer';
import { GLSL } from './GLSL';
import { GLSLProgram } from './GLSLProgram';
import { State } from './Graphics';
import {
    Command,
    CommandBufferCMD,
    CommandClear,
    CommandCreateBufferContainer,
    CommandCreateBufferObject,
    CommandInit,
    CommandRender,
    CommandRenderTileLayer,
    CommandUpdateViewport,
    CommmandTextureCreate,
} from './commands';
import { Vertex } from './common';
import { RunCommandReturnTypes } from './enums';
import { GLSLPrimitiveProgram, GLSLTWProgram } from './programs';

class Texture {
    constructor(
        public tex: WebGLTexture | null,
        public sampler: WebGLSampler | null,
    ) {}
}

export class BufferContainerAttribute {
    constructor(
        public dataTypeCount: number,
        public type: number,
        public normalized: boolean,
        public offset: number,

        //0: float, 1:integer
        public funcType: number,
    ) {}
}

export class BufferContainerInfo {
    constructor(
        public stride: number,
        public vertBufferBindingIndex: number,
        public attributes: BufferContainerAttribute[],
    ) {}
}

class BufferContainer {
    constructor(
        public vertexArray: WebGLVertexArrayObject | null,
        public lastIndexBufferBound: WebGLBuffer,
        public containerInfo: BufferContainerInfo,
    ) {}
}

const MAX_STREAM_BUFFER_COUNT = 10;

export class CommandWebGL2CommandProcessorFragment {
    static CMD_PRE_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL;
    static CMD_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 1;
    static CMD_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 2;
    static CMD_POST_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 3;

    primitiveProgram: GLSLPrimitiveProgram;
    primitiveProgramTextured: GLSLPrimitiveProgram;

    primitiveDrawVertex: WebGLBuffer[];
    primitiveDrawVertexTex3d: WebGLBuffer;
    primitiveDrawBufferTex3d: WebGLBuffer;
    primitiveDrawBuffer: WebGLBuffer[];
    lastStreamBuffer: number;
    textures: Texture[];
    quadDrawIndexBuffer: WebGLBuffer;
    bufferObjects: WebGLBuffer[];
    bufferContainers: BufferContainer[];

    constructor(public ctx: WebGL2RenderingContext) {}

    async cmdInit(_command: CommandInit): Promise<void> {
        this.bufferObjects = [];
        this.bufferContainers = [];
        this.ctx.activeTexture(this.ctx.TEXTURE0);

        this.primitiveProgram = new GLSLPrimitiveProgram(this.ctx);
        this.primitiveProgramTextured = new GLSLPrimitiveProgram(this.ctx);

        const buffer = this.ctx.createBuffer();
        if (!buffer) {
            throw new Error('Failed to create buffer');
        }
        this.primitiveDrawBufferTex3d = buffer;

        this.primitiveDrawBuffer = new Array(MAX_STREAM_BUFFER_COUNT);
        for (let i = 0; i < this.primitiveDrawBuffer.length; i++) {
            const buffer = this.ctx.createBuffer();
            if (!buffer) {
                throw new Error('Failed to create buffer');
            }

            this.primitiveDrawBuffer[i] = buffer;
        }

        const vertexArray = this.ctx.createVertexArray();
        if (!vertexArray) {
            throw new Error('Failed to create vertex array object');
        }
        this.primitiveDrawVertexTex3d = vertexArray;

        this.primitiveDrawVertex = new Array(MAX_STREAM_BUFFER_COUNT);
        for (let i = 0; i < this.primitiveDrawVertex.length; i++) {
            const vertexArray = this.ctx.createVertexArray();
            if (!vertexArray) {
                throw new Error('Failed to create vertex array object');
            }

            this.primitiveDrawVertex[i] = vertexArray;
        }

        for (let i = 0; i < MAX_STREAM_BUFFER_COUNT; i++) {
            this.ctx.bindBuffer(
                this.ctx.ARRAY_BUFFER,
                this.primitiveDrawBuffer[i]!,
            );
            this.ctx.bindVertexArray(this.primitiveDrawVertex[i]!);
            this.ctx.enableVertexAttribArray(0);
            this.ctx.enableVertexAttribArray(1);
            this.ctx.enableVertexAttribArray(2);

            const SIZE = 2 * 4 + 2 * 4 + 4 * 1;

            this.ctx.vertexAttribPointer(0, 2, this.ctx.FLOAT, false, SIZE, 0);
            this.ctx.vertexAttribPointer(
                1,
                2,
                this.ctx.FLOAT,
                false,
                SIZE,
                4 * 2,
            );
            this.ctx.vertexAttribPointer(
                2,
                4,
                this.ctx.UNSIGNED_BYTE,
                true,
                SIZE,
                4 * 4,
            );
        }

        this.ctx.bindVertexArray(null);

        this.lastStreamBuffer = 0;

        {
            const primitiveVertexShader = new GLSL(
                this.ctx,
                (await import('../../shaders/prim.vert?raw')).default,
                this.ctx.VERTEX_SHADER,
            );
            const primitiveFragmentShader = new GLSL(
                this.ctx,
                (await import('../../shaders/prim.frag?raw')).default,
                this.ctx.FRAGMENT_SHADER,
            );

            this.primitiveProgram.createProgram();
            this.primitiveProgram.addShader(primitiveVertexShader);
            this.primitiveProgram.addShader(primitiveFragmentShader);
            this.primitiveProgram.linkProgram();
            this.useProgram(this.primitiveProgram);
            this.primitiveProgram.locPos = this.primitiveProgram.getUniformLoc(
                this.primitiveProgram.program,
                'gPos',
            )!;
        }
        {
            const defines = {
                TW_TEXTURED: '',
            };
            const primitiveVertexShader = new GLSL(
                this.ctx,
                (await import('../../shaders/prim.vert?raw')).default,
                this.ctx.VERTEX_SHADER,
                defines,
            );
            const primitiveFragmentShader = new GLSL(
                this.ctx,
                (await import('../../shaders/prim.frag?raw')).default,
                this.ctx.FRAGMENT_SHADER,
                defines,
            );

            this.primitiveProgramTextured.createProgram();
            this.primitiveProgramTextured.addShader(primitiveVertexShader);
            this.primitiveProgramTextured.addShader(primitiveFragmentShader);
            this.primitiveProgramTextured.linkProgram();
            this.useProgram(this.primitiveProgramTextured);
            this.primitiveProgramTextured.locPos =
                this.primitiveProgramTextured.getUniformLoc(
                    this.primitiveProgramTextured.program,
                    'gPos',
                )!;
            this.primitiveProgramTextured.locTextureSampler =
                this.primitiveProgramTextured.getUniformLoc(
                    this.primitiveProgramTextured.program,
                    'gTextureSampler',
                )!;
        }

        const quadDrawIndexBuffer = this.ctx.createBuffer();
        if (!quadDrawIndexBuffer) {
            throw new Error('Failed to create buffer');
        }

        this.quadDrawIndexBuffer = quadDrawIndexBuffer;

        this.ctx.bindBuffer(
            this.ctx.ELEMENT_ARRAY_BUFFER,
            this.quadDrawIndexBuffer,
        );

        this.textures = new Array(CommandBuffer.MAX_TEXTURES)
            .fill(null)
            .map((_) => new Texture(null, null));

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

        this.ctx.bufferData(
            this.ctx.ELEMENT_ARRAY_BUFFER,
            new Uint16Array(indices),
            this.ctx.STATIC_DRAW,
        );
    }

    useProgram(program: GLSLProgram): void {
        program.useProgram();
    }

    setState(state: State, program: GLSLTWProgram): void {
        if (this.isTexturedState(state)) {
            this.ctx.bindTexture(
                this.ctx.TEXTURE_2D,
                this.textures[state.texture]!.tex,
            );
        }

        if (
            state.screenBR.x !== program.lastScreenBR.x ||
            state.screenBR.y !== program.lastScreenBR.y ||
            state.screenTL.x !== program.lastScreenTL.x ||
            state.screenTL.y !== program.lastScreenTL.y
        ) {
            program.lastScreenTL = state.screenTL.clone();
            program.lastScreenBR = state.screenBR.clone();

            const m = [
                2 / (state.screenBR.x - state.screenTL.x),
                0,
                0,
                -(
                    (state.screenBR.x + state.screenTL.x) /
                    (state.screenBR.x - state.screenTL.x)
                ),
                0,
                2 / (state.screenTL.y - state.screenBR.y),
                0,
                -(
                    (state.screenTL.y + state.screenBR.y) /
                    (state.screenTL.y - state.screenBR.y)
                ),
            ];

            this.ctx.uniformMatrix4x2fv(program.locPos, true, m);
        }
    }

    isTexturedState(state: State): boolean {
        return state.texture >= 0 && state.texture < this.textures.length;
    }

    cmdRender(command: CommandRender): void {
        let program = this.primitiveProgram;
        if (this.isTexturedState(command.state)) {
            program = this.primitiveProgramTextured;
        }

        this.useProgram(program);
        this.setState(command.state, program);
        this.uploadStreamBufferData(
            command.primType,
            command.vertices,
            command.primCount,
        );

        this.ctx.bindVertexArray(this.primitiveDrawVertex[0]!);

        switch (command.primType) {
            case CommandBuffer.PRIMTYPE_LINES:
                this.ctx.drawArrays(this.ctx.LINES, 0, command.primCount * 2);

                break;
            case CommandBuffer.PRIMTYPE_TRIANGLES:
                this.ctx.drawArrays(
                    this.ctx.TRIANGLES,
                    0,
                    command.primCount * 3,
                );

                break;
            case CommandBuffer.PRIMTYPE_QUADS:
                this.ctx.bindBuffer(
                    this.ctx.ELEMENT_ARRAY_BUFFER,
                    this.quadDrawIndexBuffer,
                );

                this.ctx.drawElements(
                    this.ctx.TRIANGLES,
                    command.primCount * 6,
                    this.ctx.UNSIGNED_SHORT,
                    0,
                );

                break;
            default:
                throw new Error(`Unkdown primtype ${command.primType}`);
        }
    }

    cmdClear(command: CommandClear): void {
        this.ctx.clearColor(
            command.color.r,
            command.color.g,
            command.color.b,
            command.color.a,
        );

        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT);
    }

    cmdUpdateViewport(command: CommandUpdateViewport): void {
        this.ctx.viewport(command.x, command.y, command.width, command.height);
    }

    cmdTextureCreate(command: CommmandTextureCreate): void {
        //TODO: resize this.textures is command.slot > this.texures.length
        this.textures[command.slot]!.tex = this.ctx.createTexture();
        this.ctx.bindTexture(
            this.ctx.TEXTURE_2D,
            this.textures[command.slot]!.tex,
        );

        const samplerSlot = 0;

        this.textures[command.slot]!.sampler = this.ctx.createSampler();
        this.ctx.bindSampler(samplerSlot, this.textures[command.slot]!.sampler);

        this.ctx.texImage2D(
            this.ctx.TEXTURE_2D,
            0,
            this.ctx.RGBA,
            command.width,
            command.height,
            0,
            this.ctx.RGBA,
            this.ctx.UNSIGNED_BYTE,
            command.data,
        );
        this.ctx.generateMipmap(this.ctx.TEXTURE_2D);
    }

    cmdCreateBufferObject(command: CommandCreateBufferObject): void {
        if (command.bufferIndex >= this.bufferObjects.length) {
            for (
                let i = this.bufferObjects.length;
                i < command.bufferIndex + 1;
                i++
            ) {
                this.bufferObjects.push(0);
            }
        }

        const buffer = this.ctx.createBuffer()!;

        this.ctx.bindBuffer(this.ctx.COPY_WRITE_BUFFER, buffer);
        this.ctx.bufferData(
            this.ctx.COPY_WRITE_BUFFER,
            command.data,
            this.ctx.STATIC_DRAW,
        );

        this.bufferObjects[command.bufferIndex] = buffer;
    }

    cmdCreateBufferContainer(command: CommandCreateBufferContainer): void {
        let index = command.bufferContainerIndex;

        if (index >= this.bufferContainers.length) {
            for (let i = this.bufferContainers.length; i < index + 1; i++) {
                this.bufferContainers.push(
                    new BufferContainer(
                        -1,
                        -1,
                        new BufferContainerInfo(0, -1, []),
                    ),
                );
            }
        }

        const bufferContainer = this.bufferContainers[index]!;
        bufferContainer.vertexArray = this.ctx.createVertexArray()!;
        bufferContainer.lastIndexBufferBound = 0;

        this.ctx.bindVertexArray(bufferContainer.vertexArray);

        for (let i = 0; i < command.attributes.length; i++) {
            this.ctx.enableVertexAttribArray(i);
            this.ctx.bindBuffer(
                this.ctx.ARRAY_BUFFER,
                this.bufferObjects[command.vertBufferBindingIndex]!,
            );
            const attr = command.attributes[i]!;

            if (attr.funcType === 0) {
                this.ctx.vertexAttribPointer(
                    i,
                    attr.dataTypeCount,
                    attr.type,
                    attr.normalized,
                    command.stride,
                    attr.offset,
                );
            } else if (attr.funcType === 1) {
                this.ctx.vertexAttribIPointer(
                    i,
                    attr.dataTypeCount,
                    attr.type,
                    command.stride,
                    attr.offset,
                );
            }

            bufferContainer.containerInfo.attributes.push(attr);
        }

        bufferContainer.containerInfo.vertBufferBindingIndex =
            command.vertBufferBindingIndex;
        bufferContainer.containerInfo.stride = command.stride;
    }

    cmdRenderTileLayer(command: CommandRenderTileLayer): void {
        const index = command.bufferContainerIndex;

        if (index >= this.bufferContainers.length) {
            return;
        }

        const bufferContainer = this.bufferContainers[index]!;

        if (
            bufferContainer.vertexArray === null ||
            command.indicesDrawNum === 0
        ) {
            return;
        }

        let program = this.primitiveProgram;
        this.setState(command.state, program);

        if (bufferContainer.lastIndexBufferBound != this.quadDrawIndexBuffer) {
            this.ctx.bindBuffer(
                this.ctx.ELEMENT_ARRAY_BUFFER,
                this.quadDrawIndexBuffer,
            );
            bufferContainer.lastIndexBufferBound = this.quadDrawIndexBuffer;
        }

        for (let i = 0; i < command.indicesDrawNum; i++) {
            this.ctx.drawElements(
                this.ctx.TRIANGLES,
                command.drawCount[i]!,
                this.ctx.UNSIGNED_INT,
                command.indicesOffsets[i]!,
            );
        }
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
            case CommandBufferCMD.CMD_UPDATE_VIEWPORT:
                this.cmdUpdateViewport(baseCommand as CommandUpdateViewport);
                break;
            case CommandBufferCMD.CMD_TEXTURE_CREATE:
                this.cmdTextureCreate(baseCommand as CommmandTextureCreate);
                break;
            case CommandBufferCMD.CMD_CREATE_BUFFER_OBJECT:
                this.cmdCreateBufferObject(
                    baseCommand as CommandCreateBufferObject,
                );
                break;
            case CommandBufferCMD.CMD_CREATE_BUFFER_CONTAINER:
                this.cmdCreateBufferContainer(
                    baseCommand as CommandCreateBufferContainer,
                );
                break;
        }

        return RunCommandReturnTypes.RUN_COMMAND_COMMAND_HANDLED;
    }

    uploadStreamBufferData(
        primitiveType: number,
        vertices: Vertex[],
        primitiveCount: number,
        asTex3d = false,
    ): void {
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
            this.ctx.bindBuffer(
                this.ctx.ARRAY_BUFFER,
                this.primitiveDrawBufferTex3d,
            );
        } else {
            this.ctx.bindBuffer(
                this.ctx.ARRAY_BUFFER,
                this.primitiveDrawBuffer[this.lastStreamBuffer]!,
            );
        }

        const SIZE = 4 * 2 + 4 * 2 + 4 * 1;
        const buffer = new ArrayBuffer(vertices.length * SIZE);
        const dv = new DataView(buffer);

        for (let i = 0; i < vertices.length; i++) {
            dv.setFloat32(SIZE * i, vertices[i]!.pos.x, true);
            dv.setFloat32(SIZE * i + 4, vertices[i]!.pos.y, true);

            dv.setFloat32(SIZE * i + 8, vertices[i]!.tex.u, true);
            dv.setFloat32(SIZE * i + 12, vertices[i]!.tex.v, true);

            dv.setUint8(SIZE * i + 16, vertices[i]!.color.r);
            dv.setUint8(SIZE * i + 17, vertices[i]!.color.g);
            dv.setUint8(SIZE * i + 18, vertices[i]!.color.b);
            dv.setUint8(SIZE * i + 19, vertices[i]!.color.a);
        }

        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, dv, this.ctx.STREAM_DRAW);
    }
}
