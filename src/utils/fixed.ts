//NOTE: heres me ultra mega implementation of fixed point whatever the fuck it is
class Fixed {
    constructor(
        public num: number,
        public fracBits: number
    ) { }

    toFloat() {
        return this.num / (1 << this.fracBits);
    }
}

export class I27F5 {
    public static gimmeFloat(num: number) {
        return new Fixed(num, 5).toFloat();
    }
}
