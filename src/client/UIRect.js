import { Graphics } from './Graphics';
import { ColorRGBA, Point } from './common';

export class UIRect {
    /** @type {Graphics} */
    static graphics;

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    /** @returns {UIRect} */
    static default() {
        return new UIRect(0, 0, 0, 0);
    }

    /** @param {Graphics} graphics */
    static init(graphics) {
        UIRect.graphics = graphics;
    }

    /**
     * @param {?UIRect} top
     * @param {?UIRect} bottom
     * @param {number} spacing
     */
    hSplitMid(top, bottom, spacing) {
        const cut = this.h / 2;
        const halfSpacing = spacing / 2;

        if (top) {
            top.x = this.x;
            top.y = this.y;
            top.w = this.w;
            top.h = cut - halfSpacing;
        }

        if (bottom) {
            bottom.x = this.x;
            bottom.y = this.y + cut + halfSpacing;
            bottom.w = this.w;
            bottom.h = this.h - cut - halfSpacing;
        }
    }

    /**
     * @param {number} cut
     * @param {?UIRect} top
     * @param {?UIRect} bottom
     */
    hSplitTop(cut, top, bottom) {
        if (top) {
            top.x = this.x;
            top.y = this.y;
            top.w = this.w;
            top.h = cut;
        }

        if (bottom) {
            bottom.x = this.x;
            bottom.y = this.y + cut;
            bottom.w = this.w;
            bottom.h = this.h - cut;
        }
    }

    /**
     * @param {number} cut
     * @param {?UIRect} top
     * @param {?UIRect} bottom
     */
    hSplitBottom(cut, top, bottom) {
        if (top) {
            top.x = this.x;
            top.y = this.y;
            top.w = this.w;
            top.h = this.h - cut;
        }

        if (bottom) {
            bottom.x = this.x;
            bottom.y = this.y + this.h - cut;
            bottom.w = this.w;
            bottom.h = cut;
        }
    }

    /**
     * @param {?UIRect} left
     * @param {?UIRect} right
     * @param {number} spacing
     */
    vSplitMid(left, right, spacing) {
        const cut = this.w / 2;
        const halfSpacing = spacing / 2;

        if (left) {
            left.x = this.x;
            left.y = this.y;
            left.w = cut - halfSpacing;
            left.h = this.h;
        }

        if (right) {
            right.x = this.x + cut + halfSpacing;
            right.y = this.y;
            right.w = this.w - cut - halfSpacing;
            right.h = this.h;
        }
    }

    /**
     * @param {number} cut
     * @param {?UIRect} left
     * @param {?UIRect} right
     */
    vSplitLeft(cut, left, right) {
        if (left) {
            left.x = this.x;
            left.y = this.y;
            left.w = cut;
            left.h = this.h;
        }

        if (right) {
            right.x = this.x + cut;
            right.y = this.y;
            right.w = this.w - cut;
            right.h = this.h;
        }
    }

    /**
     * @param {number} cut
     * @param {?UIRect} left
     * @param {?UIRect} right
     */
    vSplitRight(cut, left, right) {
        if (left) {
            left.x = this.x;
            left.y = this.y;
            left.w = this.w - cut;
            left.h = this.h;
        }

        if (right) {
            right.x = this.x + this.w - cut;
            right.y = this.y;
            right.w = cut;
            right.h = this.h;
        }
    }

    /**
     * @param {Point} cut
     * @param {UIRect} rect
     */
    _margin(cut, rect) {
        rect.x = this.x + cut.x;
        rect.y = this.y + cut.y;
        rect.w = this.w - 2 * cut.x;
        rect.h = this.h - 2 * cut.y;
    }

    /**
     * @param {number} cut
     * @param {UIRect} rect
     */
    margin(cut, rect) {
        this._margin(new Point(cut, cut), rect);
    }

    /**
     * @param {number} cut
     * @param {UIRect} rect
     */
    vMargin(cut, rect) {
        this._margin(new Point(cut, 0), rect);
    }

    /**
     * @param {number} cut
     * @param {UIRect} rect
     */
    hMargin(cut, rect) {
        this._margin(new Point(0, cut), rect);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {boolean}
     */
    inside(x, y) {
        return (
            x >= this.x &&
            x < this.x + this.w &&
            y >= this.y &&
            y < this.y + this.h
        );
    }

    /**
     * @param {ColorRGBA} color
     * @param {number} corners
     * @param {number} rounding
     */
    draw(color, corners, rounding) {
        UIRect.graphics.drawRect(
            this.x,
            this.y,
            this.w,
            this.h,
            color,
            corners,
            rounding,
        );
    }

    /**
     * @param {ColorRGBA} colorTopLeft
     * @param {ColorRGBA} colorTopRight
     * @param {ColorRGBA} colorBottomLeft
     * @param {ColorRGBA} colorBottomRight
     * @param {number} rounding
     * @param {number} corners
     */
    draw4(
        colorTopLeft,
        colorTopRight,
        colorBottomLeft,
        colorBottomRight,
        corners,
        rounding,
    ) {
        UIRect.graphics.drawRect4(
            this.x,
            this.y,
            this.w,
            this.h,
            colorTopLeft,
            colorTopRight,
            colorBottomLeft,
            colorBottomRight,
            corners,
            rounding,
        );
    }

    /**
     * @returns {Point}
     */
    center() {
        return new Point(this.x + this.w / 2, this.y + this.h / 2);
    }
}
