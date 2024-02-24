import { Graphics } from './Graphics';
import { ColorRGBA, Point } from './common';

export class UIRect {
    static graphics: Graphics;

    constructor(
        public x: number,
        public y: number,
        public w: number,
        public h: number,
    ) {}

    static init(graphics: Graphics): void {
        UIRect.graphics = graphics;
    }

    hSplitMid(top: UIRect, bottom: UIRect, spacing: number): void {
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

    hSplitTop(cut: number, top: UIRect, bottom: UIRect): void {
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

    hSplitBottom(cut: number, top: UIRect, bottom: UIRect): void {
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

    vSplitMid(left: UIRect, right: UIRect, spacing: number): void {
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

    vSplitLeft(cut: number, left: UIRect, right: UIRect): void {
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

    vSplitRight(cut: number, left: UIRect, right: UIRect): void {
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

    _margin(cut: Point, rect: UIRect): void {
        rect.x = this.x + cut.x;
        rect.y = this.y + cut.y;
        rect.w = this.w - 2 * cut.x;
        rect.h = this.h - 2 * cut.y;
    }

    margin(cut: number, rect: UIRect): void {
        this._margin(new Point(cut, cut), rect);
    }

    vMargin(cut: number, rect: UIRect): void {
        this._margin(new Point(cut, 0), rect);
    }

    hMargin(cut: number, rect: UIRect): void {
        this._margin(new Point(0, cut), rect);
    }

    inside(x: number, y: number): boolean {
        return (
            x >= this.x &&
            x < this.x + this.w &&
            y >= this.y &&
            y < this.y + this.h
        );
    }

    draw(color: ColorRGBA, corners: number, rounding: number): void {
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

    draw4(
        colorTopLeft: ColorRGBA,
        colorTopRight: ColorRGBA,
        colorBottomLeft: ColorRGBA,
        colorBottomRight: ColorRGBA,
        corners: number,
        rounding: number,
    ): void {
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

    center(): Point {
        return new Point(this.x + this.w / 2, this.y + this.h / 2);
    }
}
