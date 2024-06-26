import { BeI32 } from './nums';

/**
 * @param {Int32Array} data
 * @param {TextDecoder} textDecoder
 * @returns {string}
 */
export function parseI32String(data, textDecoder) {
    /** @type {number[]} */
    const bytes = Array.from(data)
        .map((number) => BeI32.fromI32(number).map((byte) => byte - 128))
        .flat();
    bytes.splice(bytes.indexOf(0));

    return textDecoder.decode(new Uint8Array(bytes));
}
