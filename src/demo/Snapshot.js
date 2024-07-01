import { Reader } from '../reader';

/**
 * @typedef {Object} Snap
 * @property {number} id
 * @property {number} type
 * @property {Int32Array} data
 */

export class Snapshot {
    /** @param {Uint8Array} bytes */
    constructor(bytes) {
        const reader = new Reader(bytes);
        /** @type {number[]} */
        this.offsets = [];
        /** @type {Snap[]} */
        this.snaps = [];

        /** @type {number} */
        this.dataSize = reader.readInt();
        /** @type {number} */
        this.numItems = reader.readInt();

        for (let i = 0; i < this.numItems; i++) {
            this.offsets.push(reader.readInt());
        }

        for (let i = 0; i < this.numItems; i++) {
            const typeAndId = reader.readInt();
            const type = typeAndId >> 16;
            const id = typeAndId & 0xffff;
            /** @type {number[]} */
            const data = [];
            /** @type {number} */
            const size = this.calcSize(i);

            for (let j = 0; j < size; j++) {
                data.push(reader.readInt());
            }

            this.snaps.push({
                id,
                type,
                data: new Int32Array(data),
            });
        }
    }

    /**
     * @param {number} index
     * @returns {number}
     */
    calcSize(index) {
        const CSNAPSHOTITEM_SIZE = 4;
        const INT_SIZE = 4;

        if (index == this.numItems - 1) {
            return (
                (this.dataSize - this.offsets[index] - CSNAPSHOTITEM_SIZE) /
                INT_SIZE
            );
        }

        return (
            (this.offsets[index + 1] -
                this.offsets[index] -
                CSNAPSHOTITEM_SIZE) /
            INT_SIZE
        );
    }
}
