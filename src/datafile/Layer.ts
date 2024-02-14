import { Datafile, Item } from '.';
import { Reader } from '../reader';
import { I17F15, I22F10, I27F5 } from '../utils/fixed';
import { parseI32String } from '../utils/parseI32String';
import { arrayChunks } from '../utils/uint8arraychunks';

//class GameTile {
//    constructor(
//        public id: number,
//        public flags: boolean, //FIXME: maybe not boolean :DDD
//        public skip: number,
//        public unused: number
//    ) { }
//}

class CompressedData {
    constructor(
        public data: Uint8Array,
        public dataSize: number,
        public loadInfo: TilesLoadInfo,
    ) {}
}

export enum LayerKind {
    Game,
    Tiles,
    Quads,
    Front,
    Tele,
    Speedup,
    Switch,
    Tune,
    Sounds,
}

export function layerKind(item: Item): LayerKind {
    switch (item.itemData[1]) {
        //NOTE: so called 'LAYERTYPE'
        case 2:
            switch (item.itemData[6]) {
                case 0:
                    return LayerKind.Tiles;
                case 1:
                    return LayerKind.Game;
                case 2:
                    return LayerKind.Tele;
                case 4:
                    return LayerKind.Speedup;
                case 8:
                    return LayerKind.Front;
                case 16:
                    return LayerKind.Switch;
                case 32:
                    return LayerKind.Tune;
                default:
                    throw new Error('Sus tilemap layer :raise_eyebrow:');
            }
        case 3:
            return LayerKind.Quads;
        case 9:
        case 10:
            return LayerKind.Sounds;
        default:
            throw new Error('Sus layer kind :raise_eyebrow:');
    }
}

export class Rect {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number,
    ) {}
}

export class Disk {
    constructor(
        public centerX: number,
        public centerY: number,
        public radius: number,
    ) {}
}

class Quad {
    constructor(
        //techically its I17F15
        public corners: [
            [number, number],
            [number, number],
            [number, number],
            [number, number],
        ],
        // and this as well I17F15
        public position: [number, number],
        public colors: [Rgba, Rgba, Rgba, Rgba],
        public textureCoords: [Uv, Uv, Uv, Uv],
        public positionEnv: number | null,
        public positionEnvOffset: number,
        public colorEnv: number | null,
        public colorEnvOffset: number,
    ) {}
}

export class Rgba {
    constructor(
        public r: number,
        public g: number,
        public b: number,
        public a: number,
    ) {}

    public static default(): Rgba {
        return new Rgba(0, 0, 0, 0);
    }
}

export class GameLayer {
    constructor(public tiles: CompressedData) {}
}

export class FrontLayer {
    constructor(public tiles: CompressedData) {}
}

export class TeleLayer {
    constructor(public tiles: CompressedData) {}
}

export class SpeedupLayer {
    constructor(public tiles: CompressedData) {}
}

export class SwitchLayer {
    constructor(public tiles: CompressedData) {}
}

export class TuneLayer {
    constructor(public tiles: CompressedData) {}
}

class AutomapperConfig {
    constructor(
        public config: number | null,
        public seed: number,
        public automatic: boolean,
    ) {}

    static default() {
        return new AutomapperConfig(null, 0, false);
    }
}

class RectangleSoundArea {
    constructor(public area: Rect) {}
}

class CircleSoundArea {
    constructor(public area: Disk) {}
}

type SoundArea = RectangleSoundArea | CircleSoundArea;

class SoundSource {
    constructor(
        public area: SoundArea,
        public looping: boolean,
        public panning: boolean,
        public delay: number,
        public falloff: number,
        public positionEnv: number | null,
        public positionEnvOffset: number,
        public soundEnv: number | null,
        public soundEnvOffset: number,
    ) {}
}

function convertOptIndex(value: number): number | null {
    if (value == -1) {
        return null;
    } else {
        return value;
    }
}

function dataIndex(kind: LayerKind): number {
    switch (kind) {
        case LayerKind.Game:
        case LayerKind.Tiles:
            return 14;
        case LayerKind.Front:
            return 20;
        case LayerKind.Tele:
            return 18;
        case LayerKind.Speedup:
            return 19;
        case LayerKind.Switch:
            return 21;
        case LayerKind.Tune:
            return 22;
        default:
            throw new Error('What the fukc are you even passing in me????');
    }
}

class TilesLoadInfo {
    constructor(
        public size: [number, number],
        public compression: boolean,
    ) {}
}

export class TilesLayer {
    constructor(
        public name: string,
        public detail: boolean,
        public color: Rgba,
        public colorEnv: number | null,
        public colorEnvOffset: number | null,
        public image: number | null,
        public tiles: CompressedData, // NOTE: here also should be Loaded class
        public automapperConfig: AutomapperConfig,
    ) {}

    convertTo(kind: LayerKind): LayerT {
        //NOTE: i dont do any checks kekw, if something goes wrong everything is fucked =]
        switch (kind) {
            case LayerKind.Game:
                return new GameLayer(this.tiles);
            case LayerKind.Tiles:
                return this;
            case LayerKind.Front:
                return new FrontLayer(this.tiles);
            case LayerKind.Tele:
                return new TeleLayer(this.tiles);
            case LayerKind.Speedup:
                return new SpeedupLayer(this.tiles);
            case LayerKind.Switch:
                return new SwitchLayer(this.tiles);
            case LayerKind.Tune:
                return new TuneLayer(this.tiles);
            default:
                throw new Error(
                    'Idk man im focken tired to handle this bullshit',
                );
        }
    }

    static parseGeneric(item: Item, df: Datafile): [TilesLayer, number] {
        const kind = layerKind(item);
        const version = item.itemData[3]!; //FIXME: ive no clue what are those goofy ahh flags

        const width = item.itemData[4]!;
        const height = item.itemData[5]!;

        const tileAmount = width * height;
        const size: [number, number] = [width, height];

        const color = new Rgba(
            item.itemData[7]!,
            item.itemData[8]!,
            item.itemData[9]!,
            item.itemData[10]!,
        );
        const colorEnv = convertOptIndex(item.itemData[11]!);
        const colorEnvOffset = item.itemData[12]!;
        const image = convertOptIndex(item.itemData[13]!);

        let compression = false;

        if (kind == LayerKind.Game || kind == LayerKind.Tiles) {
            compression = version >= 4;
        }

        let dataIndexx = dataIndex(kind);
        let name = '';

        if (version < 3) {
            if (dataIndexx > 14) {
                dataIndexx = -3;
            }
        } else {
            name = parseI32String(
                item.itemData.slice(15, 18),
                new TextDecoder(),
            );
        }

        const [data, dataSize] = df.dataItem(item.itemData[dataIndexx]!);

        if (kind !== LayerKind.Game && kind !== LayerKind.Tiles) {
            let compatibilityData = df.decompressedDataItem(item.itemData[14]!);
            const expectedSize = tileAmount * 4;

            if (compatibilityData.length !== expectedSize) {
                throw new Error('Yo size aint right :p');
            }

            if (compatibilityData.some((a) => a != 0)) {
                throw new Error('You have some really weird data ong');
            }
        }

        //FIXME: do something about old tile versions
        const tilesLoadInfo = new TilesLoadInfo(size, compression);

        return [
            new TilesLayer(
                name,
                false, //FIXME: maybe its not false KEKW
                color,
                colorEnv,
                colorEnvOffset,
                image,
                new CompressedData(data, dataSize, tilesLoadInfo),
                AutomapperConfig.default(),
            ),
            kind,
        ];
    }
}

class BinaryPoint {
    constructor(
        public x: number,
        public y: number,
    ) {}

    public toTwo(fixed: typeof I22F10 | typeof I17F15): [number, number] {
        return [fixed.gimmeFloat(this.x), fixed.gimmeFloat(this.y)];
    }
}

class BinaryColor {
    constructor(
        public r: number,
        public g: number,
        public b: number,
        public a: number,
    ) {}

    public toColor(): Rgba {
        // dont event fukcing dare to say anything about this stupid fukcing shit
        return new Rgba(this.a, this.g, this.b, this.a);
    }
}

class Uv {
    constructor(
        public u: number,
        public v: number,
    ) {}
}

class BinaryQuad {
    static size = 152;

    constructor(
        public corners: [BinaryPoint, BinaryPoint, BinaryPoint, BinaryPoint],
        public position: BinaryPoint,
        public colors: [BinaryColor, BinaryColor, BinaryColor, BinaryColor],
        public textureCoords: [
            BinaryPoint,
            BinaryPoint,
            BinaryPoint,
            BinaryPoint,
        ],
        public positionEnv: number,
        public positionEnvOffset: number,
        public colorEnv: number,
        public colorEnvOffset: number,
    ) {}

    public toQuad(): Quad {
        const corners = new Array(4) as [
            [number, number],
            [number, number],
            [number, number],
            [number, number],
        ];
        const colors = new Array(4) as [Rgba, Rgba, Rgba, Rgba];
        const textureCoords = new Array(4) as [Uv, Uv, Uv, Uv];

        for (let i = 0; i < 4; i++) {
            corners[i] = this.corners[i]!.toTwo(I17F15);
            colors[i] = this.colors[i]!.toColor();

            const texturecoords = this.textureCoords[i]!.toTwo(I22F10);
            textureCoords[i] = new Uv(texturecoords[0], texturecoords[1]);
        }

        return new Quad(
            corners,
            this.position.toTwo(I17F15),
            colors,
            textureCoords,
            convertOptIndex(this.positionEnv),
            this.positionEnvOffset,
            convertOptIndex(this.colorEnv),
            this.colorEnvOffset,
        );
    }
}

export class QuadsLayer {
    constructor(
        public name: string,
        public detail: boolean,
        public quads: Quad[],
        public image: number | null,
    ) {}

    static parse(item: Item, df: Datafile): QuadsLayer {
        const version = item.itemData[3]!;
        //FIXME: when do flags??
        //@ts-ignore
        const quadAmount = item.itemData[4];
        const quadData = df.decompressedDataItem(item.itemData[5]!);
        //fuck checks :clueless:

        const quads = arrayChunks(quadData, BinaryQuad.size).map((chunk) => {
            const reader = new Reader(chunk);

            return new BinaryQuad(
                [
                    new BinaryPoint(reader.readBeI32(), reader.readLeI32()),
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                ],
                new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                [
                    new BinaryColor(
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                    ),
                    new BinaryColor(
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                    ),
                    new BinaryColor(
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                    ),
                    new BinaryColor(
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                    ),
                ],
                [
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                ],
                reader.readLeI32(),
                reader.readLeI32(),
                reader.readLeI32(),
                reader.readLeI32(),
            ).toQuad();
        });

        const image = convertOptIndex(item.itemData[6]!);
        let name = '';

        if (version >= 2) {
            name = parseI32String(
                item.itemData.slice(7, 10),
                new TextDecoder(),
            );
        }

        return new QuadsLayer(
            name,
            false, //NOTE: maybe not false kekw
            quads,
            image,
        );
    }
}

class BinaryDepricatedSoundSource {
    constructor(
        public position: BinaryPoint,
        public looping: number,
        public delay: number,
        public radius: number,
        public positionEnv: number,
        public positionEnvOffset: number,
        public soundEnv: number,
        public soundEnvOffset: number,
    ) {}

    public toSource(): SoundSource {
        const pos = this.position.toTwo(I27F5);

        return new SoundSource(
            new CircleSoundArea(
                new Disk(pos[0], pos[1], I27F5.gimmeFloat(this.radius)),
            ),
            !!this.looping,
            true,
            this.delay,
            0,
            convertOptIndex(this.positionEnv),
            this.positionEnvOffset,
            convertOptIndex(this.soundEnv),
            this.soundEnvOffset,
        );
    }
}

class BinarySoundShape {
    constructor(
        public kind: number,
        public value1: number,
        public value2: number,
    ) {}

    public toShape(position: [number, number]): SoundArea {
        switch (this.kind) {
            case 0:
                return new RectangleSoundArea(
                    new Rect(
                        position[0],
                        position[1],
                        I17F15.gimmeFloat(this.value1),
                        I17F15.gimmeFloat(this.value2),
                    ),
                );
            case 1:
                return new CircleSoundArea(
                    new Disk(
                        position[0],
                        position[1],
                        I27F5.gimmeFloat(this.value1),
                    ),
                );
            default:
                throw new Error('LAJSDLAKJFA');
        }
    }
}

class BinarySoundSource {
    constructor(
        public position: BinaryPoint,
        public looping: number,
        public panning: number,
        public delay: number,
        public falloff: number,
        public positionEnv: number,
        public positionEnvOffset: number,
        public soundEnv: number,
        public soundEnvOffset: number,
        public shape: BinarySoundShape,
    ) {}

    public toSource(): SoundSource {
        return new SoundSource(
            this.shape.toShape(this.position.toTwo(I27F5)),
            !!this.looping,
            !!this.panning,
            this.delay,
            this.falloff,
            convertOptIndex(this.positionEnv),
            this.positionEnvOffset,
            convertOptIndex(this.soundEnv),
            this.soundEnvOffset,
        );
    }
}

enum SoundsLayerVersion {
    Normal,
    Deprecated,
}

export class SoundsLayer {
    constructor(
        public name: string,
        public detail: boolean,
        public sources: SoundSource[],
        public sound: number | null,
    ) {}

    static parse(item: Item, df: Datafile): SoundsLayer {
        let soundsLayerVersion: SoundsLayerVersion | null = null;
        if (item.itemData[1] === 9) {
            soundsLayerVersion = SoundsLayerVersion.Deprecated;
        } else if (item.itemData[1] === 10) {
            soundsLayerVersion = SoundsLayerVersion.Normal;
        }

        const sourceAmount = item.itemData[4];
        const soundSourceData = df.decompressedDataItem(item.itemData[5]!);

        let sourceLen: number = 0;
        if (soundsLayerVersion === SoundsLayerVersion.Normal) {
            sourceLen = 52;
        } else if (soundsLayerVersion === SoundsLayerVersion.Deprecated) {
            sourceLen = 36;
        }

        const impliedSourceAmount = soundSourceData.length / sourceLen;

        if (impliedSourceAmount !== sourceAmount) {
            throw new Error(
                'Who do you think i am. Did you fucking try to fool me? My code is the safest shit youve ever seen in your life, dont even fukcing try to pass me some goofy ahh map file',
            );
        }

        const sources: SoundSource[] = arrayChunks(
            soundSourceData,
            sourceLen,
        ).map((chunk) => {
            const reader = new Reader(chunk);

            if (soundsLayerVersion === SoundsLayerVersion.Deprecated) {
                return new BinaryDepricatedSoundSource(
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                ).toSource();
            } else if (soundsLayerVersion === SoundsLayerVersion.Normal) {
                return new BinarySoundSource(
                    new BinaryPoint(reader.readLeI32(), reader.readLeI32()),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    reader.readLeI32(),
                    new BinarySoundShape(
                        reader.readLeI32(),
                        reader.readLeI32(),
                        reader.readLeI32(),
                    ),
                ).toSource();
            } else {
                throw new Error();
            }
        });

        const sound = convertOptIndex(item.itemData[6]!);
        const name = parseI32String(
            item.itemData.slice(7, 10),
            new TextDecoder(),
        );

        return new SoundsLayer(
            name,
            false, //NOTE: MAYBE NOT FAAAAAAAAAALSE
            sources,
            sound,
        );
    }
}

export type LayerT =
    | GameLayer
    | TilesLayer
    | QuadsLayer
    | FrontLayer
    | TeleLayer
    | SpeedupLayer
    | SwitchLayer
    | TuneLayer
    | SoundsLayer
    | null;
