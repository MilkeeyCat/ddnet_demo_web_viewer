import { Point } from './common';

export type State = {
    blendMode: number;
    wrapMode: number;
    texture: number;
    screenTL: Point;
    screenBR: Point;

    // clip
    clipEnable: boolean;
    clipX: number;
    clipY: number;
    clipW: number;
    clipH: number;
};
