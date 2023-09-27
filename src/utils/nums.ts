export class LeI32 {
    static fromI32(num: number): [number, number, number, number] {
        return [
            num & 0xff,
            (num >> 8) & 0xff,
            (num >> 16) & 0xff,
            (num >> 24) & 0xff,
        ]
    }
}

export class BeI32 {
    static fromI32(num: number): [number, number, number, number] {
        return [
            (num >> 24) & 0xff,
            (num >> 16) & 0xff,
            (num >> 8) & 0xff,
            num & 0xff,
        ]
    }
}
