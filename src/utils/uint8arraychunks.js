/**
 * @template {Uint8Array | Int32Array} T
 * @param {T} arr
 * @param {number} size
 * @returns {T[]}
 */
export function arrayChunks(arr, size) {
    /** @type {T[]} */
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        const chunk = arr.slice(i, i + size);
        chunks.push(/** @type {T} */ (chunk));
    }

    return chunks;
}
