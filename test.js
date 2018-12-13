const del = require('del');

const path = require('path');

const {
  startCamunda,
  stopCamunda
} = require('./camunda');


async function cleanup() {
  await del([
    path.join(__dirname, 'tmp')
  ]);
}

async function test() {

  await cleanup();

  await stopCamunda();

  await startCamunda();

  await startCamunda();

  await stopCamunda();

  await stopCamunda();
}

test().catch(function(err) {
  console.error('test failed', err);
  process.exit(1);
});