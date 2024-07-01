import {
    Datafile,
    ExType,
    Image,
    Info,
    RawDatafile,
    Sound,
    Version,
    Group,
    parseAll,
    parseSingleItemOnly,
    Layer,
    parseEnvPoints,
    Envelope,
    EnvPoint,
} from '../datafile';
import { LayerT } from '../datafile/Layer';

export class TwMap {
    /**
     * @param {Version} version
     * @param {Info} info
     * @param {Image[]} images
     * @param {Envelope[]} envelopes
     * @param {Group[]} groups
     * @param {Sound[]} sounds
     */
    constructor(
        version,
        info,
        images,
        envelopes,
        groups,
        sounds,
    ) {
        /** @type {Version} */
        this.version = version;
        /** @type {Info} */
        this.info = info;
        /** @type {Image[]} */
        this.images = images;
        /** @type {Envelope[]} */
        this.envelopes = envelopes;
        /** @type {Group[]} */
        this.groups = groups;
        /** @type {Sound[]} */
        this.sounds = sounds;
    }

    /**
     * @param {Uint8Array} bytes
     * @returns {TwMap}
     */
    static fromBytes(bytes) {
        const rawDogDatafile = new RawDatafile(bytes);
        const datafile = new Datafile(rawDogDatafile);

        return this.parseDatafile(datafile);
    }

    /**
     * @param {Datafile} df
     * @returns {TwMap}
     */
    static parseDatafile(df) {
        const ex = parseAll(ExType, df, new Map());
        const version = parseSingleItemOnly(Version, df, new Map());
        const info = parseSingleItemOnly(Info, df, new Map());
        const images = parseAll(Image, df, new Map());
        const envPoints = parseEnvPoints(df, new Map());
        const envelopes = parseAll(Envelope, df, new Map());

        EnvPoint.distribute(envPoints, envelopes);

        const groups = parseAll(Group, df, new Map());
        //const layers = parseAll<typeof Layer, LayerT>(Layer, df, new Map());
        const layers = parseAll(Layer, df, new Map());
        //NOTE: someone gotta do check version for layer :DDDD
        Layer.distribute(layers, groups);

        const sounds = parseAll(Sound, df, new Map());
        //TODO: automappers

        return new TwMap(version, info, images, envelopes, groups, sounds);
    }
}
