import { Game } from '../game';
import { Huffman } from '../huffman';
import { FREQUENCIES } from '../huffman/frequencies';
import { TwMap } from '../map';
import { Reader } from '../reader';
import { LeI32 } from '../utils/nums';
import { Message } from './Message';
import { Snapshot } from './Snapshot';
import { SnapshotDelta } from './SnapshotDelta';
import { Tick } from './Tick';

type VersionHeader = {
    magic: number[];
    version: number;
};

type Header = {
    netVersion: string;
    mapName: string;
    mapSize: number;
    mapCrc: number;
    type: 'client' | 'server';
    length: number;
    timestamp: string;
};

type TimelineMarkers = {
    numTimelineMarkers: number;
    timelineMarkers: number[];
};

type Demo = {
    versionHeader: VersionHeader;
    header: Header;
    map: TwMap;
    timelineMarkers: TimelineMarkers;
    chunks: (Chunk | ReturnType<typeof Game.decodeMsg>)[];
};

type ChunkHeader =
    | {
          isTick: false;
          type: 'MESSAGE' | 'SNAPSHOT' | 'SNAPSHOT_DELTA';
          size: number;
      }
    | {
          isTick: true;
          inlineTick: boolean;
          tickDelta: number;
      };

type Chunk = Message | Tick | Snapshot | SnapshotDelta;

const huffman = Huffman.fromFrequencies(FREQUENCIES);

export class DemoReader {
    buffer: Uint8Array;
    demo: Demo;
    tick: number;

    constructor(data: Uint8Array) {
        const textDecoder = new TextDecoder();
        this.buffer = data;
        this.tick = 0;

        const magic = Array.from(this.readRaw(7));
        const version = this.readRaw(1)[0]!;

        const netVersion = textDecoder.decode(
            this.readRaw(64).filter((byte) => byte != 0),
        );
        const mapName = textDecoder.decode(
            this.readRaw(64).filter((byte) => byte != 0),
        );
        const mapSize = this.readBeI32();
        const mapCrc = this.readBeI32();
        const type = textDecoder.decode(
            this.readRaw(8).filter((byte) => byte != 0),
        ) as 'client' | 'server';
        const length = this.readBeI32();
        const timestamp = textDecoder.decode(
            this.readRaw(20).filter((byte) => byte != 0),
        );

        const numTimelineMarkers = this.readBeI32();
        const timelineMarkers = new Array(64).fill(0);

        for (let i = 0; i < timelineMarkers.length; i++) {
            const markerValue = this.readBeI32();

            timelineMarkers[i] = markerValue;
        }

        this.skip(32 + 16);
        const map = TwMap.fromBytes(this.readRaw(mapSize));

        const chunks = this.readChunks();

        this.demo = {
            versionHeader: {
                magic,
                version,
            },
            header: {
                netVersion,
                mapName,
                mapSize,
                mapCrc,
                type,
                length,
                timestamp,
            },
            timelineMarkers: {
                numTimelineMarkers,
                timelineMarkers,
            },
            map,
            chunks,
        };
    }

    public readRaw(n: number): Uint8Array {
        const result = [];

        for (let i = 0; i < n; i++) {
            //NOTE: maybe this will cause crashes in future (maybe not)
            result.push(this.buffer[i]!);
        }

        this.buffer = this.buffer.subarray(n);

        return new Uint8Array(result);
    }

    public skip(n: number): void {
        this.buffer = this.buffer.subarray(n);
    }

    public readBeI32(): number {
        const bytes = this.readRaw(4);

        return (
            (bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!
        );
    }

    public readLeI16(): number {
        const bytes = this.readRaw(2);

        return (bytes[1]! << 8) | bytes[0]!;
    }

    public readChunkHeader(): ChunkHeader {
        const byte = this.readRaw(1)[0]!;
        const isTick = byte >> 7 != 0;

        if (isTick) {
            const keyframe = ((byte << 1) & 0xff) >> 7 != 0;
            const inlineTick = ((byte << 2) & 0xff) >> 7;
            const tickDelta = ((byte << 3) & 0xff) >> 3;

            if (inlineTick == 0) {
                this.tick = this.readBeI32();

                return {
                    isTick: true,
                    tickDelta,
                    inlineTick: inlineTick == 0,
                };
            } else {
                this.tick += tickDelta;

                return {
                    isTick: true,
                    tickDelta,
                    inlineTick: inlineTick == 0,
                };
            }
        } else {
            const chunkType = (byte << 1) >> 6;
            let size = ((byte << 3) & 0xff) >> 3;

            if (size == 30) {
                size = this.readRaw(1)[0]!;
            } else if (size == 31) {
                size = this.readLeI16();
            }

            if (chunkType == 1) {
                return {
                    isTick: false,
                    size: size,
                    type: 'SNAPSHOT',
                };
            } else if (chunkType == 2) {
                return {
                    isTick: false,
                    size,
                    type: 'MESSAGE',
                };
            } else if (chunkType == 3) {
                return {
                    isTick: false,
                    size,
                    type: 'SNAPSHOT_DELTA',
                };
            } else {
                throw Error();
            }
        }
    }

    public readChunk(): Chunk | null {
        const chunkHeader = this.readChunkHeader();

        if (chunkHeader.isTick) {
            return new Tick(this.tick);
        } else {
            const data = huffman.decompress(this.readRaw(chunkHeader.size));

            if (chunkHeader.type == 'MESSAGE') {
                let result: number[] = [];

                let unpacker = new Reader(data);

                while (unpacker.data.length > 0) {
                    const num = unpacker.readInt();

                    const bytes = LeI32.fromI32(num);

                    result = result.concat(bytes);
                }

                return new Message(new Uint8Array(result));
            } else if (chunkHeader.type == 'SNAPSHOT') {
                return new Snapshot(data);
            } else if (chunkHeader.type == 'SNAPSHOT_DELTA') {
                return new SnapshotDelta(data);
            }
        }

        return null;
    }

    public readChunks(): (Chunk | ReturnType<typeof Game.decodeMsg>)[] {
        const chunks: (Chunk | ReturnType<typeof Game.decodeMsg>)[] = [];

        while (this.buffer.length > 0) {
            const chunk = this.readChunk();

            if (chunk) {
                if (chunk instanceof Message) {
                    const reader = new Reader(chunk.data);

                    const realChunk = Game.decode(reader);

                    chunks.push(realChunk);
                } else {
                    chunks.push(chunk);
                }
            } else {
                break;
            }
        }

        return chunks;
    }
}
