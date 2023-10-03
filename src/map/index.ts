import { Datafile, ExType, Image, Info, RawDatafile, Sound, Version, Group, parseAll, parseSingleItemOnly, Layer, parseEnvPoints, Envelope, EnvPoint } from '../datafile';
import { LayerT } from '../datafile/Layer';

export class CMap {
    constructor(
        public version: Version,
        public info: Info,
        public images: Image[],
        public envelopes: Envelope[],
        public groups: Group[],
        public sounds: Sound[]

    ) { }

    static fromBytes(bytes: Uint8Array): CMap {
        const rawDogDatafile = new RawDatafile(bytes);
        const datafile = new Datafile(rawDogDatafile);

        return this.parseDatafile(datafile);
    }

    static parseDatafile(df: Datafile): CMap {
        //@ts-ignore
        const ex = parseAll(ExType, df, new Map());
        const version = parseSingleItemOnly(Version, df, new Map());
        const info = parseSingleItemOnly(Info, df, new Map());
        const images = parseAll(Image, df, new Map());
        const envPoints = parseEnvPoints(df, new Map());
        const envelopes = parseAll(Envelope, df, new Map());
        EnvPoint.distribute(envPoints, envelopes as Envelope[]);

        //FIXME: gotta do something about these `as`
        const groups = parseAll(Group, df, new Map()) as Group[];
        const layers = parseAll(Layer, df, new Map()) as LayerT[];

        //NOTE: someone gotta do check version for layer :DDDD
        Layer.distribute(layers, groups);

        const sounds = parseAll(Sound, df, new Map());

        //TODO: automappers
        return new CMap(
            version as Version,
            info as Info,
            images as Image[],
            envelopes as Envelope[],
            groups as Group[],
            sounds as Sound[]
        );
    }
}
