const path = require('path');
const fs = require('fs');
const execa = require('execa');

const {
  isReachable,
  download
} = require('./support');

const CAMUNDA_VERSION = process.env.CAMUNDA_VERSION || '7.22';

const JAVA_HOME = process.env.JAVA_HOME;

if (CAMUNDA_VERSION < '7.13') {
  console.error(
    `Incompatible Camunda version: ${CAMUNDA_VERSION}. ` +
    'Please use run-camunda<=4.0.0 to start Camunda<7.13.'
  );

  process.exit(1);
}

const IS_WINDOWS = process.platform === 'win32';

const TMP_DIR = path.join(process.cwd(), '.run-camunda');

const CAMUNDA_DIST = path.join(TMP_DIR + '/dist');
const CAMUNDA_RUN = path.join(TMP_DIR + '/run');

const PID_FILE = path.join(CAMUNDA_RUN, 'pid');

const DEBUG = process.env.DEBUG;

const REST_API_URL = 'http://localhost:8080/engine-rest';
const DOWNLOAD_BASE = 'https://downloads.camunda.cloud/release';


DEBUG && console.debug(`
  CAMUNDA_VERSION: ${CAMUNDA_VERSION}

  CAMUNDA_DIST: ${CAMUNDA_DIST}
  CAMUNDA_RUN: ${CAMUNDA_RUN}
`);

function exists(dir) {
  const exists = fs.existsSync(dir);

  DEBUG && console.debug(`${dir} exists? ${exists}`);

  return exists;
}

function downloadCamunda(camundaDir) {
  const downloadUrl = `${DOWNLOAD_BASE}/camunda-bpm/run/${CAMUNDA_VERSION}/camunda-bpm-run-${CAMUNDA_VERSION}.0.tar.gz`;

  DEBUG && console.debug(`Fetching ${downloadUrl} and extracting to ${camundaDir}`);

  return download(downloadUrl, camundaDir);
}

async function exec(executablePath, args, opts = {}) {

  DEBUG && console.debug(`Executing ${executablePath} with args ${args}`, opts);

  if (!exists(executablePath) && !exists(executablePath + '.exe')) {
    throw new Error(`ENOENT: could not find ${executablePath}`);
  }

  const subprocess = execa(executablePath, args, {
    detached: true,
    stdio: 'ignore',
    ...opts
  });

  const { pid } = subprocess;

  subprocess.unref();

  return { pid };
}

async function runCamunda(camundaDist, cwd) {

  DEBUG && JAVA_HOME && console.debug('Using java provided by JAVA_HOME');

  const javaBinary = JAVA_HOME ? path.join(JAVA_HOME, 'bin/java') : 'java';

  const classPath = [
    'configuration/userlib',
    'configuration/keystore',
    'internal/webapps',
    'internal/rest'
  ].map(p => path.join(camundaDist, p)).join(',');

  const deploymentDir = path.join(camundaDist, 'configuration/resources');

  const configPath = path.join(camundaDist, 'configuration/default.yml');

  const runJarPath = path.join(camundaDist, 'internal/camunda-bpm-run-core.jar');

  const javaArgs = [
    `-Dloader.path=${classPath}`,
    `-Dcamunda.deploymentDir=${deploymentDir}`,
    '-jar', runJarPath,
    `--spring.config.location=file:${configPath}`
  ];

  const execOptions = IS_WINDOWS ? {
    env: {
      JAVA_HOME
    },
    spawn: true,
    cwd
  } : {
    cwd
  };

  const { pid } = await exec(javaBinary, javaArgs, execOptions);

  DEBUG && console.debug(`Writing PID ${pid} to file ${PID_FILE}`);

  fs.writeFileSync(PID_FILE, String(pid), 'utf-8');

  return { pid };
}

function waitUntil(fn, msg, maxWait) {

  if (typeof msg === 'number') {
    maxWait = msg;
    msg = null;
  }

  var start = Date.now();
  var timeout = 1000;

  return new Promise(function(resolve, reject) {

    function check() {

      (async function() {
        var ok = await fn();

        if (ok) {
          resolve();
        } else {
          if (msg) {
            process.stdout.write(msg);
          }

          if (typeof maxWait === 'number') {
            if ((Date.now() - start) > maxWait) {
              return reject(new Error('Max wait time exceeded'));
            }
          }
          setTimeout(check, timeout);
        }
      })().catch(reject);
    }

    check();
  });
}

function wait(s) {
  return new Promise(function(resolve) {
    setTimeout(resolve, s * 1000);
  });
}

async function setup(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function cleanup(dir) {
  DEBUG && console.debug(`Cleaning directory ${dir}`);

  fs.rmSync(dir, { recursive: true, force: true });
}

async function startCamunda() {

  if (exists(PID_FILE)) {
    console.log('Camunda is already running, restarting it.');

    await stopCamunda();
  }

  await setup(CAMUNDA_RUN);

  if (!exists(CAMUNDA_DIST)) {
    await setup(CAMUNDA_DIST);

    console.log(`Downloading Camunda v${CAMUNDA_VERSION}...`);
    await downloadCamunda(CAMUNDA_DIST);
  }

  process.stdout.write('Starting Camunda...');

  await runCamunda(CAMUNDA_DIST, CAMUNDA_RUN, 'startup');

  await waitUntil(isCamundaRunning, '.', 120000);

  console.log();
  console.log('Camunda started on http://localhost:8080/');
}

module.exports.startCamunda = startCamunda;


async function stopCamunda() {

  if (!exists(PID_FILE)) {
    console.log('Camunda not found, nothing to stop');

    return;
  }

  console.log('Stopping Camunda...');

  await killCamunda();

  await wait(1);

  console.log('Cleaning up...');

  await cleanup(CAMUNDA_RUN);

  console.log('Camunda stopped.');
}

module.exports.stopCamunda = stopCamunda;


function killCamunda() {

  const signal = IS_WINDOWS ? 'SIGTERM' : 'SIGHUP';

  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10);

    DEBUG && console.debug(`sending ${signal} to ${pid}`);

    process.kill(pid, signal);
  } catch (err) {
    DEBUG && console.error('failed to kill Camunda', err);
  }

  fs.unlinkSync(PID_FILE);
}

async function isCamundaRunning() {
  const url = `${REST_API_URL}/deployment`;

  const up = await isReachable(url);

  DEBUG && console.debug(`${url} up? ${up}`);

  return up;
}

module.exports.isCamundaRunning = isCamundaRunning;


async function isCamundaLocal() {
  return exists(CAMUNDA_RUN);
}

module.exports.isCamundaLocal = isCamundaLocal;
