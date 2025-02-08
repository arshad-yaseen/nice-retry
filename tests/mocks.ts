export const createMockResponse = (
    status = 200,
    statusText = 'OK',
): Response => {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText,
    } as Response;
};

export const mockFetch = (response: Response | Error) => {
    return async () => {
        if (response instanceof Error) {
            throw response;
        }
        return response;
    };
};

export const mockFetchWithDelay = (
    response: Response | Error,
    delay: number = 200,
) => {
    return async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return mockFetch(response)();
    };
};
