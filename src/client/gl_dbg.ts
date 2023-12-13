type Context = WebGL2RenderingContext;

function glClearErrors(gl: Context) {
    while (gl.getError() != gl.NO_ERROR);
}

function glGetError(gl: Context): boolean {
    const error = gl.getError();

    if (error != gl.NO_ERROR) {
        throw new Error("Error lmao: 0x" + error.toString(16));
    }

    return true;
}

export function glDbg<T>(gl: Context, fn: (...args: any[]) => T): T {
    glClearErrors(gl);
    const res = fn();
    glGetError(gl);
    return res;
}
