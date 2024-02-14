export function arrayChunks<T extends Uint8Array | Int32Array>(
    arr: T,
    size: number,
): T[] {
    const chunks: T[] = [];
    for (let i = 0; i < arr.length; i += size) {
        const chunk = arr.slice(i, i + size);
        chunks.push(chunk as T);
    }

    return chunks;
}
