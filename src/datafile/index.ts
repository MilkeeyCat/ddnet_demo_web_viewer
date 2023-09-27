import { inflate } from 'pako';
import { Reader } from '../reader';
import { Uuid } from '../uuid';
import { splitArray } from '../utils/splitArray';
import { Layer, Rect } from './Layer';
import { parseI32String } from '../utils/parseI32String';
import { I27F5 } from '../utils/fixed';

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

type MapItem =
    | typeof ExType
    | typeof Version
    | typeof Info
    | typeof Image
    | typeof EnvPoint
    | typeof Envelope
    | typeof Sound
    | typeof Group;

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

    return all.pop()!;
}

export function parseEnvPoints(
    df: Datafile,
    exIndex: ExTypeIndex,
): EnvPoint<any>[] {
    const items = df.getItems(exIndex, EnvPoint.kind);

    if (items.length !== 1) {
        throw Error("You're fucked :D");
    }

    return EnvPoint.parsePoints(items[0]!, df);
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
        public variant: number,
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
            variant,
        );
    }
}

//@ts-ignore
class BezierCurve {
    constructor(
        public inTangentDx: number,
        public inTangentDy: number,
        public outTangentDx: number,
        public outTangentDy: number,
    ) { }
}

enum CurveKind {
    Step,
    Linear,
    Slow,
    Fast,
    Smooth,
    Bezier,
    Unknown,
}

function envPointSizeInBytes(envVersion: number): number {
    switch (envVersion) {
        case 1:
            return 6;
        case 2:
            return 6;
        case 3:
            return 22;
        default:
            throw Error('gtfo from here');
    }
}

function fromChannels(channel: EnvelopeType, content: number[]) {
    if (channel === EnvelopeType.Position) {
        return {
            offset: [content[0]!, content[1]!],
            rotation: content[2]!,
        };
    } else if (channel === EnvelopeType.Color) {
        return {
            r: content[0]!,
            g: content[1]!,
            b: content[2]!,
            a: content[3]!,
        };
    } else if (channel === EnvelopeType.Sound) {
        return content[0]!;
    } else {
        throw Error('nononon');
    }
}

function covertEnvPoints(channel: EnvelopeType, points: EnvPoint<any>[]) {
    return points.map((point) => {
        return new EnvPoint(point.time, fromChannels(channel, point.content), point.curveKind);
    });
}

export class EnvPoint<T> {
    static kind = ItemTypeEnum.EnvPoints;

    constructor(
        public time: number,
        public content: T,
        public curveKind: CurveKind,
    ) { }

    static parse(): EnvPoint<any> {
        //NOTE: someone fix this, pls
        return null as any as EnvPoint<any>;
    }

    static parsePoints(item: Item, df: Datafile): EnvPoint<any>[] {
        const data = item.itemData;
        const envelopeItems = df.getItems(new Map(), ItemTypeEnum.Envelope);
        const envelopeVersion = envelopeItems[0]?.itemData[0];
        const size = envPointSizeInBytes(envelopeVersion!);

        if (item.itemData.length % size != 0) {
            throw new Error('BAAAAAAD SIIIIIZE');
        }

        const envPoints = [];

        for (let i = 0; i < data.length; i += size) {
            const time = data[i]!;
            const content = data.slice(i + 2, i + 6)!;
            if (size > 6) {
                throw Error('time to implement bezier curve :feelsbadman:');
            }
            const curveKind = data[i + 1] as CurveKind;

            envPoints.push(new EnvPoint(time, content, curveKind));
        }

        return envPoints;
    }

    static distribute(envPoints: EnvPoint<any>[], envelopes: Envelope[]): void {
        let remaining = structuredClone(envPoints);
        for (const env of envelopes) {
            const curr = remaining.slice(0, env.points.length);
            remaining = remaining.slice(env.points.length - 1);
            env.points = covertEnvPoints(env.type, curr);
        }
    }
}

enum EnvelopeType {
    Sound = 1,
    Position = 3,
    Color = 4,
}

export class Envelope {
    static kind = ItemTypeEnum.Envelope;

    constructor(
        public type: EnvelopeType,
        public name: string,
        public synchronized: boolean,
        public points: EnvPoint<any>[],
    ) { }

    static I32ToString(data: Int32Array): string {
        const arr = [];

        for (const num of data) {
            if (num == 0) {
                break;
            }

            for (let i = 3; i >= 0; i--) {
                arr.push(((num >> (i * 8)) & 0xff) - 128);
            }
        }

        return textDecoder.decode(new Uint8Array(arr));
    }

    static parse(item: Item, df: Datafile): Envelope {
        df;
        const data = item.itemData;

        //@ts-ignore
        const version = data[0];
        const channel = data[1] as EnvelopeType;
        //@ts-ignore
        const startPoint = data[2]!;
        //@ts-ignore
        const numPoints = data[3]!;
        const name = this.I32ToString(data.slice(4));
        let syncrhonized = false;

        let points: Envelope['points'];
        //NOTE: fix it when it will break 😉

        if (channel === EnvelopeType.Color) {
            points = new Array(numPoints).fill(
                new EnvPoint(0, { r: 0, g: 0, b: 0, a: 0 }, CurveKind.Linear),
            );
        } else if (channel === EnvelopeType.Sound) {
            points = new Array(numPoints).fill(
                //null has to be SOMEHITNG lel
                new EnvPoint(0, null, CurveKind.Step),
            );
        } else if (channel === EnvelopeType.Position) {
            points = new Array(numPoints).fill(
                new EnvPoint(0, { x: 0, y: 0 }, CurveKind.Step),
            );
        } else {
            points = [];
        }

        return new Envelope(channel, name, syncrhonized, points);
    }
}

//NOTE: ddnet only btw
export class Sound {
    static kind = ItemTypeEnum.Sound;

    constructor(
        public external: boolean,
        public name: string,
        public data: Uint8Array,
        public size: number,
    ) { }

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

export class Group {
    static kind = ItemTypeEnum.Group;

    constructor(
        public name: string,
        public offset: [number, number],
        public parallax: [number, number],
        public layers: Layer[],
        public clipping: boolean,
        public clip: Rect
    ) { }

    static parse(item: Item, df: Datafile) {
        const version = item.itemData[0]!; // NOTE: has to be 3
        const start = item.itemData[5]!;

        const totalLayers = df.getItems(new Map(), ItemTypeEnum.Layer);
        const remainingLayers = totalLayers.length - start;
        const amount = item.itemData[6]!;

        if (amount > remainingLayers) {
            throw new Error("Oh, boy you are fucked and also too high amount :)");
        }

        let clipping = false;
        let clipX = 0;
        let clipY = 0;
        let clipWidth = 0;
        let clipHeight = 0;
        let name = "";

        if (version >= 2) {
            clipping = !!item.itemData[7];
            clipX = I27F5.gimmeFloat(item.itemData[8]!);
            clipY = I27F5.gimmeFloat(item.itemData[9]!);
            clipWidth = I27F5.gimmeFloat(item.itemData[10]!);
            clipHeight = I27F5.gimmeFloat(item.itemData[11]!);

            if (version >= 3) {
                name = parseI32String(item.itemData.slice(12, 15), textDecoder)
            }

        }

        const parallax: [number, number] = [
            item.itemData[3]!,
            item.itemData[4]!
        ];

        return new Group(
            name,
            [
                I27F5.gimmeFloat(item.itemData[1]!),
                I27F5.gimmeFloat(item.itemData[2]!)
            ],
            parallax,
            new Array(amount),
            clipping,
            new Rect(clipX, clipY, clipWidth, clipHeight)
        );
    }
}
