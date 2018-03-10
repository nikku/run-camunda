const path = require('path');
const fs = require('fs');
const execa = require('execa');

const download = require('download');

const mkdirp = require('mkdirp');

const del = require('del');

const CAMUNDA_VERSION = '7.8';

const TMP_DIR = path.join(__dirname + '/tmp');

const CAMUNDA_DIST = path.join(TMP_DIR + '/dist');
const CAMUNDA_RUN = path.join(TMP_DIR + '/run');


function existsDir(dir) {
  return fs.existsSync(dir);
}

function downloadCamunda(camundaDir) {
  const downloadUrl = `https://camunda.org/release/camunda-bpm/tomcat/${CAMUNDA_VERSION}/camunda-bpm-tomcat-${CAMUNDA_VERSION}.0.tar.gz`;

  return download(downloadUrl, camundaDir, { extract: true });
}

async function runCamunda(camundaDir, workDir, script) {

  var executable = path.join(camundaDir, `server/apache-tomcat-8.0.47/bin/${script}.sh`);

  await execa(executable, {
    cwd: workDir
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

  await wait(3);

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