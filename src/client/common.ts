export class ColorRGBA {
    constructor(
        public r: number,
        public g: number,
        public b: number,
        public a: number
    ) { }
}

export class TexCoord {
    constructor(
        public u: number,
        public v: number,
    ) { }
}

export class FreeformItem {
    constructor(
        public x0: number,
        public y0: number,
        public x1: number,
        public y1: number,
        public x2: number,
        public y2: number,
        public x3: number,
        public y3: number
    ) { }
}

export class QuadItem {
    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) { }

    ToFreeForm() {
        return new FreeformItem(
            this.x,
            this.y,
            this.x + this.width,
            this.y,
            this.x,
            this.y + this.height,
            this.x + this.width,
            this.y + this.height
        );
    }
}

export class Point {
    constructor(
        public x: number,
        public y: number,
    ) { }
}

export class Vertex {
    constructor(
        public pos: Point,
        public tex: TexCoord,
        public color: ColorRGBA,
    ) { }
}
