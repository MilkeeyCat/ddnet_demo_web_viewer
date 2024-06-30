export class ColorRGBA {
    /**
     * @param {number} r
     * @param {number} g
     * @param {number} b
     * @param {number} a
     */
    constructor(r, g, b, a) {
        /** @type {number} */
        this.r = r;
        /** @type {number} */
        this.g = g;
        /** @type {number} */
        this.b = b;
        /** @type {number} */
        this.a = a;
    }

    /** @returns {ColorRGBA} */
    clone() {
        return new ColorRGBA(this.r, this.g, this.b, this.a);
    }

    /** @returns {[number, number, number, number]} */
    toArray() {
        return [this.r, this.g, this.b, this.a];
    }
}

export class TexCoord {
    /**
     * @param {number} u
     * @param {number} v
     */
    constructor(u, v) {
        /** @type {number} */
        this.u = u;
        /** @type {number} */
        this.v = v;
    }

    /** @returns {TexCoord} */
    clone() {
        return new TexCoord(this.u, this.v);
    }
}

export class FreeformItem {
    /**
     * @param {number} x0
     * @param {number} y0
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @param {number} x3
     * @param {number} y3
     */
    constructor(x0, y0, x1, y1, x2, y2, x3, y3) {
        /** @type {number} */
        this.x0 = x0;
        /** @type {number} */
        this.y0 = y0;
        /** @type {number} */
        this.x1 = x1;
        /** @type {number} */
        this.y1 = y1;
        /** @type {number} */
        this.x2 = x2;
        /** @type {number} */
        this.y2 = y2;
        /** @type {number} */
        this.x3 = x3;
        /** @type {number} */
        this.y3 = y3;
    }
}

export class QuadItem {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    constructor(x, y, width, height) {
        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
        /** @type {number} */
        this.width = width;
        /** @type {number} */
        this.height = height;
    }

    /** @returns {FreeformItem} */
    ToFreeForm() {
        return new FreeformItem(
            this.x,
            this.y,
            this.x + this.width,
            this.y,
            this.x,
            this.y + this.height,
            this.x + this.width,
            this.y + this.height,
        );
    }
}

export class Point {
    /**
     * @param {number} x
     * @param {number} y
     */
    constructor(x, y) {
        /** @type {number} */
        this.x = x;
        /** @type {number} */
        this.y = y;
    }

    /** @returns {Point} */
    clone() {
        return new Point(this.x, this.y);
    }
}

export class Vertex {
    /**
     * @param {Point} pos
     * @param {TexCoord} tex
     * @param {ColorRGBA} color
     */
    constructor(pos, tex, color) {
        /** @type {Point} */
        this.pos = pos;
        /** @type {TexCoord} */
        this.tex = tex;
        /** @type {ColorRGBA} */
        this.color = color;
    }

    /** @returns {Vertex} */
    clone() {
        return new Vertex(
            this.pos.clone(),
            this.tex.clone(),
            this.color.clone(),
        );
    }
}
