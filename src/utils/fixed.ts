//NOTE: heres me ultra mega implementation of fixed point whatever the fuck it is
class Fixed {
    constructor(
        public num: number,
        public fracBits: number,
    ) {}

    toFloat(): number {
        return this.num / (1 << this.fracBits);
    }
}

export class I27F5 {
    public static gimmeFloat(num: number): number {
        return new Fixed(num, 5).toFloat();
    }
}

export class I17F15 {
    public static gimmeFloat(num: number): number {
        return new Fixed(num, 15).toFloat();
    }
}

export class I22F10 {
    public static gimmeFloat(num: number): number {
        return new Fixed(num, 10).toFloat();
    }
}
