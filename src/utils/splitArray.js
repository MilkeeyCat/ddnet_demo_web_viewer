/**
 * @template T, E
 * @param {T[]} array
 * @param {E} delimiter
 * @returns {T[][]}
 */
export function splitArray(array, delimiter) {
    /** @type {T[][]} */
    const result = [];
    let n = 0;

    for (let i = 0; i < array.length; i++) {
        if (!result[n]) {
            result[n] = [];
        }

        result[n].push(array[i]);

        if (array[i] === delimiter) {
            n++;
        }
    }

    return result;
}
