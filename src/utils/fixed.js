//NOTE: heres me ultra mega implementation of fixed point whatever the fuck it is
class Fixed {
    /**
     * @param {number} num
     * @param {number} fracBits
     */
    constructor(num, fracBits) {
        this.num = num;
        this.fracBits = fracBits;
    }

    /** @returns {number} */
    toFloat() {
        return this.num / (1 << this.fracBits);
    }
}

export class I27F5 {
    /**
     * @param {number} num
     * @returns {number}
     */
    static gimmeFloat(num) {
        return new Fixed(num, 5).toFloat();
    }
}

export class I17F15 {
    /**
     * @param {number} num
     * @returns {number}
     */
    static gimmeFloat(num) {
        return new Fixed(num, 15).toFloat();
    }
}

export class I22F10 {
    /**
     * @param {number} num
     * @returns {number}
     */
    static gimmeFloat(num) {
        return new Fixed(num, 10).toFloat();
    }
}
