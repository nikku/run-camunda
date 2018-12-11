#!/usr/bin/env node

const {
  startCamunda,
  stopCamunda
} = require('./camunda').init(os, version);

var argv = process.argv;
var mode = argv[2];
var os   = argv[3] || 'linux';
var version = argv[4] || '7.8';

var mode = argv[argv.length - 1];

if (mode !== 'start' && mode !== 'stop') {
  console.error('Usage: camunda [start|stop]');

  process.exit(1);
}

if (mode === 'start') {
  return startCamunda().catch(function(err) {
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