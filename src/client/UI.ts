import { Graphics } from './Graphics';
import { UIRect } from './UIRect';

export class UI {
    screen: UIRect;

    constructor(public graphics: Graphics) {
        this.screen = new UIRect(0, 0, 0, 0);
    }

    getScreen(): UIRect {
        this.screen.h = 600;
        this.screen.w = this.graphics.screenAspect() * this.screen.h;

        return this.screen;
    }

    mapScreen(): void {
        const screen = this.getScreen();

        this.graphics.mapScreen(screen.x, screen.y, screen.w, screen.h);
    }
}
