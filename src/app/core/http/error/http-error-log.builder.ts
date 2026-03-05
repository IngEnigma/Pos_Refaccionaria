import { HttpErrorResponse, HttpRequest } from '@angular/common/http';

export function buildHttpErrorLog(
    req: HttpRequest<unknown>,
    error: HttpErrorResponse,
) {
    return {
        method: req.method,
        url: req.urlWithParams,
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        payload: normalizePayload(error.error),
    };
}

export function normalizePayload(payload: unknown): unknown {
    if (payload instanceof Error) {
        return {
            name: payload.name,
            message: payload.message,
        };
    }

    if (payload instanceof ProgressEvent) {
        return {
            type: payload.type,
        };
    }

    return payload;
}
