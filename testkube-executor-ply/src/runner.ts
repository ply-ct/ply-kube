import * as process from 'process';
import * as path from 'path';
import * as ply from '@ply-ct/ply';
import * as glob from 'glob';
import { Output } from './output';
import { PlyWorker } from './worker';

export class PlyRunner {
    readonly options: ply.PlyOptions;
    readonly runOptions?: ply.RunOptions;

    constructor(readonly output: Output) {
        const opts = new ply.Config(new ply.Defaults(), true).options;
        output.debug(`Ply options: ${JSON.stringify(opts, null, 2)}`);
        const { runOptions, ...options } = opts;
        this.options = options;
        if (this.output.isDebug) this.options.verbose = true;
        this.runOptions = runOptions;
    }

    async runTests() {
        this.output.debug('Running ply tests...');
        const tests: string[] = await this.findTests();
        this.output.debug(`Tests: ${JSON.stringify(tests, null, 2)}`);

        const worker = new PlyWorker(
            {
                plyOptions: this.options,
                runOptions: this.runOptions,
                ...(process.env.PLY_PATH && { plyPath: path.resolve(process.env.PLY_PATH) })
            },
            this.output
        );

        await worker.run(tests);
    }

    async findTests(): Promise<string[]> {
        this.output.info(`Finding ply tests under: ${path.resolve(this.options.testsLocation)}`);
        const globOptions = { cwd: this.options.testsLocation, ignore: this.options.ignore };

        const promises = [
            this.options.requestFiles,
            this.options.flowFiles,
            this.options.caseFiles
        ].map((pattern) => {
            return new Promise<string[]>((resolve, reject) => {
                glob(pattern, globOptions, (err, files) => {
                    if (err) reject(err);
                    else resolve(files);
                });
            });
        });

        return (await Promise.all(promises)).reduce((accum, files) => {
            accum.push(
                ...files.map((f) => (path.isAbsolute(f) ? f : `${this.options.testsLocation}/${f}`))
            );
            return accum;
        }, []);
    }
}
