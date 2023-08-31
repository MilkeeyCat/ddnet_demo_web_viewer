import { inflate } from 'pako';
import { Reader } from '../reader';
import { Uuid } from '../uuid';
import { splitArray } from '../utils/splitArray';

class Item {
    constructor(public id: number, public itemData: Int32Array) { }
}

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
};

const textDecoder = new TextDecoder();

export class RawDatafile {
    versionHeader: VersionHeader;
    header: Header;
    itemTypes: ItemType[];
    items: {
        header: { id: number; typeId: number; size: number };
        data: Int32Array;
    }[];
    dataSizes: number[] | null = null;
    dataItems: Uint8Array[];

    constructor(bytes: Uint8Array) {
        const reader = new Reader(bytes);
        const itemOffsets: number[] = [];
        const dataOffsets: number[] = [];

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

        this.itemTypes = [];
        for (let i = 0; i < this.header.numItemTypes; i++) {
            this.itemTypes.push({
                typeId: reader.readLeI32() & 0xffff,
                start: reader.readLeI32(),
                num: reader.readLeI32(),
            });
        }

        for (let i = 0; i < this.header.numItems; i++) {
            itemOffsets.push(reader.readLeI32());
        }

        for (let i = 0; i < this.header.numData; i++) {
            dataOffsets.push(reader.readLeI32());
        }

        if (this.versionHeader.version >= 4) {
            this.dataSizes = [];

            for (let i = 0; i < this.header.numData; i++) {
                this.dataSizes.push(reader.readLeI32());
            }
        }

        this.items = [];

        for (const item of this.itemTypes) {
            for (let i = 0; i < item.num; i++) {
                const key = reader.readLeI32();
                const size = reader.readLeI32();
                const data: number[] = [];

                for (let i = 0; i < size / 4; i++) {
                    data.push(reader.readLeI32());
                }

                this.items.push({
                    header: {
                        id: key & 0xffff,
                        typeId: (key >> 16) & 0xffff,
                        size,
                    },
                    data: new Int32Array(data),
                });
            }
        }

        this.dataItems = [];

        for (let i = 1; i < dataOffsets.length; i++) {
            const size = dataOffsets[i]! - dataOffsets[i - 1]!;

            this.dataItems.push(reader.readRaw(size));
        }

        this.dataItems.push(
            reader.readRaw(
                this.header.dataSize - dataOffsets[dataOffsets.length - 1]!,
            ),
        );
    }
}

export class Datafile {
    items: Map<number, Item[]>;
    dataItems: [Uint8Array, number][];

    constructor(rawDatafile: RawDatafile) {
        this.items = new Map();
        this.dataItems = [];

        for (let itemType of rawDatafile.itemTypes) {
            const start = itemType.start;
            const end = itemType.start + itemType.num;
            const selectedItems = rawDatafile.items.slice(start, end);
            const items = selectedItems.map((item) => {
                return new Item(item.header.id, item.data);
            });

            this.items.set(itemType.typeId, items);
        }

        if (rawDatafile.dataSizes) {
            for (const [i, dataItem] of rawDatafile.dataItems.entries()) {
                this.dataItems.push([dataItem, rawDatafile.dataSizes[i]!]);
            }
        } else {
            throw Error("You're fucked");
        }
    }

    getItems(exIndex: ExTypeIndex, kind: ItemTypeEnum): Item[] {
        const res = identifier(kind);
        let id: number;

        if (res instanceof TypeId) {
            id = res.typeId;
        } else {
            //NOTE: this thing prolly doesnt work
            id = exIndex.get(Array.from(res.bytes)!)!;
        }

        return this.items.get(id)!;
    }

    decompressedDataItem(index: number) {
        const [data, size] = this.dataItems[index]!;

        const decompressedData = inflate(data);

        if (decompressedData.length !== size) {
            throw Error('SIZE AING MATCHIGN AFTER DECOMPRESSING');
        }

        return decompressedData;
    }

    optionalDecompressedDataItem(index: number): null | Uint8Array {
        if (index === -1) {
            return null;
        } else {
            return this.decompressedDataItem(index);
        }
    }
}

class TypeId {
    constructor(public typeId: number) { }
}

function identifier(kind: ItemTypeEnum) {
    switch (kind) {
        case ItemTypeEnum.Version:
            return new TypeId(0);
        case ItemTypeEnum.Info:
            return new TypeId(1);
        case ItemTypeEnum.Image:
            return new TypeId(2);
        case ItemTypeEnum.Envelope:
            return new TypeId(3);
        case ItemTypeEnum.Group:
            return new TypeId(4);
        case ItemTypeEnum.Layer:
            return new TypeId(5);
        case ItemTypeEnum.EnvPoints:
            return new TypeId(6);
        case ItemTypeEnum.Sound:
            return new TypeId(7);
        case ItemTypeEnum.ExType:
            return new TypeId(0xffff);
        case ItemTypeEnum.AutoMapperConfig:
            return new Uuid(
                new Uint8Array([0x3e1b2716, 0x178c3978, 0x9bd9b11a, 0xe410dd8]),
            );
    }
}

type MapItem = typeof ExType | typeof Version | typeof Info | typeof Image | typeof Sound;

export function parseSingleItemOnly(
    mapItem: MapItem,
    df: Datafile,
    exIndex: ExTypeIndex,
) {
    const items = df.getItems(exIndex, mapItem.kind);

    if (items.length !== 1) {
        throw Error("You're fucked :D");
    }

    const all = parseAll(mapItem, df, exIndex);

    return all.pop();
}

export function parseAll(
    mapItem: MapItem,
    df: Datafile,
    exIndex: ExTypeIndex,
): InstanceType<MapItem>[] {
    const items = df.getItems(exIndex, mapItem.kind) || [];
    const parsed: InstanceType<MapItem>[] = [];

    for (const item of items) {
        parsed.push(mapItem.parse(item, df));
    }

    return parsed;
}

type ExTypeIndex = Map<number[], number>;

enum ItemTypeEnum {
    Version,
    Info,
    Image,
    Envelope,
    Group,
    Layer,
    EnvPoints,
    Sound,
    ExType,
    AutoMapperConfig,
}

export class ExType {
    static kind = ItemTypeEnum.ExType;

    constructor(public uuid: Uuid, public typeId: number) { }

    static parse(item: Item): ExType {
        const { itemData, id } = item;

        const uuid = Uuid.fromU32([
            itemData[0]! >>> 0,
            itemData[1]! >>> 0,
            itemData[2]! >>> 0,
            itemData[3]! >>> 0,
        ]);
        return new ExType(uuid, id);
    }
}

export class Version {
    static kind = ItemTypeEnum.Version;

    constructor(public readonly version: number) { }

    static parse(item: Item): Version {
        return new Version(item.itemData[0]!);
    }
}

export class Info {
    static kind = ItemTypeEnum.Info;

    constructor(
        public author: string,
        public version: string,
        public credits: string,
        public license: string,
        public settings: string[],
    ) { }

    static parse(item: Item, df: Datafile): Info {
        const data = Array.from(item.itemData);

        //@ts-ignore
        const _version = data.shift();
        const values: {
            author: string;
            version: string;
            credits: string;
            license: string;
            settings: string[];
        } = {
            author: '',
            version: '',
            credits: '',
            license: '',
            settings: [],
        };

        for (let i = 0; i < 4; i++) {
            const key = Object.keys(values)[i] as keyof Omit<
                typeof values,
                'settings'
            >;
            const id = data.shift();
            const something = df.optionalDecompressedDataItem(id!);
            if (something) {
                values[key] = textDecoder.decode(something);
            }
        }

        if (data.length > 0) {
            const bytes = df.optionalDecompressedDataItem(data[0]!);
            const settings = splitArray(Array.from(bytes || []), 0);

            for (const setting of settings) {
                values.settings.push(
                    textDecoder.decode(new Uint8Array(setting)),
                );
            }
        }

        const { author, version, credits, license, settings } = values;

        return new Info(author, version, credits, license, settings);
    }
}

export class Image {
    static kind = ItemTypeEnum.Image;

    constructor(
        public width: number,
        public height: number,
        public external: boolean,
        public name: string,
        public data: Uint8Array | null,
        public variant: number
    ) { }

    static parse(item: Item, df: Datafile): Image {
        const data = Array.from(item.itemData);

        //@ts-ignore
        const version = data[0]!;

        const width = data[1]!;
        const height = data[2]!;
        const external = !!data[3];
        const name = df.optionalDecompressedDataItem(data[4]!);
        const imageData = df.optionalDecompressedDataItem(data[5]!);

        let variant = 0;

        if (version == 2) {
            variant = data[6]!;
        }

        return new Image(
            width,
            height,
            external,
            textDecoder.decode(name!),
            imageData,
            variant
        );
    }
}

//NOTE: ddnet only btw
export class Sound {
    static kind = ItemTypeEnum.Sound;

    constructor(public external: boolean, public name: string, public data: Uint8Array, public size: number) { }

    static parse(item: Item, df: Datafile) {
        const data = item.itemData;

        //@ts-ignore
        const version = data[0]!;
        const external = data[1]!;
        const name = df.optionalDecompressedDataItem(data[2]!)!;
        const soundData = df.optionalDecompressedDataItem(data[3]!)!;
        const size = data[4]!;

        return new Sound(!!external, textDecoder.decode(name), soundData, size);
    }
}
