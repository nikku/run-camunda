const path = require('path');
const fs = require('fs');
const execa = require('execa');
const { spawn } = require('child_process');

const isReachable = require('is-reachable');

const download = require('download');

const mkdirp = require('mkdirp');

const del = require('del');

const CAMUNDA_VERSION = process.argv[3] || '7.8';

const TMP_DIR = path.join(__dirname + '/tmp');

const CAMUNDA_DIST = path.join(TMP_DIR + '/dist');
const CAMUNDA_RUN = path.join(TMP_DIR + '/run');

const REST_API_URL = 'http://localhost:8080/engine-rest';
const DOWNLOAD_BASE = 'https://camunda.org/release/camunda-bpm';

function isUp() {
  return isReachable(`${REST_API_URL}/deployment`);
}

function existsDir(dir) {
  return fs.existsSync(dir);
}

function downloadCamunda(camundaDir) {
  const downloadUrl = `${DOWNLOAD_BASE}/tomcat/${CAMUNDA_VERSION}/camunda-bpm-tomcat-${CAMUNDA_VERSION}.0.tar.gz`;

  return download(downloadUrl, camundaDir, { extract: true });
}

async function runCamunda(camundaDir, workDir, script) {
  let tomcatFolder = fs.readdirSync(camundaDir + '/server')[0]; // find tomcat server folder - changes with every camunda version

  if (process.platform === 'win32') {
    let env = Object.create(process.env);
    let cwd = path.join(camundaDir.replace(/\\/g, '/'), `server/${tomcatFolder}/bin`);

    spawn(`${cwd}/${script}.bat`,
      [],
      {
        env,
        cwd,
        shell: true
      }
    );
  }
  else {
    let executable = path.join(camundaDir, `server/${tomcatFolder}/bin/${script}.sh`);
    await execa(executable, {
      cwd: workDir
    });
  }
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
  mkdirp.sync(CAMUNDA_RUN);
}

async function cleanup(dir) {
  await del([ dir ]);
}

async function startCamunda() {

  if (existsDir(CAMUNDA_RUN)) {
    console.log('Camunda running? Attempting re-start.');

    await stopCamunda();
  }

  await setup(CAMUNDA_RUN);

  if (existsDir(CAMUNDA_DIST)) {
    console.log('Camunda found.');
  } else {
    console.log(`Camunda not found. Downloading v${CAMUNDA_VERSION} ...`);
    await downloadCamunda(CAMUNDA_DIST);
  }

  console.log('Starting Camunda ...');

  await runCamunda(CAMUNDA_DIST, CAMUNDA_RUN, 'startup');

  await waitUntil(isUp, 'Waiting for Camunda to be up...', 60000);

  console.log('Camunda started.');
}

module.exports.startCamunda = startCamunda;


async function stopCamunda() {

  if (!existsDir(CAMUNDA_DIST) || !existsDir(CAMUNDA_RUN)) {
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