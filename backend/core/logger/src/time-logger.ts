import appLogger from './log';

export type TimeLoggerConfig = {
    additionalData?: Record<string, unknown>;
};

export type TimeLogEntry = {
    startTime: number;
    endTime?: number;
    duration?: number;
};

export type TimeLogData = Record<string, TimeLogEntry>;

export class TimeLogger {
    private readonly logLabel: string;

    private readonly logData: TimeLogData;

    constructor(logLabel: string) {
        this.logLabel = logLabel;
        this.logData = {
            [logLabel]: { startTime: Date.now() }
        };
    }

    private calculateOpDuration(key: string): void {
        const entry = this.logData[key];

        if (!entry) {
            throw new Error(`No logData found for ${key}`);
        }

        entry.endTime = Date.now();
        entry.duration = entry.endTime - entry.startTime;
    }

    private logWithDuration(additionalData: Record<string, unknown> = {}) {
        this.calculateOpDuration(this.logLabel);
        appLogger({ duration: this.logData, ...additionalData }, this.logLabel);
    }

    /**
     * Indicate the start time of an operation.
     */
    start(key: string): void {
        this.logData[key] = { startTime: Date.now() };
    }

    /**
     * Indicate the end time of an operation and calculate its duration.
     */
    end(key: string): void {
        this.calculateOpDuration(key);
    }

    /**
     * Get the time log.
     */
    getLogData(): TimeLogData {
        this.calculateOpDuration(this.logLabel);
        return this.logData;
    }

    /**
     * Log duration.
     */
    log(config: TimeLoggerConfig = {}): void {
        this.logWithDuration(config.additionalData ?? {});
    }
}
