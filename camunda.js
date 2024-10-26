import path from 'node:path';
import fs from 'node:fs';
import { execa } from 'execa';

import {
  isReachable,
  download
} from './support.js';

const debug = createLogger('run-camunda');

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

const REST_API_URL = 'http://localhost:8080/engine-rest';
const DOWNLOAD_BASE = 'https://downloads.camunda.cloud/release';


debug('environment', {
  CAMUNDA_VERSION,
  CAMUNDA_DIST,
  CAMUNDA_RUN
});


function createLogger(name) {

  if (/\*|run-camunda/.test(process.env.DEBUG)) {
    return (msg, ...args) => {
      console.debug(`[${name}] ${msg}`, ...args);
    };
  }

  return () => {};
}

function exists(dir) {
  const exists = fs.existsSync(dir);

  debug('%s exists? %s', dir, exists);

  return exists;
}

function downloadCamunda(camundaDir) {
  const downloadUrl = `${DOWNLOAD_BASE}/camunda-bpm/run/${CAMUNDA_VERSION}/camunda-bpm-run-${CAMUNDA_VERSION}.0.tar.gz`;

  debug('fetching %s and extracting to %s', downloadUrl, camundaDir);

  return download(downloadUrl, camundaDir);
}

async function exec(executablePath, args, opts = {}) {

  debug('executing %s with args %s', executablePath, args, opts);

  if (!exists(executablePath) && !exists(executablePath + '.exe')) {
    throw new Error(`ENOENT: could not find ${executablePath}`);
  }

  const subprocess = execa(executablePath, args, {
    detached: true,
    stdio: 'ignore',
    ...opts
  });

  subprocess.catch(err => {
    debug('subprocess ERROR', err);
  });

  const { pid } = subprocess;

  subprocess.unref();

  return { pid };
}

async function runCamunda(camundaDist, cwd) {

  JAVA_HOME && debug('using java provided by JAVA_HOME');

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

  debug('writing PID %s to %s', pid, PID_FILE);

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

async function setup(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function cleanup(dir) {
  debug('cleaning %s', dir);

  fs.rmSync(dir, { recursive: true, force: true });
}

export async function startCamunda() {

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


export async function stopCamunda() {

  if (!exists(PID_FILE)) {
    console.log('Camunda not found, nothing to stop');

    return;
  }

  console.log('Stopping Camunda...');

  await killCamunda();

  await waitUntil(() => isCamundaRunning().then(running => !running), '.', 10000);

  console.log('Cleaning up...');

  await cleanup(CAMUNDA_RUN);

  console.log('Camunda stopped.');
}


function killCamunda() {

  const signal = IS_WINDOWS ? 'SIGTERM' : 'SIGHUP';

  try {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10);

    debug('sending %s to %s', signal, pid);

    process.kill(pid, signal);
  } catch (err) {
    debug('failed to kill', err);
  }

  fs.rmSync(PID_FILE);
}

export async function isCamundaRunning() {
  const url = `${REST_API_URL}/deployment`;

  const up = await isReachable(url);

  debug('%s up? %s', url, up);

  return up;
}

export async function isCamundaLocal() {
  return exists(CAMUNDA_RUN);
}
