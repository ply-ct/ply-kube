import { execFile as cpExecFile } from 'child_process';
import { promisify } from 'util';
import * as ply from '@ply-ct/ply';
import { FlowEvent } from '@ply-ct/ply-api';
import * as tsNode from 'ts-node';
import { Output } from './output';
import { plyVersion } from './version';

export interface WorkerOptions {
    plyOptions: ply.PlyOptions;
    runOptions: ply.RunOptions;
    plyPath?: string;
    delay?: number;
    npmInstall?: boolean;
}

export class PlyWorker {
    constructor(readonly output: Output, readonly options: WorkerOptions) {}

    async gitBranch() {
        const execFile = promisify(cpExecFile);
        const { stdout, stderr } = await execFile('git', ['branch', '--show-current']);
        if (stderr) {
            this.output.error(stderr);
        }
        if (stdout) {
            this.output.info(`git branch: ${stdout}`);
        }
    }

    async npmInstall() {
        this.output.info('npm install --omit=dev --omit=optional');
        const execFile = promisify(cpExecFile);
        const { stdout, stderr } = await execFile('npm', [
            'install',
            '--omit=dev',
            '--omit=optional'
        ]);
        if (stderr) {
            this.output.error(stderr);
        }
        if (stdout) {
            this.output.info(stdout);
        }
    }

    async run(tests: string[]): Promise<ply.OverallResults> {
        if (this.options.delay) {
            await this.delay(this.options.delay);
        }
        if (this.output.options.debug) {
            await this.gitBranch();
        }
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
        const plyees = await plier.find(tests);
        this.output.debug('Plyees: ' + JSON.stringify(plyees, null, 2));

        // listen for events
        plier.on('suite', (suiteEvent: ply.SuiteEvent) => {
            this.output.event('ply.SuiteEvent', suiteEvent);
        });
        plier.on('test', (plyEvent: ply.PlyEvent) => {
            this.output.event('ply.PlyEvent', plyEvent);
        });
        plier.on('outcome', (outcomeEvent: ply.OutcomeEvent) => {
            this.output.event('ply.OutcomeEvent', outcomeEvent);
        });
        plier.on('flow', (flowEvent: FlowEvent) => {
            this.output.event('flowbee.FlowEvent', flowEvent);
        });
        plier.on('error', (err: Error) => {
            this.output.error(err.message, err);
        });

        const overallResults = await plier.run(plyees, this.options.runOptions);
        const duration = Date.now() - start;

        this.output.event('ply.PlyResults', { results: overallResults, duration });
        this.output.info('\nOverall Results', overallResults);
        this.output.info('Overall Duration', `${duration} ms`);

        const actualDir = this.options.plyOptions.actualLocation;
        // const outputFile =
        //     this.options.plyOptions.outputFile ||
        //     `${this.options.plyOptions.logLocation}/ply-runs.json`;

        // const plyResults = JSON.parse(
        //     await fs.readFile(outputFile, { encoding: 'utf-8' })
        // ) as ply.PlyResults;

        return overallResults;
    }

    private async getPlyVersion(): Promise<string> {
        if (this.options.plyPath) {
            // TODO
            return 'unknown';
        } else {
            return plyVersion;
        }
    }

    private async delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}
