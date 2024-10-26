import fs from 'node:fs';
import assert from 'node:assert';

import { fileURLToPath } from 'node:url';

import {
  startCamunda,
  stopCamunda,
  isCamundaRunning,
  isCamundaLocal
} from 'run-camunda';


async function cleanup() {
  const filePath = fileURLToPath(new URL('.run-camunda', import.meta.url));

  fs.rmSync(filePath, { recursive: true, force: true });
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