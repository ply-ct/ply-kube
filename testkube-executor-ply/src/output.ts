/* eslint-disable no-console */
import { ExecutionStatus } from './testkube';

export type OutputLevel = 'error' | 'info' | 'debug';

export class Output {
    constructor(readonly isDebug = false) {}

    log(level: OutputLevel = 'info', message: string) {
        if (level === 'debug' && !this.isDebug) return;
        console.log(
            JSON.stringify({
                type: level === 'error' ? 'error' : 'log',
                content: message
            })
        );
    }

    error(message: string, err?: Error) {
        this.log('error', message);
        if (err) this.log('error', `${err}: ${err.stack}`);
    }

    info(message: string) {
        this.log('info', message);
    }

    debug(message: string) {
        this.log('debug', message);
    }

    result(status: ExecutionStatus, output: string, message?: string) {
        // errored
        console.log(
            JSON.stringify({
                type: 'result',
                result: {
                    status,
                    output,
                    ...(status === 'failed' && { errorMessage: message })
                }
            })
        );
    }

    event() {
        // TODO
    }
}
