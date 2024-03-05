import { Uuid } from '../uuid';

export class Reader {
    constructor(public data: Uint8Array) {}

    private next(): number | null {
        let result = this.data[0];

        this.data = this.data.subarray(1);

        return result || null;
    }

    public readRaw(n: number): Uint8Array {
        const result = [];

        for (let i = 0; i < n; i++) {
            //NOTE: maybe this will cause crashes in future (maybe not)
            result.push(this.data[i]!);
        }

        this.data = this.data.subarray(n);

        return new Uint8Array(result);
    }

    public readInt(): number {
        let result = 0;

        let src = this.next()!;

        let sign = (src >> 6) & 1;

        result |= src & 0b0011_1111;

        for (let i = 0; i < 4; i++) {
            if ((src & 0b1000_0000) == 0) {
                break;
            }

            src = this.next()!;
            result |= (src & 0b0111_1111) << (6 + 7 * i);
        }

        result ^= -sign;

        return result;
    }

    public readString(): Uint8Array {
        const result = [];

        for (const [i, byte] of this.data.entries()) {
            if (byte == 0) {
                this.data = this.data.subarray(i + 1);
                break;
            }

            result.push(byte);
        }

        return new Uint8Array(result);
    }

    public readUuid(): Uuid {
        return new Uuid(this.readRaw(16));
    }

    public readLeI32(): number {
        const bytes = this.readRaw(4);

        return (
            (bytes[3]! << 24) | (bytes[2]! << 16) | (bytes[1]! << 8) | bytes[0]!
        );
    }

    public readBeI32(): number {
        const bytes = this.readRaw(4);

        return (
            (bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!
        );
    }
}
