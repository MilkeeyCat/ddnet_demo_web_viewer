import { Unpacker } from '../src/unpacker';
import { Uuid } from '../src/uuid';

describe('unpacker', () => {
    test('read raw', () => {
        const u = new Unpacker(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
        const rawBytes = u.readRaw(5);

        expect(rawBytes).toStrictEqual(new Uint8Array([1, 2, 3, 4, 5]));
        expect(u.data).toStrictEqual(new Uint8Array([6, 7, 8, 9, 10]));
    });

    test('read int', () => {
        const u = new Unpacker(new Uint8Array([152, 148, 232, 148, 15]));
        let int = u.readInt();

        expect(int).toBe(2035090712);
    });

    test('read string', () => {
        const u = new Unpacker(new Uint8Array([108, 111, 108, 0, 123, 1, 11]));
        const stringBytes = u.readString();
        const textDecoder = new TextDecoder();

        expect(textDecoder.decode(stringBytes)).toBe('lol');
        expect(u.data).toStrictEqual(new Uint8Array([123, 1, 11]));
    });

    test('read uuid', () => {
        const u = new Unpacker(
            new Uint8Array([
                160, 145, 150, 26, 149, 232, 55, 68, 187, 96, 94, 172, 155, 213,
                99, 198, 1, 2, 3, 4, 5,
            ]),
        );

        const uuid = u.readUuid();

        expect(uuid).toStrictEqual(
            Uuid.fromU32([0xa091961a, 0x95e83744, 0xbb605eac, 0x9bd563c6]),
        );
        expect(u.data).toStrictEqual(new Uint8Array([1, 2, 3, 4, 5]));
    });
});
