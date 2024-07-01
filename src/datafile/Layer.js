import { inflate } from 'pako';
import { Datafile, Item } from '.';
import { Reader } from '../reader';
import { I17F15, I22F10, I27F5 } from '../utils/fixed';
import { parseI32String } from '../utils/parseI32String';
import { arrayChunks } from '../utils/uint8arraychunks';

export class GameTile {
    /**
     * @param {number} id
     * @param {number} flags
     * @param {number} skip
     * @param {number} unused
     */
    constructor(
        id,
        flags,
        skip,
        unused,
    ) {
        /** @type {number} */
        this.id = id;
        /** @type {number} */
        this.flags = flags;
        /** @type {number} */
        this.skip = skip;
        /** @type {number} */
        this.unused = unused;
    }
}

class CompressedData {
    /**
     * @param {Uint8Array} data
     * @param {number} dataSize
     * @param {TilesLoadInfo} loadInfo
     */
    constructor(
        data,
        dataSize,
        loadInfo,
    ) {
        /** @type {Uint8Array} */
        this.data = data;
        /** @type {number} */
        this.dataSize = dataSize;
        /** @type {TilesLoadInfo} */
        this.loadInfo = loadInfo;
    }
}

export const LayerKind = {
    Game: 0,
    Tiles: 1,
    Quads: 2,
    Front: 3,
    Tele: 4,
    Speedup: 5,
    Switch: 6,
    Tune: 7,
    Sounds: 8,
}

/**
 * @param {Item} item
 * @returns {number} - LayerKind
 */
export function layerKind(item) {
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
            throw new Error('Sus layer kind 🤨');
    }
}

export class Rect {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    constructor(
        x,
        y,
        width,
        height,
    ) {
        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
        /** @type {number} */
        this.width = width;
        /** @type {number} */
        this.height = height;
    }
}

export class Disk {
    /**
     * @param {number} centerX
     * @param {number} centerY
     * @param {number} radius
     */
    constructor(
        centerX,
        centerY,
        radius,
    ) {
        /** @type {number} */
        this.centerX = centerX;
        /** @type {number} */
        this.centerY = centerY;
        /** @type {number} */
        this.radius = radius;
    }
}

class Quad {
    /**
     * @param {[
            [number, number],
            [number, number],
            [number, number],
            [number, number],
        ]} corners
     * @param {[number, number]} position
     * @param {[Rgba, Rgba, Rgba, Rgba]} colors
     * @param {[Uv, Uv, Uv, Uv]} textureCoords
     * @param {?number} positionEnv
     * @param {number} positionEnvOffset
     * @param {?number} colorEnv
     * @param {number} colorEnvOffset
     */
    constructor(
        corners,
        position,
        colors,
        textureCoords,
        positionEnv,
        positionEnvOffset,
        colorEnv,
        colorEnvOffset,
    ) {
        /** @type {[
            [number, number],
            [number, number],
            [number, number],
            [number, number],
        ]} */
        this.corners = corners;
        /** @type {[number, number]} */
        this.position = position;
        /** @type {[Rgba, Rgba, Rgba, Rgba]} */
        this.colors = colors;
        /** @type {[Uv, Uv, Uv, Uv]} */
        this.textureCoords = textureCoords;
        /** @type {?number} */
        this.positionEnv = positionEnv;
        /** @type {number} */
        this.positionEnvOffset = positionEnvOffset;
        /** @type {?number} */
        this.colorEnv = colorEnv;
        /** @type {number} */
        this.colorEnvOffset = colorEnvOffset;
    }
}

export class Rgba {
    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    constructor(
        r,
        g,
        b,
        a,
    ) {
        /** @type {number} */
        this.r = r;
        /** @type {number} */
        this.g = g;
        /** @type {number} */
        this.b = b;
        /** @type {number} */
        this.a = a;
    }

    /** @returns {Rgba} */
    static default() {
        return new Rgba(0, 0, 0, 0);
    }
}

export class GameLayer {
    /** @param {CompressedData} tiles */
    constructor(tiles) {
        /** @type {CompressedData} */
        this.tiles = tiles;
    }

    /** @returns {GameTile[]} */
    decompress() {
        const decompressedData = inflate(this.tiles.data);
        const data = arrayChunks(decompressedData, 4);

        return data.flatMap((tile) => {
            let res = [];

            for (let i = 0; i <= tile[2]; i++) {
                res.push(new GameTile(tile[0], tile[1], 0, tile[3]));
            }

            return res.flat();
        });
    }
}

export class FrontLayer {
    /** @param {CompressedData} tiles */
    constructor(tiles) {
        /** @type {CompressedData} */
        this.tiles = tiles;
    }
}

export class TeleLayer {
    /** @param {CompressedData} tiles */
    constructor(tiles) {
        /** @type {CompressedData} */
        this.tiles = tiles;
    }
}

export class SpeedupLayer {
    /** @param {CompressedData} tiles */
    constructor(tiles) {
        /** @type {CompressedData} */
        this.tiles = tiles;
    }
}

export class SwitchLayer {
    /** @param {CompressedData} tiles */
    constructor(tiles) {
        /** @type {CompressedData} */
        this.tiles = tiles;
    }
}

export class TuneLayer {
    /** @param {CompressedData} tiles */
    constructor(tiles) {
        /** @type {CompressedData} */
        this.tiles = tiles;
    }
}

class AutomapperConfig {
    /**
     * @param {?number} config
     * @param {number} seed
     * @param {boolean} automatic
     */
    constructor(
        config,
        seed,
        automatic,
    ) {
        /** @type {?number} */
        this.config = config;
        /** @type {number} */
        this.seed = seed;
        /** @type {boolean} */
        this.automatic = automatic;
    }

    /** @returns {AutomapperConfig} */
    static default() {
        return new AutomapperConfig(null, 0, false);
    }
}

class RectangleSoundArea {
    /** @param {Rect} area */
    constructor(area) {
        /** @type {Rect} */
        this.area = area;
    }
}

class CircleSoundArea {
    /** @param {Disk} area */
    constructor(area) {
        /** @type {Disk} */
        this.area = area;
    }
}

/** @typedef {RectangleSoundArea | CircleSoundArea} SoundArea */

class SoundSource {
    /**
     * @param {SoundArea} area
     * @param {boolean} looping
     * @param {boolean} panning
     * @param {number} delay
     * @param {number} falloff
     * @param {?number} positionEnv
     * @param {number} positionEnvOffset
     * @param {?number} soundEnv
     * @param {number} soundEnvOffset
     */
    constructor(
        area,
        looping,
        panning,
        delay,
        falloff,
        positionEnv,
        positionEnvOffset,
        soundEnv,
        soundEnvOffset,
    ) {
        /** @type {SoundArea} */
        this.area = area;
        /** @type {boolean} */
        this.looping = looping;
        /** @type {boolean} */
        this.panning = panning;
        /** @type {number} */
        this.delay = delay;
        /** @type {number} */
        this.falloff = falloff;
        /** @type {?number} */
        this.positionEnv = positionEnv;
        /** @type {number} */
        this.positionEnvOffset = positionEnvOffset;
        /** @type {?number} */
        this.soundEnv = soundEnv;
        /** @type {number} */
        this.soundEnvOffset = soundEnvOffset;
    }
}

/**
 * @param {number} value
 * @returns {?number}
 */
function convertOptIndex(value) {
    if (value == -1) {
        return null;
    } else {
        return value;
    }
}

/**
 * @param {number} kind LayerKind
 * @returns {number}
 */
function dataIndex(kind) {
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
    /**
     * @param {[number, number]} size
     * @param {boolean} compression
     */
    constructor(
        size,
        compression,
    ) {
        /** @type {[number, number]} */
        this.size = size;
        /** @type {boolean} */
        this.compression = compression;
    }
}

export class TilesLayer {
    /**
     * @param {string} name
     * @param {boolean} detail
     * @param {Rgba} color
     * @param {?number} colorEnv
     * @param {?number} colorEnvOffset
     * @param {?number} image
     * @param {CompressedData} tiles
     * @param {AutomapperConfig} automapperConfig
     */
    constructor(
        name,
        detail,
        color,
        colorEnv,
        colorEnvOffset,
        image,
        tiles,
        automapperConfig,
    ) {
        /** @type {string} */
        this.name = name;
        /** @type {boolean} */
        this.detail = detail;
        /** @type {Rgba} */
        this.color = color;
        /** @type {?number} */
        this.colorEnv = colorEnv;
        /** @type {?number} */
        this.colorEnvOffset = colorEnvOffset;
        /** @type {?number} */
        this.image = image;
        /** @type {CompressedData} */
        this.tiles = tiles;
        /** @type {AutomapperConfig} */
        this.automapperConfig = automapperConfig;
    }

    /**
     * @param {number} kind LayerKind
     * @returns {LayerT}
     */
    convertTo(kind) {
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

    /**
     * @param {Item} item
     * @param {Datafile} df
     * @returns {[TilesLayer, number]}
     */
    static parseGeneric(item, df) {
        const kind = layerKind(item);
        const version = item.itemData[3]; //FIXME: ive no clue what are those goofy ahh flags

        const width = item.itemData[4];
        const height = item.itemData[5];

        const tileAmount = width * height;
        const size: [number, number] = [width, height];

        const color = new Rgba(
            item.itemData[7],
            item.itemData[8],
            item.itemData[9],
            item.itemData[10],
        );
        const colorEnv = convertOptIndex(item.itemData[11]);
        const colorEnvOffset = item.itemData[12];
        const image = convertOptIndex(item.itemData[13]);

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

        const [data, dataSize] = df.dataItem(item.itemData[dataIndexx]);

        if (kind !== LayerKind.Game && kind !== LayerKind.Tiles) {
            let compatibilityData = df.decompressedDataItem(item.itemData[14]);
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
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(
        x,
        y,
    ) {
        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
    }

    /**
     * @param {typeof I22F10 | typeof I17F15} fixed
     * @returns {[number, number]}
     */
    toTwo(fixed) {
        return [fixed.gimmeFloat(this.x), fixed.gimmeFloat(this.y)];
    }
}

class BinaryColor {
    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    constructor(
        r,
        g,
        b,
        a,
    ) {
        /** @type {number} */
        this.r = r;
        /** @type {number} */
        this.g = g;
        /** @type {number} */
        this.b = b;
        /** @type {number} */
        this.a = a;
    }

    /** @returns {Rgba} */
    toColor() {
        // dont event fukcing dare to say anything about this stupid fukcing shit
        return new Rgba(this.a, this.g, this.b, this.a);
    }
}

class Uv {
    /**
     * @param {number} u
     * @param {number} v
     */
    constructor(
        u,
        v,
    ) {
        /** @type {number} */
        this.u = u;
        /** @type {number} */
        this.v = v;
    }
}

class BinaryQuad {
    static size = 152;

    /**
     * @param {[BinaryPoint, BinaryPoint, BinaryPoint, BinaryPoint]} corners
     * @param {BinaryPoint} position
     * @param {[BinaryColor, BinaryColor, BinaryColor, BinaryColor]} colors
     * @param {[
            BinaryPoint,
            BinaryPoint,
            BinaryPoint,
            BinaryPoint,
       ]} textureCoords
     * @param {number} positionEnv
     * @param {number} positionEnvOffset
     * @param {number} colorEnv
     * @param {number} colorEnvOffset
     */
    constructor(
        corners,
        position,
        colors,
        textureCoords,
        positionEnv,
        positionEnvOffset,
        colorEnv,
        colorEnvOffset,
    ) {
        /** @type {[BinaryPoint, BinaryPoint, BinaryPoint, BinaryPoint]} */
        this.corners = corners;
        /** @type {BinaryPoint} */
        this.position = position;
        /** @type {[BinaryColor, BinaryColor, BinaryColor, BinaryColor]} */
        this.colors = colors;
        /** @type {[
            BinaryPoint,
            BinaryPoint,
            BinaryPoint,
            BinaryPoint,
        ]} */
        this.textureCoords = textureCoords;
        /** @type {number} */
        this.positionEnv = positionEnv;
        /** @type {number} */
        this.positionEnvOffset = positionEnvOffset;
        /** @type {number} */
        this.colorEnv = colorEnv;
        /** @type {number} */
        this.colorEnvOffset = colorEnvOffset;
    }

    /** @returns {Quad} */
    toQuad() {
        /** @type {[
            [number, number],
            [number, number],
            [number, number],
            [number, number],
        ]} */
        const corners = new Array(4);
        /** @type {[Rgba, Rgba, Rgba, Rgba]} */
        const colors = new Array(4);
        /** @type {[Uv, Uv, Uv, Uv]} */
        const textureCoords = new Array(4);

        for (let i = 0; i < 4; i++) {
            corners[i] = this.corners[i].toTwo(I17F15);
            colors[i] = this.colors[i].toColor();

            const texturecoords = this.textureCoords[i].toTwo(I22F10);
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
    /**
     * @param {string} name
     * @param {boolean} detail
     * @param {Quad[]} quads
     * @param {?number} image
     */
    constructor(
        name,
        detail,
        quads,
        image,
    ) {
        /** @type {string} */
        this.name = name;
        /** @type {boolean} */
        this.detail = detail;
        /** @type {Quad[]} */
        this.quads = quads;
        /** @type {?number} */
        this.image = image;
    }

    /**
     * @param {Item} item
     * @param {Datafile} df
     * @returns {QuadsLayer}
     */
    static parse(item, df) {
        const version = item.itemData[3];
        //FIXME: when do flags??
        const quadAmount = item.itemData[4];
        const quadData = df.decompressedDataItem(item.itemData[5]);
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

        const image = convertOptIndex(item.itemData[6]);
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
    /**
     * @param {BinaryPoint} position
     * @param {number} looping
     * @param {number} delay
     * @param {number} radius
     * @param {number} positionEnv
     * @param {number} positionEnvOffset
     * @param {number} soundEnv
     * @param {number} soundEnvOffset
     */
    constructor(
        position,
        looping,
        delay,
        radius,
        positionEnv,
        positionEnvOffset,
        soundEnv,
        soundEnvOffset,
    ) {
        /** @type {BinaryPoint} */
        this.position = position;
        /** @type {number} */
        this.looping = looping;
        /** @type {number} */
        this.delay = delay;
        /** @type {number} */
        this.radius = radius;
        /** @type {number} */
        this.positionEnv = positionEnv;
        /** @type {number} */
        this.positionEnvOffset = positionEnvOffset;
        /** @type {number} */
        this.soundEnv = soundEnv;
        /** @type {number} */
        this.soundEnvOffset = soundEnvOffset;
    }

    /** @returns {SoundSource} */
    toSource() {
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
    /**
     * @param {number} kind
     * @param {number} value1
     * @param {number} value2
     */
    constructor(
        kind,
        value1,
        value2,
    ) {
        /** @type {number} */
        this.kind = kind;
        /** @type {number} */
        this.value1 = value1;
        /** @type {number} */
        this.value2 = value2;
    }

    /**
     * @param {[number, number]} position
     * @returns {SoundArea}
     */
    toShape(position) {
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
    /**
     * @param {BinaryPoint} position
     * @param {number} looping
     * @param {number} panning
     * @param {number} delay
     * @param {number} falloff
     * @param {number} positionEnv
     * @param {number} positionEnvOffset
     * @param {number} soundEnv
     * @param {number} soundEnvOffset
     * @param {BinarySoundShape} shape
     */
    constructor(
        position,
        looping,
        panning,
        delay,
        falloff,
        positionEnv,
        positionEnvOffset,
        soundEnv,
        soundEnvOffset,
        shape,
    ) {
        this.position = position;
        this.looping = looping;
        this.panning = panning;
        this.delay = delay;
        this.falloff = falloff;
        this.positionEnv = positionEnv;
        this.positionEnvOffset = positionEnvOffset;
        this.soundEnv = soundEnv;
        this.soundEnvOffset = soundEnvOffset;
        this.shape = shape;
    }

    /** @returns {SoundSource} */
    toSource() {
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

const SoundsLayerVersion = {
    Normal: 0,
    Deprecated: 1,
}

export class SoundsLayer {
    /**
     * @param {string} name
     * @param {boolean} detail
     * @param {SoundSource[]} sources
     * @param {?number} sound
     */
    constructor(
        name,
        detail,
        sources,
        sound,
    ) {
        this.name = name;
        this.detail = detail;
        this.sources = sources;
        this.sound = sound;
    }

    /**
     * @param {Item} item
     * @param {Datafile} df
     * @returns {SoundsLayer}
     */
    static parse(item, df) {
        /** @type {?number} SoundsLayerVersion */
        let soundsLayerVersion = null;
        if (item.itemData[1] === 9) {
            soundsLayerVersion = SoundsLayerVersion.Deprecated;
        } else if (item.itemData[1] === 10) {
            soundsLayerVersion = SoundsLayerVersion.Normal;
        }

        const sourceAmount = item.itemData[4];
        const soundSourceData = df.decompressedDataItem(item.itemData[5]);

        /** @type {number} */
        let sourceLen = 0;
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

        /** @type {SoundSource[]} */
        const sources = arrayChunks(
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

        const sound = convertOptIndex(item.itemData[6]);
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

/** @typedef {GameLayer | TilesLayer | QuadsLayer | FrontLayer | TeleLayer | SpeedupLayer | SwitchLayer | TuneLayer | SoundsLayer | null} LayerT */
