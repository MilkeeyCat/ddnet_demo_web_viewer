//class GameTile {
//    constructor(
//        public id: number,
//        public flags: number,
//        public skip: number,
//        public unused: number
//    ) { }
//}

export class Rect {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) { }
}

class Quad {
    constructor(
        //corners = [Vec2<I17F15>; 4]
        public corners: any[][],
        public position: [number, number],
        public colors: [Rgba, Rgba, Rgba, Rgba],
        public textureCoords: any, //TODO: fix meeee
        public positionEnv: number | null,
        public positionEnvOffset: number | null,
        public colorEnv: number | null,
        public colorEnvOffset: number | null
    ) { }

}

class Rgba {
    constructor(
        public r: number,
        public g: number,
        public b: number,
        public a: number
    ) { }
}

export class GameLayer {
    constructor(
        public tiles: Uint8Array
    ) { }
}

export class FrontLayer {
    constructor(
        public tiles: Uint8Array
    ) { }
}

export class TeleLayer {
    constructor(
        public tiles: Uint8Array
    ) { }
}

export class SpeedupLayer {
    constructor(
        public tiles: Uint8Array
    ) { }
}

export class SwitchLayer {
    constructor(
        public tiles: Uint8Array
    ) { }
}

export class TuneLayer {
    constructor(
        public tiles: Uint8Array
    ) { }
}


class AutomapperConfig {
    constructor(
        public config: number | null,
        public seed: number,
        public automatic: boolean
    ) { }
}

class RectangleSoundArea {
    constructor(
        public area: Rect
    ) { }
}

class CircleSoundArea {
    constructor(
        public area: Rect
    ) { }
}

type SoundArea =
    typeof RectangleSoundArea
    | typeof CircleSoundArea;

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
        public soundEnvOffset: number
    ) { }
}

export class TilesLayer {
    constructor(
        public name: string,
        public detail: boolean,
        public color: Rgba,
        public colorEnv: number | null,
        public colorEnvOffset: number | null,
        public image: number | null,
        public tiles: Uint8Array,
        public automapperConfig: AutomapperConfig
    ) { }
}

export class QuadsLayer {
    constructor(public name: string,
        public detail: boolean,
        public quads: Quad[],
        public image: number | null
    ) { }
}

export class SoundsLayer {
    constructor(
        public name: string,
        public detail: boolean,
        public sources: SoundSource[],
        public sound: number | null
    ) { }
}

export type Layer =
    GameLayer
    | TilesLayer
    | QuadsLayer
    | FrontLayer
    | TeleLayer
    | SpeedupLayer
    | SwitchLayer
    | TuneLayer
    | SoundsLayer
    | null;
