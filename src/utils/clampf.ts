export function clampf(value: number, min: number, max: number): number {
    if (value > max) {
        return max;
    } else if (value < min) {
        return min;
    }

    return value;
}
