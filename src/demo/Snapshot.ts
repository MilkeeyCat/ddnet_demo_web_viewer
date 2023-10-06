import { Reader } from "../reader";

type Snap = {
    id: number;
    type: number;
    data: Int32Array;
}

export class Snapshot {
    numItems: number;
    dataSize: number;
    offsets: number[];
    snaps: Snap[];

    constructor(bytes: Uint8Array) {
        const reader = new Reader(bytes);
        this.offsets = [];
        this.snaps = [];

        this.dataSize = reader.readInt();
        this.numItems = reader.readInt();

        for (let i = 0; i < this.numItems; i++) {
            this.offsets.push(reader.readInt());
        }

        for (let i = 0; i < this.numItems; i++) {
            const typeAndId = reader.readInt();
            const type = typeAndId >> 16;
            const id = typeAndId & 0xffff;
            const data: number[] = [];
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

    calcSize(index: number): number {
        const CSNAPSHOTITEM_SIZE = 4;
        const INT_SIZE = 4;

        if (index == this.numItems - 1) {
            return (
                (this.dataSize - this.offsets[index]! - CSNAPSHOTITEM_SIZE) / INT_SIZE
            );
        }

        return (
            (this.offsets[index + 1]! - this.offsets[index]! - CSNAPSHOTITEM_SIZE) / INT_SIZE
        );
    }
}
