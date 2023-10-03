import { Datafile, ExType, Image, Info, RawDatafile, Sound, Version, Group, parseAll, parseSingleItemOnly, Layer, parseEnvPoints } from '../datafile';
import { LayerT } from '../datafile/Layer';

export class CMap {
    constructor(bytes: Uint8Array) {
        const rawDogDatafile = new RawDatafile(bytes);
        const datafile = new Datafile(rawDogDatafile);

        this.parseDatafile(datafile);
    }

    parseDatafile(df: Datafile) {
        //@ts-ignore
        const ex = parseAll(ExType, df, new Map());
        //@ts-ignore
        const version = parseSingleItemOnly(Version, df, new Map());
        //@ts-ignore
        const info = parseSingleItemOnly(Info, df, new Map());
        //@ts-ignore
        const images = parseAll(Image, df, new Map());
        //@ts-ignore
        const envPoints = parseEnvPoints(df, new Map());
        //@ts-ignore
        //TODO: fix this xD
        //const envelopes = parseAll(Envelope, df, new Map());
        //console.log(envelopes);
        //EnvPoint.distribute(envPoints, envelopes as Envelope[]);
        //console.log(envelopes);
        //NOTE: leave envelopes as they are for now

        //FIXME: gotta do something about these `as`
        const groups = parseAll(Group, df, new Map()) as Group[];
        const layers = parseAll(Layer, df, new Map()) as LayerT[];
        //console.log(layers);
        //NOTE: someone gotta do check version for layer :DDDD
        Layer.distribute(layers, groups);

        //@ts-ignore
        const sounds = parseAll(Sound, df, new Map());

        //TODO: automappers
    }
}
