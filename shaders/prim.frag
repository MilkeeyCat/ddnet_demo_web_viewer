#version 300 es

precision highp float;
precision highp sampler2D;
precision highp sampler3D;
precision highp samplerCube;
precision highp samplerCubeShadow;
precision highp sampler2DShadow;
precision highp sampler2DArray;
precision highp sampler2DArrayShadow;

// uniform sampler2D gTextureSampler;

// there was noperspective. was it important? we will see
in vec2 texCoord;
in vec4 vertColor;

out vec4 FragClr;

void main() {
    //#ifdef TW_TEXTURED
    //	vec4 tex = texture(gTextureSampler, texCoord);
    //	FragClr = tex * vertColor;
    //#else
    	FragClr = vertColor;
    //#endif
}
