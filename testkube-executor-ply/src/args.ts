import * as process from 'process';
import * as path from 'path';
import * as ply from '@ply-ct/ply';
import camelCase from 'camelcase';
import { Output } from './output';
import { WorkerOptions } from './worker';

type ArgOptions = ply.Options & {
    testFiles?: string[];
    delay?: number;
    npmInstall?: boolean;
};

export class PlyArgs {
    readonly defaultOptions: ply.Options = {
        verbose: this.output.options.debug,
        reporter: 'json',
        logLocation: '.'
    };
    readonly defaultRunOptions: ply.RunOptions = {
        trusted: true
    };

    readonly testFiles?: string[];
    readonly workerOptions: WorkerOptions;

    constructor(private output: Output, readonly args: string[]) {
        output.debug('Ply arguments', args);

        const defaults = { ...new ply.Defaults(), ...this.defaultOptions };

        const argOptions = this.parse(args);
        output.debug('Parsed options', argOptions);

        const allOptions = {
            ...new ply.Config(defaults as ply.PlyOptions, true).options,
            ...argOptions
        };

        const { testFiles, delay, npmInstall, runOptions, ...plyOptions } = allOptions;
        this.testFiles = testFiles;

        this.workerOptions = {
            plyOptions,
            runOptions: { ...this.defaultRunOptions, ...(runOptions as ply.RunOptions) },
            ...(process.env.PLY_PATH && { plyPath: path.resolve(process.env.PLY_PATH) }),
            delay,
            npmInstall
        };

        output.debug('Worker options', this.workerOptions);
    }

    private parse(args: string[]): ArgOptions {
        const options: ArgOptions = {};
        for (const arg of args) {
            const eq = arg.indexOf('=');
            if (eq <= 0 || eq > arg.length - 1) {
                throw new Error('Bad ply arg: ' + arg);
            }
            const name = camelCase(arg.substring(0, eq));
            (options as any)[name] = arg.substring(eq + 1);
        }
        // TODO other common command-line options
        if (typeof options.verbose === 'string') {
            options.verbose = options.verbose === 'true';
        }
        if (typeof options.valuesFiles === 'string') {
            options.valuesFiles = ('' + options.valuesFiles).split(',').reduce((vfs, vf) => {
                vfs[vf] = true;
                return vfs;
            }, {} as { [file: string]: boolean });
        }
        if (typeof options.testFiles === 'string') {
            options.testFiles = ('' + options.testFiles).split(',');
        }
        if (typeof options.delay === 'string') {
            options.delay = parseInt(options.delay);
        }
        if (typeof options.npmInstall === 'string') {
            options.npmInstall = options.npmInstall === 'true';
        }
        return options;
    }
}
