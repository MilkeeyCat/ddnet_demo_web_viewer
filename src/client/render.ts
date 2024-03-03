import { clampf } from '@/utils/clampf';
import { Graphics } from './Graphics';

export class RenderTools {
    constructor(public graphics: Graphics) {}

    calcScreenParams(aspect: number, zoom: number): [number, number] {
        let width, heigth;

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

    mapScreenToWorld(
        centerX: number,
        centerY: number,
        parallaxX: number,
        parallaxY: number,
        parallaxZoom: number,
        offsetX: number,
        offsetY: number,
        aspect: number,
        zoom: number,
    ): [number, number, number, number] {
        let [width, height] = this.calcScreenParams(aspect, zoom);

        const scale = (parallaxZoom * (zoom - 1) + 100) / 100 / zoom;
        width *= scale;
        height *= scale;

        let points = [0, 0, 0, 0] as [number, number, number, number];

        centerX *= parallaxX / 100;
        centerY *= parallaxY / 100;
        points[0] = offsetX + centerX - width / 2;
        points[1] = offsetY + centerY - height / 2;
        points[2] = points[0] + width;
        points[3] = points[1] + height;

        return points;
    }

    mapScreenToGroup(
        centerX: number,
        centerY: number,
        group: any,
        zoom: number,
    ) {
        const paralaxZoom = clampf(
            Math.max(group.parallaxX, group.parallaxY),
            0,
            100,
        );
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
