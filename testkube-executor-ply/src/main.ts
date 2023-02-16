import { existsSync } from 'fs';
import { Output } from './output';
import { PlyRunner } from './runner';
import { Execution } from './testkube';
import { version } from './version';

const output = new Output(true);
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

if (!valid) process.exit(1);

const executor = args[0] as Execution;

const cwd = process.cwd();
process.chdir(`${dataDir}/repo`);
const runner = new PlyRunner(output);
runner
    .runTests()
    .then(() => {
        output.result('passed', 'you better believe it');
    })
    .catch((err: Error) => {
        output.error(err.message, err);
        output.result('failed', `${err}`);
    });
