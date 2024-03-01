export function clampf(value: number, min: number, max: number) {
    if (value > max) {
        return max;
    } else if (value < min) {
        return min;
    }

    return value;
}
