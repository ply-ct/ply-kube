import { existsSync } from 'fs';
import { Output } from './output';
import { PlyRunner } from './runner';
import { Execution } from './testkube';
import { version } from './version';

let output = new Output();

output.info(`testkube-executor-ply version ${version}`);

let valid = true;

// args passed to script
const args = process.argv.slice(2);
if (args.length === 0) {
    output.error('Missing arguments');
    valid = false;
}

const dataDir = process.env.RUNNER_DATADIR;
if (!dataDir || !existsSync(dataDir)) {
    output.error('Invalid or missing data directory');
    valid = false;
}

if (!valid) {
    output.result('aborted', 'Invalid context');
    process.exit(1);
}

const executor = JSON.parse(args[0]) as Execution;
if (executor.args?.includes('--verbose=true') || executor.args?.includes('-v')) {
    output = new Output({ debug: true });
}

process.chdir(`${dataDir}/repo`);
const runner = new PlyRunner(output, executor.args || []);

runner
    .runTests()
    .then((results) => {
        if (!results.Failed && !results.Errored) {
            output.result('passed', 'Passed');
        } else {
            output.result('failed', 'Failed');
        }
    })
    .catch((err: Error) => {
        output.error(err.message, err);
        output.result('failed', `${err}`);
    });
