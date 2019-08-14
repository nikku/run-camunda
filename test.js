const del = require('del');

const path = require('path');

const assert = require('assert');

const {
  startCamunda,
  stopCamunda,
  isCamundaRunning
} = require('.');


async function cleanup() {
  await del([
    path.join(__dirname, 'tmp')
  ]);
}

async function test() {

  await cleanup();

  await stopCamunda();

  await startCamunda();

  assert.ok(await isCamundaRunning(), 'Camunda is up');

  await startCamunda();

  await stopCamunda();

  assert.ok(!await isCamundaRunning(), 'Camunda is down');

  await stopCamunda();

}

test().catch(function(err) {
  console.error('test failed', err);
  process.exit(1);
});