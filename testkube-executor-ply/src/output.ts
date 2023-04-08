/* eslint-disable no-console */
import * as ply from '@ply-ct/ply';
import { ExecutionStatus } from './testkube';

export type OutputLevel = 'error' | 'info' | 'debug';

export interface OutputOptions {
    debug?: boolean;
    enabled?: boolean;
    indent?: number;
}
export class Output implements ply.Log {
    readonly options: OutputOptions;

    get level(): ply.LogLevel {
        return this.options.debug ? ply.LogLevel.debug : ply.LogLevel.info;
    }

    constructor(options: OutputOptions = {}) {
        this.options = { enabled: true, indent: 2, ...options };
    }

    private log(level: OutputLevel = 'info', message: string, obj?: any) {
        if (!this.options.enabled) return;
        if (level === 'debug' && !this.options.debug) return;
        if (typeof message !== 'string') message = '' + message;

        if (obj !== undefined) {
            if (obj.stack) {
                this.log(level, message);
                console.log(
                    JSON.stringify({
                        type: level === 'error' ? 'error' : 'log',
                        content: obj.stack,
                        time: new Date()
                    })
                );
            } else {
                this.log(level, message + ': ' + JSON.stringify(obj, null, this.options.indent));
            }
        } else {
            console.log(
                JSON.stringify({
                    type: level === 'error' ? 'error' : 'log',
                    content: message,
                    time: new Date()
                })
            );
        }
    }

    error(message: string, obj?: any) {
        this.log('error', message, obj);
    }

    info(message: string, obj?: any) {
        this.log('info', message, obj);
    }

    debug(message: string, obj?: any) {
        this.log('debug', message, obj);
    }

    result(status: ExecutionStatus, output: string, message?: string) {
        // errored
        console.log(
            JSON.stringify({
                type: 'result',
                result: {
                    status,
                    output,
                    ...(status === 'failed' && { errorMessage: message }),
                    time: new Date()
                }
            })
        );
    }

    get enabled(): boolean {
        return this.options.enabled || false;
    }

    event(eventId: string, eventObj: object) {
        console.log(
            JSON.stringify({
                type: 'event',
                content: JSON.stringify({ id: eventId, event: eventObj }),
                time: new Date()
            })
        );
    }
}
