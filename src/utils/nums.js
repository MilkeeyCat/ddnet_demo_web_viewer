export class LeI32 {
    /**
     * @param {number} num
     * @returns {[number, number, number, number]}
     */
    static fromI32(num) {
        return [
            num & 0xff,
            (num >> 8) & 0xff,
            (num >> 16) & 0xff,
            (num >> 24) & 0xff,
        ];
    }
}

export class BeI32 {
    /**
     * @param {number} num
     * @returns {[number, number, number, number]}
     */
    static fromI32(num) {
        return [
            (num >> 24) & 0xff,
            (num >> 16) & 0xff,
            (num >> 8) & 0xff,
            num & 0xff,
        ];
    }
}
