import { Reader } from "../reader";

export class SnapshotDelta {
    constructor(bytes: Uint8Array) {
        const reader = new Reader(bytes);

        //@ts-ignore
        const numRemovedItems = reader.readInt();
        //@ts-ignore
        const numItemDeltas = reader.readInt();
        //@ts-ignore
        const zero = reader.readInt(); //NOTE: this thing is also called as numTempItems in ddnet source code
    }
}
