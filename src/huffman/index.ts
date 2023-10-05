export class Bits {
    byte: number;
    remainingBits: number;

    constructor(byte: number) {
        this.byte = byte;
        this.remainingBits = 8;
    }

    [Symbol.iterator]() {
        let byte = this.byte;
        let remainingBits = this.remainingBits;

        return {
            next() {
                if (remainingBits === 0) {
                    return {
                        done: true,
                    };
                }

                remainingBits -= 1;

                let bit = (byte & 1) !== 0;
                byte >>= 1;

                return {
                    value: bit,
                    next: true,
                };
            },
        };
    }
}

class Frequency {
    constructor(
        public frequency: number,
        public nodeId: number
    ) { }
}

class Node {
    children: [number, number];

    constructor(nodeId1: number, nodeId2: number) {
        this.children = [nodeId1, nodeId2];
    }
}

const EOF = 256;
const NUM_SYMBOLS = EOF + 1;
const NUM_NODES = NUM_SYMBOLS * 2 - 1;
const ROOT_ID = NUM_NODES - 1;

export class Huffman {
    constructor(
        public nodes: Node[]
    ) { }

    static fromFrequencies(data: number[]): Huffman {
        const frequencies = data.map(
            (frequency, id) => new Frequency(frequency, id),
        );

        frequencies.push(new Frequency(1, EOF));

        const nodes: Node[] = [];

        for (let i = 0; i < NUM_SYMBOLS; i++) {
            nodes.push(new Node(0, 0));
        }

        while (frequencies.length > 1) {
            frequencies.sort((a, b) => (a.frequency <= b.frequency ? 1 : -1));

            const freq1 = frequencies.pop()!;
            const freq2 = frequencies.pop()!;

            const node = new Node(freq1.nodeId, freq2.nodeId);
            const freq = new Frequency(
                freq1.frequency + freq2.frequency,
                nodes.length,
            );

            frequencies.push(freq);
            nodes.push(node);
        }

        return new Huffman(nodes);
    }

    public getNode(id: number): Node | null {
        if (id >= NUM_SYMBOLS) {
            return this.nodes[id]!;
        } else {
            return null;
        }
    }

    public decompress(data: Uint8Array): Uint8Array {
        const res: number[] = [];

        const root = this.getNode(ROOT_ID)!;
        let node = root;

        let i = 0;

        deez: while (true) {
            if (i > data.length + 10) break;

            const byte = data[i] || 0;
            i++;
            const bits = new Bits(byte);

            for (const bit of bits) {
                const nodeId = node.children[+bit!]!;
                const n = this.getNode(nodeId);

                if (n !== null) {
                    node = n;
                } else {
                    if (nodeId == EOF) {
                        break deez;
                    }

                    res.push(nodeId);
                    node = root;
                }
            }
        }

        return Uint8Array.from(res);
    }
}
