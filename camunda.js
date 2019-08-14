const path = require('path');
const fs = require('fs');
const execa = require('execa');

const isReachable = require('is-reachable');

const download = require('download');

const mkdirp = require('mkdirp');

const del = require('del');

const CAMUNDA_VERSION = process.env.CAMUNDA_VERSION || '7.10';

const TMP_DIR = path.join(process.cwd(), '.run-camunda');

const CAMUNDA_DIST = path.join(TMP_DIR + '/dist');
const CAMUNDA_RUN = path.join(TMP_DIR + '/run');

const DEBUG = process.env.DEBUG;

const REST_API_URL = 'http://localhost:8080/engine-rest';
const DOWNLOAD_BASE = 'https://camunda.org/release/camunda-bpm';


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
  const downloadUrl = `${DOWNLOAD_BASE}/tomcat/${CAMUNDA_VERSION}/camunda-bpm-tomcat-${CAMUNDA_VERSION}.0.tar.gz`;

  DEBUG && console.debug(`fetching ${downloadUrl} and extracting to ${camundaDir}`);

  return download(downloadUrl, camundaDir, { extract: true });
}

async function exec(executablePath, cwd, opts = {}) {

  DEBUG && console.debug(`executing ${executablePath} from ${cwd}`);

  if (!exists(executablePath)) {
    throw new Error(`ENOENT: could not find ${executablePath}`);
  }

  const subprocess = execa(executablePath, {
    cwd,
    detached: true,
    stdio: 'ignore',
    ...opts
  });

  subprocess.unref();
}

async function runCamunda(camundaDist, cwd, script) {

  const tomcatDir = findTomcat(camundaDist);

  // windows...
  if (process.platform === 'win32') {
    const CATALINA_HOME = tomcatDir;
    const JAVA_HOME = process.env.JAVA_HOME;

    const executablePath = path.join(tomcatDir, `bin/${script}.bat`);

    return exec(executablePath, cwd, {
      env: {
        CATALINA_HOME,
        JAVA_HOME
      },
      spawn: true
    });
  }

  // ...sane platforms
  const executablePath = path.join(tomcatDir, `bin/${script}.sh`);

  return exec(executablePath, cwd);
}

function findTomcat(camundaDir) {
  const tomcatDir = fs.readdirSync(path.join(camundaDir, 'server'))[0];

  const tomcatPath = path.join(camundaDir, 'server', tomcatDir);

  DEBUG && console.debug(`found tomcat in ${tomcatPath}`);

  return tomcatPath;
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
            console.log(msg);
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
  mkdirp.sync(dir);
}

async function cleanup(dir) {
  DEBUG && console.debug(`cleaning directory ${dir}`);

  await del([ dir ]);
}

async function startCamunda() {

  if (exists(CAMUNDA_RUN)) {
    console.log('Camunda running? Attempting re-start.');

    await stopCamunda();
  }

  await setup(CAMUNDA_RUN);

  if (exists(CAMUNDA_DIST)) {
    console.log('Camunda found.');
  } else {
    console.log(`Camunda not found. Downloading v${CAMUNDA_VERSION} ...`);
    await downloadCamunda(CAMUNDA_DIST);
  }

  console.log('Starting Camunda ...');

  await runCamunda(CAMUNDA_DIST, CAMUNDA_RUN, 'startup');

  await waitUntil(isCamundaRunning, 'Waiting for Camunda to be up...', 120000);

  console.log('Camunda started.');
}

module.exports.startCamunda = startCamunda;


async function stopCamunda() {

  if (!exists(CAMUNDA_DIST) || !exists(CAMUNDA_RUN)) {
    console.log('Camunda not found. Nothing to stop.');

    return;
  }

  console.log('Stopping Camunda ...');

  await runCamunda(CAMUNDA_DIST, CAMUNDA_RUN, 'shutdown');

  await wait(1);

  console.log('Cleaning up ...');

  await cleanup(CAMUNDA_RUN);

  console.log('Camunda stopped.');
}

module.exports.stopCamunda = stopCamunda;


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