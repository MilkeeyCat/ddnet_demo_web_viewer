export function splitArray<T, E>(array: T[], delimiter: E): T[][] {
    const result: T[][] = [];
    let n = 0;

    for (let i = 0; i < array.length; i++) {
        if (!result[n]) {
            result[n] = [];
        }

        result[n]!.push(array[i]!);

        if (array[i] === delimiter) {
            n++;
        }
    }

    return result;
}
