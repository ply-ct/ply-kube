import * as process from 'process';
import * as path from 'path';
import * as ply from '@ply-ct/ply';
import camelCase from 'camelcase';
import { Output } from './output';
import { WorkerOptions } from './worker';
import { Variables } from './testkube';

type ArgOptions = ply.Options & {
    testFiles?: string[];
    delay?: number;
    npmInstall?: boolean;
};

export class PlyArgs {
    readonly defaultOptions: ply.Options = {
        verbose: this.output.options.debug,
        reporter: 'json'
    };
    readonly defaultRunOptions: ply.RunOptions = {
        trusted: true
    };

    readonly testFiles?: string[];
    readonly workerOptions: WorkerOptions;

    constructor(private output: Output, args: string[], vars: Variables) {
        output.debug('Ply arguments', args);
        output.debug('Variables', vars);

        const defaults = { ...new ply.Defaults(), ...this.defaultOptions };

        const argOptions = this.parse(args);
        output.debug('Parsed options', argOptions);

        const allOptions = {
            ...new ply.Config(defaults as ply.PlyOptions, true).options,
            ...argOptions
        };

        const { testFiles, delay, npmInstall, runOptions, ...plyOptions } = allOptions;
        if (testFiles) plyOptions.skip = ''; // override skip when test files specified
        this.testFiles = testFiles;

        const fallbackDefaults = new ply.Defaults(plyOptions.testsLocation);
        if (!plyOptions.expectedLocation) {
            plyOptions.expectedLocation = fallbackDefaults.expectedLocation;
        }
        if (!plyOptions.actualLocation) {
            plyOptions.actualLocation = fallbackDefaults.actualLocation;
        }
        if (!plyOptions.logLocation) {
            plyOptions.logLocation = fallbackDefaults.logLocation;
        }

        this.workerOptions = {
            plyOptions,
            runOptions: { ...this.defaultRunOptions, ...(runOptions as ply.RunOptions) },
            ...(process.env.PLY_PATH && { plyPath: path.resolve(process.env.PLY_PATH) }),
            delay,
            npmInstall
        };

        for (const key of Object.keys(vars)) {
            const runVar = vars[key];
            if (runVar.value) {
                if (!this.workerOptions.runOptions.values) {
                    this.workerOptions.runOptions.values = {};
                }
                this.workerOptions.runOptions.values[key] = runVar.value;
            }
        }

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
            (options as any)[name] = arg.substring(eq + 1).replace(/%20/g, ' ');
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
