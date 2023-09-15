import { Datafile, EnvPoint, Envelope, ExType, Image, Info, RawDatafile, Sound, Version, parseAll, parseEnvPoints, parseSingleItemOnly } from '../datafile';

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
        const envelopes = parseAll(Envelope, df, new Map());
        EnvPoint.distribute(envPoints, envelopes as Envelope[]);
        //NOTE: leave envelopes as they are for now 


        //TODO: groups...
        //TODO: layers

        //@ts-ignore
        const sounds = parseAll(Sound, df, new Map());

        //TODO: automappers
    }
}
