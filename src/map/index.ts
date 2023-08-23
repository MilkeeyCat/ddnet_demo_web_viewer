import { Reader } from "../reader";

type VersionHeader = {
    magic: [number, number, number, number];
    version: number;
};

type Header = {
    size: number;
    swaplen: number;
    numItemTypes: number;
    numItems: number;
    numData: number;
    itemSize: number;
    dataSize: number;
};

type ItemType = {
    typeId: number;
    start: number;
    num: number;
}

export class Map {
    versionHeader: VersionHeader;
    header: Header;
    itemTypes: ItemType[];

    constructor(bytes: Uint8Array) {
        // const textDecoder = new TextDecoder();
        const reader = new Reader(bytes);
        this.itemTypes = [];

        this.versionHeader = {
            magic: Array.from(reader.readRaw(4)) as [
                number,
                number,
                number,
                number,
            ],
            version: reader.readLeI32(),
        };

        this.header = {
            size: reader.readLeI32(),
            swaplen: reader.readLeI32(),
            numItemTypes: reader.readLeI32(),
            numItems: reader.readLeI32(),
            numData: reader.readLeI32(),
            itemSize: reader.readLeI32(),
            dataSize: reader.readLeI32(),
        };

        for (let i = 0; i < this.header.numItemTypes; i++) {
            this.itemTypes.push({
                typeId: reader.readLeI32() & 0xffff,
                start: reader.readLeI32(),
                num: reader.readLeI32(),
            });
        }

        console.log('Items offsets', reader.readLeI32());
        console.log('Data offsets', reader.readLeI32());
        console.log('Data sizes', reader.readLeI32());
    }
}
