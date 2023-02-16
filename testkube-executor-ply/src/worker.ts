import * as ply from '@ply-ct/ply';
import { Output } from './output';
import { plyVersion } from './version';

export interface WorkerOptions {
    plyOptions: ply.Options;
    runOptions?: ply.RunOptions;
    plyPath?: string;
}

export interface WorkerResult {
    Passed: number;
    Failed: number;
    Errored: number;
    Pending: number;
    Submitted: number;
}

export class PlyWorker {
    constructor(readonly options: WorkerOptions, readonly output: Output) {}

    async run(tests: string[]): Promise<WorkerResult> {
        let msg = 'Running ply ' + (await this.getPlyVersion());
        if (this.options.plyPath) msg += this.options.plyPath;
        this.output.info(msg);

        const ply = this.options.plyPath
            ? require(this.options.plyPath + '/dist/index.js')
            : require('@ply-ct/ply');
        const Plier: typeof import('@ply-ct/ply').Plier = ply.Plier;
        const plier = new Plier();

        const start = Date.now();
        this.output.debug('Finding plyees...');
        const paths = tests.filter((test) => {
            if (ply.Plyee.isCase(test)) {
                // TODO why?
                this.output.error(`Cases not supported. Excluding: ${test}`);
                return false;
            }
            return true;
        });
        const plyees = await plier.find(paths);
        this.output.debug('Plyees: ' + JSON.stringify(plyees, null, 2));
        const results = await plier.run(plyees);
        this.output.debug('Ply results: ' + JSON.stringify(results, null, 2));
        const res: WorkerResult = { Passed: 0, Failed: 0, Errored: 0, Pending: 0, Submitted: 0 };
        results.forEach((result) => res[result.status]++);
        this.output.info('\nOverall Results: ' + JSON.stringify(res));
        this.output.info(`Overall Time: ${Date.now() - start} ms`);
        if (plier.options.outputFile) {
            new ply.Storage(plier.options.outputFile).write(
                JSON.stringify(res, null, plier.options.prettyIndent)
            );
        }
        return res;
    }

    private async getPlyVersion(): Promise<string> {
        if (this.options.plyPath) {
            // TODO
            return 'unknown';
        } else {
            return plyVersion;
        }
    }
}
