import { Reader } from '../reader';

export class SnapshotDelta {
    constructor(bytes: Uint8Array) {
        const reader = new Reader(bytes);

        const numRemovedItems = reader.readInt();
        const numItemDeltas = reader.readInt();
        const zero = reader.readInt(); //NOTE: this thing is also called as numTempItems in ddnet source code
    }
}
