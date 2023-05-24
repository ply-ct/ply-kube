export interface Test {
    type: string;
    name?: string;
    namespace?: string;
    content: TestContent;
    executionRequest?: ExecutionRequest;
    created?: Date;
}

export interface Execution {
    /**
     * execution id
     */
    id?: string;

    /**
     * unique test name (CRD Test name)
     */
    testName?: string;

    /**
     * unique test suite name (CRD Test suite name), if it's run as a part of test suite
     */
    testSuiteName?: string;

    /**
     * test namespace
     */
    testNamespace?: string;

    /**
     * test type e.g. postman/collection
     */
    testType?: string;

    /**
     * execution name
     */
    name?: string;

    /**
     * execution number
     */
    number?: number;

    /**
     * additional arguments/flags passed to executor binary
     */
    args?: string[];

    variables?: Variables;

    /**
     * variables file content - need to be in format for particular executor (e.g. postman envs file)
     */
    variablesFile?: string;

    /**
     * test secret uuid
     */
    testSecretUUID?: string;

    /**
     * test suite secret uuid, if it's run as a part of test suite
     */
    testSuiteSecretUUID?: string;

    content?: TestContent;

    /**
     * test start time
     */
    startTime?: Date;

    /**
     * test end time
     */
    endTime?: Date;

    /**
     * test duration
     */
    duration?: string;

    /**
     * test duration in milliseconds
     */
    durationMs?: number;

    executionResult?: ExecutionResult;

    /**
     * test and execution labels
     */
    labels?: { [key: string]: string };

    /**
     * list of file paths that need to be copied into the test from uploads
     */
    uploads?: string[];

    /**
     * minio bucket name to get uploads from
     */
    bucketName?: string;

    artifactRequest?: ArtifactRequest;

    /**
     * script to run before test execution
     */
    preRunScript?: string;

    runningContext?: RunningContext;
}

export interface RunningContext {
    type: 'userCLI' | 'userUI' | 'testsuite' | 'testtrigger' | 'scheduler';
    context?: string;
}

export interface ExecutorOutput {
    /**
     * One of possible output types
     */
    type: 'error' | 'log' | 'event' | 'result';

    /**
     * Message/event data passed from executor (like log lines etc)
     */
    content?: string;

    result?: ExecutionResult;

    time?: Date;
}

export type ExecutionStatus =
    | 'queued'
    | 'running'
    | 'passed'
    | 'failed'
    | 'aborting'
    | 'aborted'
    | 'timeout';

/**
 * execution result returned from executor
 */
export interface ExecutionResult {
    status: ExecutionStatus;

    /**
     * RAW Test execution output, depends of reporter used in particular tool
     */
    output?: string;

    /**
     * output type depends of reporter used in particular tool
     */
    outputType?: 'text/plain' | 'application/junit+xml' | 'application/json';

    /**
     * error message when status is error, separate to output as output can be partial in case of error
     */
    errorMessage?: string;

    /**
     * execution steps (for collection of requests)
     */
    steps?: ExecutionStepResult[];

    reports?: ExecutionResultReports;
}

/**
 * execution result data
 */
export interface ExecutionStepResult {
    /**
     * step name
     */
    name: string;

    duration?: string;

    /**
     * execution step status
     */
    status: 'passed' | 'failed';

    assertionResults?: AssertionResult[];
}

export interface AssertionResult {
    name?: string;

    status?: 'passed' | 'failed';

    errorMessage?: string;
}

export interface ExecutionResultReports {
    junit?: string;
}

export interface TestContent {
    /**
     * test type
     */
    type?: 'string' | 'file-uri' | 'git';

    repository?: Repository;

    /**
     * test content data as string
     */
    data?: string;

    /**
     * test content
     * example: "https://github.com/kubeshop/testkube"
     */
    uri?: string;
}

/**
 * repository representation for tests in git repositories
 * @export
 * @interface Repository
 */
export interface Repository {
    /**
     * VCS repository type
     */
    type: 'git';

    /**
     * uri of content file or git directory
     */
    uri: string;

    /**
     * branch/tag name for checkout
     */
    branch?: string;

    /**
     * commit id (sha) for checkout
     */
    commit?: string;

    /**
     * if needed we can checkout particular path (dir or file) in case of BIG/mono repositories
     */
    path?: string;

    /**
     * git auth username for private repositories
     */
    username?: string;

    /**
     * git auth token for private repositories
     */
    token?: string;

    usernameSecret?: SecretRef;

    tokenSecret?: SecretRef;

    /**
     * secret with certificate for private repositories
     */
    certificateSecret?: string;

    /**
     * if provided we checkout the whole repository and run test from this directory
     */
    workingDir?: string;

    authType?: 'basic' | 'header';
}

export interface ExecutionRequest {
    name?: string;
    namespace?: string;
    jobTemplate?: string;
}

export interface Variable {
    name?: string;
    value?: string;
    type?: 'basic' | 'secret';
    secretRef?: SecretRef;
    configMapRef?: ConfigMapRef;
}

/**
 * execution variables passed to executor converted to vars for usage in tests
 */
export interface Variables {
    [key: string]: Variable;
}

/**
 * Testkube internal reference for secret storage in Kubernetes secrets
 */
export interface SecretRef {
    /**
     * object kubernetes namespace
     */
    namespace?: string;

    /**
     * object name
     */
    name: string;

    /**
     * object key
     */
    key: string;
}

/**
 * Testkube internal reference for data in Kubernetes config maps
 */
export interface ConfigMapRef {
    /**
     * object kubernetes namespace
     */
    namespace?: string;

    /**
     * object name
     */
    name: string;

    /**
     * object key
     */
    key: string;
}

/**
 * artifact request body for container executors with test artifacts
 */
export interface ArtifactRequest {
    /**
     * artifact storage class name
     */
    storageClassName: string;

    /**
     * artifact volume mount path
     */
    volumeMountPath: string;

    /**
     * artifact directories
     */
    dirs?: string[];
}

export interface CollectionQuery {
    selector: [string, string];
    page: number;
    pageSize: number;
}
