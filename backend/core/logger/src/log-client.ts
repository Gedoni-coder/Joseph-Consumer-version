type LogLevel = 'log' | 'info' | 'warn' | 'error';

type LogMethod = (data: Record<string, unknown>, label: string) => void;

const write = (level: LogLevel, data: Record<string, unknown>, label: string) => {
    const entry = {
        level: level.toUpperCase(),
        label,
        data,
        timestamp: new Date().toISOString()
    };

    const payload = JSON.stringify(entry);

    if (level === 'error') {
        console.error(payload);
        return;
    }

    if (level === 'warn') {
        console.warn(payload);
        return;
    }

    if (level === 'info') {
        console.info(payload);
        return;
    }

    console.log(payload);
};

const logClient: Record<LogLevel, LogMethod> = {
    log: (data, label) => write('log', data, label),
    info: (data, label) => write('info', data, label),
    warn: (data, label) => write('warn', data, label),
    error: (data, label) => write('error', data, label)
};

export default logClient;
