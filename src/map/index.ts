import { Datafile, ExType, Image, Info, RawDatafile, Sound, Version, Group, parseAll, parseSingleItemOnly, Layer, parseEnvPoints, Envelope, EnvPoint } from '../datafile';
import { LayerT } from '../datafile/Layer';

export class TwMap {
    constructor(
        public version: Version,
        public info: Info,
        public images: Image[],
        public envelopes: Envelope[],
        public groups: Group[],
        public sounds: Sound[]

    ) { }

    static fromBytes(bytes: Uint8Array): TwMap {
        const rawDogDatafile = new RawDatafile(bytes);
        const datafile = new Datafile(rawDogDatafile);

        return this.parseDatafile(datafile);
    }

    static parseDatafile(df: Datafile): TwMap {
        //@ts-ignore
        const ex = parseAll(ExType, df, new Map());
        const version = parseSingleItemOnly(Version, df, new Map());
        const info = parseSingleItemOnly(Info, df, new Map());
        const images = parseAll(Image, df, new Map());
        const envPoints = parseEnvPoints(df, new Map());
        const envelopes = parseAll(Envelope, df, new Map());
        EnvPoint.distribute(envPoints, envelopes);

        //FIXME: gotta do something about these `as`
        const groups = parseAll(Group, df, new Map());
        //FIXME: ehm.... not gud
        const layers = parseAll(Layer, df, new Map()) as any as LayerT[];

        //NOTE: someone gotta do check version for layer :DDDD
        Layer.distribute(layers, groups);

        const sounds = parseAll(Sound, df, new Map());
        //TODO: automappers

        return new TwMap(
            version,
            info,
            images,
            envelopes,
            groups,
            sounds,
        );
    }
}
