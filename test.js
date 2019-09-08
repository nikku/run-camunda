const rimraf = require('rimraf');

const path = require('path');

const assert = require('assert');

const {
  startCamunda,
  stopCamunda,
  isCamundaRunning,
  isCamundaLocal
} = require('.');


async function cleanup() {
  rimraf.sync(path.join(__dirname, '.run-camunda'));
}

async function test() {

  await cleanup();

  assert.ok(!await isCamundaLocal(), 'Camunda is not locally available');

  await stopCamunda();

  await startCamunda();

  assert.ok(await isCamundaLocal(), 'Camunda is locally available');

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