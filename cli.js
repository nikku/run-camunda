#!/usr/bin/env node

const {
  startCamunda,
  stopCamunda
} = require('./camunda');


var argv = process.argv;

var mode = argv[argv.length - 1];

if (mode !== 'start' && mode !== 'stop') {
  console.error('Usage: camunda [start|stop]');

  process.exit(1);
}

if (mode === 'start') {
  startCamunda().catch(function(err) {
    console.error('Failed to start', err);

    process.exit(1);
  });
}

if (mode === 'stop') {
  stopCamunda().catch(function(err) {
    console.error('Failed to stop', err);

    process.exit(1);
  });
}