# run-camunda

[![Build Status](https://travis-ci.org/nikku/run-camunda.svg?branch=master)](https://travis-ci.org/nikku/run-camunda)

Download, spin up and shutdown [Camunda](https://camunda.org/) painlessly from Node.


## Usage

Install `run-camunda` globally or as a local dev dependency:

```
npm install -g run-camunda
```

Use the provided `camunda` command to start and stop [Camunda](https://camunda.org/):

```bash
$ camunda start
Camunda not found. Downloading Camunda v7.8 ...
Starting Camunda ...
Camunda started.

$ camunda stop
Stopping Camunda ...
Cleaning up ...
Camunda stopped.
```


## Test Life-Cycle Integration

Use `pretest` and `posttest` hooks in your project's `package.json` to integrate `run-camunda` into the test life-cycle:

```json
{
  "scripts": {
    "pretest": "camunda start",
    "test": "echo 'running test'",
    "posttest": "camunda stop"
  }
}
```


## License

MIT