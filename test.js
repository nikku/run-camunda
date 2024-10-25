const fs = require('node:fs');
const path = require('node:path');

const assert = require('node:assert');

const {
  startCamunda,
  stopCamunda,
  isCamundaRunning,
  isCamundaLocal
} = require('.');


async function cleanup() {
  fs.rmSync(path.join(__dirname, '.run-camunda'), { recursive: true, force: true });
}

async function test() {

  await cleanup();

  assert.ok(!await isCamundaLocal(), 'Camunda is not locally available');

  await stopCamunda();

  await startCamunda();

  assert.ok(await isCamundaLocal(), 'Camunda is locally available');

  assert.ok(await isCamundaRunning(), 'Camunda is up');

  await startCamunda();

  assert.ok(await isCamundaRunning(), 'Camunda is up');

  await stopCamunda();

  assert.ok(!await isCamundaRunning(), 'Camunda is down');

  await stopCamunda();

  assert.ok(!await isCamundaRunning(), 'Camunda is down');

}

test().catch(function(err) {
  console.error('test failed', err);
  process.exit(1);
});