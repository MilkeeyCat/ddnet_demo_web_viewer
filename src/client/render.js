import { clampf } from '@/utils/clampf';
import { Graphics } from './Graphics';

export class RenderTools {
    /** @param {Graphics} graphics */
    constructor(graphics) {
        this.graphics = graphics;
    }

    /**
     * @param {number} aspect
     * @param {number} zoom
     * @returns {[number, number]}
     */
    calcScreenParams(aspect, zoom) {
        let width;
        let heigth;

        const amount = 1150 * 1000;
        const wMax = 1500;
        const hMax = 1050;

        const f = Math.sqrt(amount) / Math.sqrt(aspect);
        width = f * aspect;
        heigth = f;

        // limit the view
        if (width > wMax) {
            width = wMax;
            heigth = width / aspect;
        }

        if (heigth > hMax) {
            heigth = hMax;
            width = heigth * aspect;
        }

        width *= zoom;
        heigth *= zoom;

        return [width, heigth];
    }

    /**
     * @param {number} centerX
     * @param {number} centerY
     * @param {number} parallaxX
     * @param {number} parallaxY
     * @param {number} parallaxZoom
     * @param {number} offsetX
     * @param {number} offsetY
     * @param {number} aspect
     * @param {number} zoom
     * @returns {[number, number, number, number]}
     */
    mapScreenToWorld(
        centerX,
        centerY,
        parallaxX,
        parallaxY,
        parallaxZoom,
        offsetX,
        offsetY,
        aspect,
        zoom,
    ) {
        let [width, height] = this.calcScreenParams(aspect, zoom);

        const scale = (parallaxZoom * (zoom - 1) + 100) / 100 / zoom;
        width *= scale;
        height *= scale;

        let points = [0, 0, 0, 0];

        centerX *= parallaxX / 100;
        centerY *= parallaxY / 100;
        points[0] = offsetX + centerX - width / 2;
        points[1] = offsetY + centerY - height / 2;
        points[2] = points[0] + width;
        points[3] = points[1] + height;

        return /** @type {[number, number, number, number]} */ (points);
    }

    /**
     * @param {number} centerX
     * @param {number} centerY
     * @param {any} group What the fuck is that?
     * @param {number} zoom
     */
    mapScreenToGroup(centerX, centerY, group, zoom) {
        /** @type {number} */
        const paralaxZoom = clampf(
            Math.max(group.parallaxX, group.parallaxY),
            0,
            100,
        );
        /** @type {[number, number, number, number]} */
        const points = this.mapScreenToWorld(
            centerX,
            centerY,
            group.parallaxX,
            group.parallaxY,
            paralaxZoom,
            group.offsetX,
            group.offsetY,
            this.graphics.screenAspect(),
            zoom,
        );

        this.graphics.mapScreen(points[0], points[1], points[2], points[3]);
    }
}
