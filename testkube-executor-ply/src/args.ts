import * as ply from '@ply-ct/ply';
import camelCase from 'camelcase';
import { Output } from './output';

export class PlyArgs {
    readonly defaultOptions: ply.Options = {
        verbose: this.output.options.debug,
        reporter: 'json'
    };
    readonly defaultRunOptions: ply.RunOptions = {
        trusted: true
    };

    readonly options: ply.PlyOptions;
    readonly runOptions: ply.RunOptions;

    constructor(private output: Output, readonly args: string[]) {
        output.debug('Ply arguments', args);

        const defaults = { ...new ply.Defaults(), ...this.defaultOptions };

        const argOptions = this.parse(args);
        output.info('Passed ply options', argOptions);

        const allOptions = {
            ...new ply.Config(defaults as ply.PlyOptions, true).options,
            ...argOptions
        };

        const { runOptions, ...options } = allOptions;

        output.debug('Options', options);
        output.debug('Run options', runOptions);

        this.options = options;
        this.runOptions = runOptions as ply.RunOptions;
    }

    private parse(args: string[]): ply.Options {
        const options: ply.Options = {};
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
        return options;
    }
}
