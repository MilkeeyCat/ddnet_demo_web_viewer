export class Message {
    data: Uint8Array;

    constructor(bytes: Uint8Array) {
        this.data = bytes;
    }
}
