import { Datafile, ExType, Image, Info, RawDatafile, Sound, Version, parseAll, parseSingleItemOnly } from '../datafile';

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

        //TODO: envelopes :p
        //TODO: envelope points as well :p
        //TODO: groups...
        //TODO: layers

        //@ts-ignore
        const sounds = parseAll(Sound, df, new Map());

        //TODO: automappers
    }
}
