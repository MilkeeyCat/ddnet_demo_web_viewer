import { Graphics } from './Graphics';
import { UIRect } from './UIRect';

export class UI {
    /** @param {Graphics} graphics */
    constructor(graphics) {
        /** @type {Graphics} */
        this.graphics = graphics;
        /** @type {UIRect} */
        this.screen = new UIRect(0, 0, 0, 0);
    }

    /** @returns {UIRect} */
    getScreen() {
        this.screen.h = 600;
        this.screen.w = this.graphics.screenAspect() * this.screen.h;

        return this.screen;
    }

    mapScreen() {
        /** @type {UIRect} */
        const screen = this.getScreen();

        this.graphics.mapScreen(screen.x, screen.y, screen.w, screen.h);
    }
}
