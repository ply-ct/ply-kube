import { promises as fs, existsSync } from 'fs';
import { Output } from './output';
import { Execution } from './testkube';

const output = new Output(true);
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

fs.readdir(`${dataDir}/repo`).then((files) => {
    files.forEach((file) => {
        output.info('FILE: ' + file);
    });
});

if (valid) {
    const executor = args[0] as Execution;
    output.debug(`Executor: ${JSON.stringify(executor)}`);

    output.result('passed', 'yep');
}
