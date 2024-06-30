//NOTE: this shit will probably slowdown the program
//I better remove this stuff in prod build

/** @param {WebGL2RenderingContext} gl */
function glClearErrors(gl) {
    while (gl.getError() != gl.NO_ERROR);
}

/**
 * @param {WebGL2RenderingContext} gl
 * @returns {boolean}
 */
function glGetError(gl) {
    const error = gl.getError();
    if (error != gl.NO_ERROR) {
        throw new Error('Error lmao: 0x' + error.toString(16));
    }

    return true;
}

/**
 * @template T
 * @callback DbgCallback
 * @param {...any} args
 * @returns {T}
 */

/**
 * @template T
 * @param {WebGL2RenderingContext} gl
 * @param {DbgCallback<T>} fn
 * @returns {T}
 */
export function glDbg(gl, fn) {
    glClearErrors(gl);
    const res = fn();
    glGetError(gl);
    return res;
}
