//fun fact JS cant work with 128 bits numbers. :madge: just gonna use 32 instead

export class Uuid {
    /** @param {Uint8Array} bytes */
    constructor(bytes) {
        /** @type {Uint8Array} */
        this.bytes = bytes;
    }

    /**
     * @param {[number, number, number, number]} data
     * @returns {Uuid}
     */
    static fromU32(data) {
        return new Uuid(
            new Uint8Array([
                data[0] >> 24,
                data[0] >> 16,
                data[0] >> 8,
                data[0],
                data[1] >> 24,
                data[1] >> 16,
                data[1] >> 8,
                data[1],
                data[2] >> 24,
                data[2] >> 16,
                data[2] >> 8,
                data[2],
                data[3] >> 24,
                data[3] >> 16,
                data[3] >> 8,
                data[3],
            ]),
        );
    }
}
