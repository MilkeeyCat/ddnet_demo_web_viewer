import {
    BufferContainerAttribute,
    BufferContainerInfo,
} from '../CommandWebGL2CommandProcessorFragment';
import { GRAPHICS_TYPE_FLOAT } from '../Graphics';
import { ColorRGBA, Point } from '../common';
import { Component } from '../component';

class GraphicTile {
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;

    constructor(x: number, y: number, scale = 32) {
        this.topLeft = new Point(x * scale, y * scale);
        this.topRight = new Point(x * scale + scale, y * scale);
        this.bottomLeft = new Point(x * scale, y * scale + scale);
        this.bottomRight = new Point(x * scale + scale, y * scale + scale);
    }

    toArray(): number[] {
        return [
            this.bottomLeft.x,
            this.bottomLeft.y,
            this.bottomRight.x,
            this.bottomRight.y,
            this.topRight.x,
            this.topRight.y,
            this.topLeft.x,
            this.topLeft.y,
        ];
    }
}

class TileVisual {
    indexBufferByteOffset: number;

    constructor() {
        this.indexBufferByteOffset = 0;
    }

    doDraw(): boolean {
        return (this.indexBufferByteOffset & 0x10000000) != 0;
    }

    draw(setDraw: boolean): void {
        this.indexBufferByteOffset =
            (setDraw ? 0x10000000 : 0) |
            (this.indexBufferByteOffset & 0xefffffff);
    }

    getIndexBufferByteOffset(): number {
        return (this.indexBufferByteOffset & 0xefffffff) * 6 * 4;
    }

    setIndexBufferByteOffset(indexBufferByteOffset: number): void {
        this.indexBufferByteOffset =
            indexBufferByteOffset | (this.indexBufferByteOffset & 0x10000000);
    }

    addIndexBufferByteOffset(indexBufferByteOffset: number): void {
        this.indexBufferByteOffset =
            ((this.indexBufferByteOffset & 0xefffffff) +
                indexBufferByteOffset) |
            (this.indexBufferByteOffset & 0x10000000);
    }
}

class TileLayerVisuals {
    bufferContainerIndex: number;
    tilesOfLayer: TileVisual[];

    constructor(
        public width: number,
        public height: number,
        public isTextured: boolean,
    ) {
        this.tilesOfLayer = new Array(width * height)
            .fill(null)
            .map(() => new TileVisual());
    }
}

export class Test extends Component {
    tileLayerVisuals: TileLayerVisuals[];

    override async onInit(): Promise<void> {
        this.tileLayerVisuals = [];
    }

    override onRender(): void {
        if (this.tileLayerVisuals.length) {
            const width = this.client.gameLayer.tiles.loadInfo.size[0];
            const height = this.client.gameLayer.tiles.loadInfo.size[1];

            const center = this.client.camera.center;
            this.renderTools.mapScreenToGroup(
                center.x,
                center.y,
                {
                    parallaxX: 100,
                    parallaxY: 100,
                    offsetX: 0,
                    offsetY: 0,
                },
                this.client.camera.zoom,
            );

            const [screenX0, screenY0, screenX1, screenY1] =
                this.graphics.getScreen();

            let x0 = Math.floor(screenX0 / 32);
            let y0 = Math.floor(screenY0 / 32);
            let x1 = Math.ceil(screenX1 / 32);
            let y1 = Math.ceil(screenY1 / 32);

            if (x0 < 0) {
                x0 = 0;
            }
            if (y0 < 0) {
                y0 = 0;
            }
            if (x1 > width) {
                x1 = width;
            }
            if (y1 > height) {
                y1 = height;
            }

            const offsets = [];
            const drawCounts = [];
            const visuals = this.tileLayerVisuals[0]!;

            for (let y = y0; y < y1; y++) {
                if (x0 > x1) {
                    continue;
                }
                const xr = x1 - 1;

                drawCounts.push(
                    (visuals.tilesOfLayer[
                        y * width + xr
                    ]!.getIndexBufferByteOffset() -
                        visuals.tilesOfLayer[
                            y * width + x0
                        ]!.getIndexBufferByteOffset()) /
                        4 +
                        (visuals.tilesOfLayer[y * width + xr]!.doDraw()
                            ? 6
                            : 0),
                );
                offsets.push(
                    visuals.tilesOfLayer[
                        y * width + x0
                    ]!.getIndexBufferByteOffset(),
                );
            }

            this.graphics.renderTileLayer(
                this.tileLayerVisuals[0]!.bufferContainerIndex,
                new ColorRGBA(0.1, 0.5, 0.5, 1),
                offsets,
                drawCounts,
                offsets.length,
            );
        }
    }

    override onMapLoad(): void {
        const width = this.client.gameLayer.tiles.loadInfo.size[0];
        const height = this.client.gameLayer.tiles.loadInfo.size[1];

        const tiles = this.client.gameLayer.decompress();
        this.tileLayerVisuals.push(new TileLayerVisuals(width, height, false));
        const visuals =
            this.tileLayerVisuals[this.tileLayerVisuals.length - 1]!;
        const graphicTiles = [];

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tilesHandledCount = graphicTiles.length;
                visuals.tilesOfLayer[y * width + x]!.setIndexBufferByteOffset(
                    tilesHandledCount,
                );

                if (tiles[y * width + x]!.id !== 0) {
                    graphicTiles.push(new GraphicTile(x, y));
                    visuals.tilesOfLayer[y * width + x]!.draw(true);
                }
            }
        }

        const data = graphicTiles.flatMap((tile) => tile.toArray());

        const bufferObjectIndex = this.graphics.createBufferObject(
            new Float32Array(data),
        );
        const containerInfo = new BufferContainerInfo(0, bufferObjectIndex, [
            new BufferContainerAttribute(2, GRAPHICS_TYPE_FLOAT, false, 0, 0),
        ]);

        visuals.bufferContainerIndex =
            this.graphics.createBufferContainer(containerInfo);

        this.graphics.indicesNumRequiredNotify(graphicTiles.length * 6);
    }
}
