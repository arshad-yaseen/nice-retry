export const toError = (error: unknown): Error => {
    if (error instanceof Error) {
        return error;
    }
    return new Error(String(error));
};

export const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const clamp = (
    value: number,
    minVal: number,
    maxVal: number,
): number => {
    return Math.max(minVal, Math.min(value, maxVal));
};

export const randomBetween = (minVal: number, maxVal: number): number => {
    return Math.random() * (maxVal - minVal) + minVal;
};
