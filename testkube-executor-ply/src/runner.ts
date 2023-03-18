import * as process from 'process';
import * as path from 'path';
import * as ply from '@ply-ct/ply';
import { glob } from 'glob';
import { Output } from './output';
import { PlyWorker } from './worker';
import { PlyArgs } from './args';

export class PlyRunner {
    readonly args: PlyArgs;

    constructor(readonly output: Output, args: string[]) {
        this.args = new PlyArgs(output, args);
    }

    async runTests(): Promise<ply.OverallResults> {
        this.output.debug('Running ply tests...');
        const tests = this.args.testFiles || (await this.findTests());
        this.output.debug(`Tests: ${JSON.stringify(tests, null, 2)}`);

        const worker = new PlyWorker(this.output, {
            plyOptions: this.args.options,
            runOptions: this.args.runOptions,
            ...(process.env.PLY_PATH && { plyPath: path.resolve(process.env.PLY_PATH) }),
            npmInstall: true // TODO optional
        });

        return await worker.run(tests);
    }

    async findTests(): Promise<string[]> {
        const options = this.args.options;
        this.output.info('Finding ply tests under', path.resolve(options.testsLocation));
        const globOptions = { cwd: options.testsLocation, ignore: options.ignore };

        const promises = [options.requestFiles, options.flowFiles, options.caseFiles].map(
            (pattern) => {
                return new Promise<string[]>((resolve, reject) => {
                    glob(pattern, globOptions, (err, files) => {
                        if (err) reject(err);
                        else resolve(files);
                    });
                });
            }
        );

        return (await Promise.all(promises)).reduce((accum, files) => {
            accum.push(
                ...files.map((f) => (path.isAbsolute(f) ? f : `${options.testsLocation}/${f}`))
            );
            return accum;
        }, []);
    }
}
