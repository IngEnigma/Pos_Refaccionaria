interface Window {
    desktop: {
        minimize: () => void;
        close: () => void;
        getAppVersion: () => Promise<string>;
        printTest: () => Promise<{
            success: boolean;
            message: string;
        }>;
        generateTicket: (ticket: unknown) => Promise<{
            success: boolean;
            bytes?: number;
            preview?: string;
            message?: string;
        }>;
    };
}