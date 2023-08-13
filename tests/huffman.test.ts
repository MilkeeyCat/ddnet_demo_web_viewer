import { Huffman } from '../src/huffman';
import { FREQUENCIES } from '../src/huffman/frequencies';

test('huffman correctness', () => {
    const huffman = Huffman.fromFrequencies(FREQUENCIES);
    const array = [
        0b1011_0001, 0b0000_1000, 0b0010_1010, 0b0110_1110, 0b0000_0000,
    ];

    const decoded = huffman.decompress(Uint8Array.from(array));

    expect(decoded).toStrictEqual(
        Uint8Array.from([
            0b0000_0000, 0b0000_0001, 0b0000_0000, 0b0000_0010, 0b0000_0000,
            0b10000000, 0b0000_0000,
        ]),
    );
});
