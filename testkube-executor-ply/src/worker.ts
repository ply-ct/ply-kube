import { execFile as cpExecFile } from 'child_process';
import { promisify } from 'util';
import * as ply from '@ply-ct/ply';
import * as flowbee from 'flowbee';
import * as tsNode from 'ts-node';
import { Output } from './output';
import { OverallResults } from './results';
import { plyVersion } from './version';

export interface WorkerOptions {
    plyOptions: ply.Options;
    runOptions?: ply.RunOptions;
    plyPath?: string;
    npmInstall?: boolean;
}

export class PlyWorker {
    constructor(readonly options: WorkerOptions, readonly output: Output) {}

    async npmInstall() {
        this.output.info('Running npm install...');
        const execFile = promisify(cpExecFile);
        const { stdout, stderr } = await execFile('npm', ['install', '--omit=optional']);
        if (stderr) {
            this.output.error(stderr);
        }
        if (stdout) {
            this.output.info(stdout);
        }
    }

    async run(tests: string[]): Promise<OverallResults> {
        if (this.options.npmInstall) {
            await this.npmInstall();
        }

        // module.paths.push(process.cwd(), `${process.cwd}/node_modules`);
        tsNode.register({ transpileOnly: true });

        let msg = 'Running ply ' + (await this.getPlyVersion()) + ' in cwd: ' + process.cwd();
        if (this.options.plyPath) msg += this.options.plyPath;
        this.output.info(msg);

        const ply = this.options.plyPath
            ? require(this.options.plyPath + '/dist/index.js')
            : require('@ply-ct/ply');
        const Plier: typeof import('@ply-ct/ply').Plier = ply.Plier;
        const plier = new Plier(this.options.plyOptions, this.output);

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

        // listen for events
        plier.on('suite', (suiteEvent: ply.SuiteEvent) => {
            this.output.event('ply.SuiteEvent', suiteEvent);
        });
        plier.on('test', (plyEvent: ply.PlyEvent) => {
            this.output.event('ply.plyEvent', plyEvent);
        });
        plier.on('outcome', (outcomeEvent: ply.OutcomeEvent) => {
            this.output.event('ply.OutcomeEvent', outcomeEvent);
        });
        plier.on('flow', (flowEvent: flowbee.FlowEvent) => {
            this.output.event('flowbee.FlowEvent', flowEvent);
        });
        plier.on('error', (err: Error) => {
            this.output.error(err.message, err);
        });

        const results = await plier.run(plyees);
        // this.output.debug('Ply results: ' + JSON.stringify(results, null, 2));
        const res: OverallResults = { Passed: 0, Failed: 0, Errored: 0, Pending: 0, Submitted: 0 };
        results.forEach((result) => res[result.status]++);
        this.output.info('\nOverall Results', res);
        this.output.info('Overall Time', `${Date.now() - start} ms`);
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
