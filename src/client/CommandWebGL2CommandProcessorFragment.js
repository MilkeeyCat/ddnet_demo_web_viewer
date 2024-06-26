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
    CommandIndicesRequiredNumNotify,
    CommandInit,
    CommandRender,
    CommandRenderTileLayer,
    CommandUpdateViewport,
    CommmandTextureCreate,
} from './commands';
import { Vertex } from './common';
import { RunCommandReturnTypes } from './enums';
import {
    GLSLPrimitiveProgram,
    GLSLTWProgram,
    GLSLTileProgram,
} from './programs';

class Texture {
    /**
     * @param {?WebGLTexture} tex
     * @param {?WebGLSampler} sampler
     */
    constructor(tex, sampler) {
        /** @type {?WebGLTexture} */
        this.tex = tex;
        /** @type {?WebGLSampler} */
        this.sampler = sampler;
    }
}

export class BufferContainerAttribute {
    /**
     * @param {number} dataTypeCount
     * @param {number} type
     * @param {boolean} normalized
     * @param {number} offset
     * @param {number} funcType 0 - float, 1 - integer
     */
    constructor(
        dataTypeCount,
        type,
        normalized,
        offset,
        funcType,
    ) {
        /** @type number */
        this.dataTypeCount = dataTypeCount;
        /** @type number */
        this.type = type;
        /** @type boolean */
        this.normalized = normalized;
        /** @type number */
        this.offset = offset;
        /** @type number */
        this.funcType = funcType;
    }
}

export class BufferContainerInfo {
    /**
     * @param {number} stride
     * @param {number} vertBufferBindingIndex
     * @param {BufferContainerAttribute[]} attributes
     */
    constructor(stride, vertBufferBindingIndex, attributes) {
        /** @type {number} */
        this.stride = stride;
        /** @type {number} */
        this.vertBufferBindingIndex = vertBufferBindingIndex;
        /** @type {BufferContainerAttribute[]} */
        this.attributes = attributes;
    }
}

class BufferContainer {
    /**
     * @param {?WebGLVertexArrayObject} vertexArray
     * @param {WebGLBuffer} lastIndexBufferBound
     * @param {BufferContainerInfo} containerInfo
     */
    constructor(vertexArray, lastIndexBufferBound, containerInfo) {
        /** @type {?WebGLVertexArrayObject} */
        this.vertexArray = vertexArray;
        /** @type {WebGLBuffer} */
        this.lastIndexBufferBound = lastIndexBufferBound;
        /** @type {BufferContainerInfo} */
        this.containerInfo = containerInfo;
    }
}

const MAX_STREAM_BUFFER_COUNT = 10;

export class CommandWebGL2CommandProcessorFragment {
    static CMD_PRE_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL;
    static CMD_INIT = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 1;
    static CMD_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 2;
    static CMD_POST_SHUTDOWN = CommandBufferCMD.CMDGROUP_PLATFORM_GL + 3;

    /** @param {WebGL2RenderingContext} ctx */
    constructor(ctx) {
        this.ctx = ctx;
    }

    /** @param {CommandInit} _command */
    async cmdInit(_command) {
        /** @type {WebGLBuffer[]} */
        this.bufferObjects = [];
        /** @type {BufferContainer[]} */
        this.bufferContainers = [];

        this.ctx.activeTexture(this.ctx.TEXTURE0);

        /** @type {GLSLPrimitiveProgram} */
        this.primitiveProgram = new GLSLPrimitiveProgram(this.ctx);
        /** @type {GLSLPrimitiveProgram} */
        this.primitiveProgramTextured = new GLSLPrimitiveProgram(this.ctx);
        /** @type {GLSLTileProgram} */
        this.tileProgram = new GLSLTileProgram(this.ctx);

        const buffer = this.ctx.createBuffer();
        if (!buffer) {
            throw new Error('Failed to create buffer');
        }
        /** @type {WebGLBuffer} */
        this.primitiveDrawBufferTex3d = buffer;
        /** @type {WebGLBuffer[]} */
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
        /** @type {WebGLBuffer} */
        this.primitiveDrawVertexTex3d = vertexArray;
        /** @type {WebGLBuffer[]} */
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
                this.primitiveDrawBuffer[i],
            );
            this.ctx.bindVertexArray(this.primitiveDrawVertex[i]);
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

        /** @type {number} */
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
            );
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
                );
            this.primitiveProgramTextured.locTextureSampler =
                this.primitiveProgramTextured.getUniformLoc(
                    this.primitiveProgramTextured.program,
                    'gTextureSampler',
                );
        }

        {
            const vertexShader = new GLSL(
                this.ctx,
                (await import('../../shaders/tile.vert?raw')).default,
                this.ctx.VERTEX_SHADER,
            );
            const fragmentShader = new GLSL(
                this.ctx,
                (await import('../../shaders/tile.frag?raw')).default,
                this.ctx.FRAGMENT_SHADER,
            );

            this.tileProgram.createProgram();
            this.tileProgram.addShader(vertexShader);
            this.tileProgram.addShader(fragmentShader);
            this.tileProgram.linkProgram();

            this.useProgram(this.tileProgram);

            this.tileProgram.locPos = this.tileProgram.getUniformLoc(
                this.tileProgram.program,
                'gPos',
            );
            this.tileProgram.locColor = this.tileProgram.getUniformLoc(
                this.tileProgram.program,
                'gVertColor',
            );
        }

        const quadDrawIndexBuffer = this.ctx.createBuffer();
        if (!quadDrawIndexBuffer) {
            throw new Error('Failed to create buffer');
        }
        /** @type {WebGLBuffer} */
        this.quadDrawIndexBuffer = quadDrawIndexBuffer;

        this.ctx.bindBuffer(
            this.ctx.ELEMENT_ARRAY_BUFFER,
            this.quadDrawIndexBuffer,
        );

        /** @type {Texture[]} */
        this.textures = new Array(CommandBuffer.MAX_TEXTURES)
            .fill(null)
            .map(() => new Texture(null, null));

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
            new Uint32Array(indices),
            this.ctx.STATIC_DRAW,
        );

        /** @type {number} */
        this.currentIndicesInBuffer = (CommandBuffer.MAX_VERTICES / 4) * 6;
    }

    /** @param {GLSLProgram} program */
    useProgram(program) {
        program.useProgram();
    }

    /**
     * @param {State} state
     * @param {GLSLTWProgram} program
     */
    setState(state, program) {
        if (this.isTexturedState(state)) {
            this.ctx.bindTexture(
                this.ctx.TEXTURE_2D,
                this.textures[state.texture].tex,
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

    /**
     * @param {State} state
     * @returns {boolean}
     */
    isTexturedState(state) {
        return state.texture >= 0 && state.texture < this.textures.length;
    }

    /** @param {CommandRender} command */
    cmdRender(command) {
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

        this.ctx.bindVertexArray(this.primitiveDrawVertex[0]);

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
                    this.ctx.UNSIGNED_INT,
                    0,
                );

                break;
            default:
                throw new Error(`Unkdown primtype ${command.primType}`);
        }
    }

    /** @param {CommandClear} command */
    cmdClear(command) {
        this.ctx.clearColor(
            command.color.r,
            command.color.g,
            command.color.b,
            command.color.a,
        );

        this.ctx.clear(this.ctx.COLOR_BUFFER_BIT | this.ctx.DEPTH_BUFFER_BIT);
    }

    /** @param {CommandUpdateViewport} command */
    cmdUpdateViewport(command) {
        this.ctx.viewport(command.x, command.y, command.width, command.height);
    }

    /** @param {CommmandTextureCreate} command */
    cmdTextureCreate(command) {
        //TODO: resize this.textures is command.slot > this.texures.length
        this.textures[command.slot].tex = this.ctx.createTexture();
        this.ctx.bindTexture(
            this.ctx.TEXTURE_2D,
            this.textures[command.slot].tex,
        );

        const samplerSlot = 0;

        this.textures[command.slot].sampler = this.ctx.createSampler();
        this.ctx.bindSampler(samplerSlot, this.textures[command.slot].sampler);

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

    /** @param {CommandCreateBufferObject} command */
    cmdCreateBufferObject(command) {
        if (command.bufferIndex >= this.bufferObjects.length) {
            for (
                let i = this.bufferObjects.length;
                i < command.bufferIndex + 1;
                i++
            ) {
                this.bufferObjects.push(-1);
            }
        }

        const buffer = this.ctx.createBuffer();

        this.ctx.bindBuffer(this.ctx.COPY_WRITE_BUFFER, buffer);
        this.ctx.bufferData(
            this.ctx.COPY_WRITE_BUFFER,
            command.data,
            this.ctx.STATIC_DRAW,
        );

        this.bufferObjects[command.bufferIndex] = buffer;
    }

    /** @param {CommandCreateBufferContainer} command */
    cmdCreateBufferContainer(command) {
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

        const bufferContainer = this.bufferContainers[index];
        bufferContainer.vertexArray = this.ctx.createVertexArray();
        bufferContainer.lastIndexBufferBound = 0;

        this.ctx.bindVertexArray(bufferContainer.vertexArray);

        for (let i = 0; i < command.attributes.length; i++) {
            this.ctx.enableVertexAttribArray(i);
            this.ctx.bindBuffer(
                this.ctx.ARRAY_BUFFER,
                this.bufferObjects[command.vertBufferBindingIndex],
            );
            const attr = command.attributes[i];

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

    /** @param {CommandRenderTileLayer} command */
    cmdRenderTileLayer(command) {
        const index = command.bufferContainerIndex;

        if (index >= this.bufferContainers.length) {
            return;
        }

        const bufferContainer = this.bufferContainers[index];

        if (
            bufferContainer.vertexArray === null ||
            command.indicesDrawNum === 0
        ) {
            return;
        }

        let program = this.tileProgram;

        this.useProgram(program);
        this.setState(command.state, program);
        program.setUniformVec4(
            program.locColor,
            new Float32Array(command.color.toArray()),
        );

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
                command.drawCount[i],
                this.ctx.UNSIGNED_INT,
                command.indicesOffsets[i],
            );
        }
    }

    /** @param {CommandIndicesRequiredNumNotify} command */
    cmdIndicesRequiredNumNotify(command) {
        if (command.requiredIndicesNum > this.currentIndicesInBuffer) {
            const addCount =
                command.requiredIndicesNum - this.currentIndicesInBuffer;
            /** @type {number[]} */
            const indices = new Array(addCount);
            let primq = (this.currentIndicesInBuffer / 6) * 4;

            for (let i = 0; i < addCount; i += 6) {
                indices[i] = primq;
                indices[i + 1] = primq + 1;
                indices[i + 2] = primq + 2;
                indices[i + 3] = primq;
                indices[i + 4] = primq + 2;
                indices[i + 5] = primq + 3;
                primq += 4;
            }

            this.ctx.bindBuffer(
                this.ctx.COPY_READ_BUFFER,
                this.quadDrawIndexBuffer,
            );
            const newIndexBuffer = this.ctx.createBuffer();
            this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, newIndexBuffer);
            this.ctx.bufferData(
                this.ctx.ELEMENT_ARRAY_BUFFER,
                command.requiredIndicesNum * 4,
                this.ctx.STATIC_DRAW,
            );
            this.ctx.copyBufferSubData(
                this.ctx.COPY_READ_BUFFER,
                this.ctx.ELEMENT_ARRAY_BUFFER,
                0,
                0,
                this.currentIndicesInBuffer * 4,
            );
            this.ctx.bufferSubData(
                this.ctx.ELEMENT_ARRAY_BUFFER,
                this.currentIndicesInBuffer * 4,
                new Uint32Array(indices),
            );
            this.ctx.bindBuffer(this.ctx.ELEMENT_ARRAY_BUFFER, null);
            this.ctx.bindBuffer(this.ctx.COPY_READ_BUFFER, null);

            this.ctx.deleteBuffer(this.quadDrawIndexBuffer);
            this.quadDrawIndexBuffer = newIndexBuffer;

            this.currentIndicesInBuffer = command.requiredIndicesNum;
        }
    }

    /**
     * @param {Command} baseCommand
     * @returns {Promise<RunCommandReturnTypes>}
     */
    async runCommand(baseCommand) {
        switch (baseCommand.cmd) {
            case CommandWebGL2CommandProcessorFragment.CMD_INIT:
                await this.cmdInit(baseCommand);
                break;
            case CommandBufferCMD.CMD_RENDER:
                this.cmdRender(baseCommand);
                break;
            case CommandBufferCMD.CMD_CLEAR:
                this.cmdClear(baseCommand);
                break;
            case CommandBufferCMD.CMD_UPDATE_VIEWPORT:
                this.cmdUpdateViewport(baseCommand);
                break;
            case CommandBufferCMD.CMD_TEXTURE_CREATE:
                this.cmdTextureCreate(baseCommand);
                break;
            case CommandBufferCMD.CMD_CREATE_BUFFER_OBJECT:
                this.cmdCreateBufferObject(baseCommand);
                break;
            case CommandBufferCMD.CMD_CREATE_BUFFER_CONTAINER:
                this.cmdCreateBufferContainer(baseCommand);
                break;
            case CommandBufferCMD.CMD_RENDER_TILE_LAYER:
                this.cmdRenderTileLayer(baseCommand);
                break;
            case CommandBufferCMD.CMD_INDICES_REQUIRED_NUM_NOTIFY:
                this.cmdIndicesRequiredNumNotify(baseCommand);
                break;
        }

        return RunCommandReturnTypes.RUN_COMMAND_COMMAND_HANDLED;
    }

    /**
        * @param {number} primitiveType
        * @param {Vertex[]} vertices
        * @param {number} primitiveCount
        * @param {boolean} [asTex3d = false]
        */
    uploadStreamBufferData(
        primitiveType,
        vertices,
        primitiveCount,
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
            this.ctx.bindBuffer(
                this.ctx.ARRAY_BUFFER,
                this.primitiveDrawBufferTex3d,
            );
        } else {
            this.ctx.bindBuffer(
                this.ctx.ARRAY_BUFFER,
                this.primitiveDrawBuffer[this.lastStreamBuffer],
            );
        }

        const SIZE = 4 * 2 + 4 * 2 + 4 * 1;
        const buffer = new ArrayBuffer(vertices.length * SIZE);
        const dv = new DataView(buffer);

        for (let i = 0; i < vertices.length; i++) {
            dv.setFloat32(SIZE * i, vertices[i].pos.x, true);
            dv.setFloat32(SIZE * i + 4, vertices[i].pos.y, true);

            dv.setFloat32(SIZE * i + 8, vertices[i].tex.u, true);
            dv.setFloat32(SIZE * i + 12, vertices[i].tex.v, true);

            dv.setUint8(SIZE * i + 16, vertices[i].color.r);
            dv.setUint8(SIZE * i + 17, vertices[i].color.g);
            dv.setUint8(SIZE * i + 18, vertices[i].color.b);
            dv.setUint8(SIZE * i + 19, vertices[i].color.a);
        }

        this.ctx.bufferData(this.ctx.ARRAY_BUFFER, dv, this.ctx.STREAM_DRAW);
    }
}
