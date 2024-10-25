import bpmnIoPlugin from 'eslint-plugin-bpmn-io';

const files = {
  ignored: [
    'tmp',
    '.run-camunda'
  ]
};

export default [
  {
    'ignores': files.ignored
  },

  ...bpmnIoPlugin.configs.node
];