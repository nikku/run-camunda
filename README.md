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


## Access Camunda

Camunda is up and running on `localhost:8080` once `camunda start` completes.

### REST API

Access the Camunda instance via the [Camunda REST API](https://docs.camunda.org/manual/latest/reference/rest/overview/distro-use/), available at `http://localhost:8080/engine-rest`.

Refer to the [Camunda documentation](https://docs.camunda.org/manual/latest/reference/rest/) to learn how to deploy and run your processes. Checkout [camunda-worker-node](https://github.com/nikku/camunda-worker-node) for a simple way to contribute work via [external tasks](https://docs.camunda.org/manual/latest/user-guide/process-engine/external-tasks/).


### Webapps

The running Camunda instance includes all stock apps:

| App | Purpose |
| :--- | :--- |
| [Admin](http://localhost:8080/camunda/app/admin/) | administrate engines, users and rights |
| [Cockpit](http://localhost:8080/camunda/app/cockpit/) | introspect the engine |
| [Tasklist](http://localhost:8080/camunda/app/tasklist/) | list and execute tasks |
| [Welcome](http://localhost:8080/camunda/app/welcome/) | check your user profile |

The default login for these apps is `demo:demo`.


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


## Related


### Resources

* [Camunda documentation](https://docs.camunda.org/manual/latest/) / [external tasks](https://docs.camunda.org/manual/latest/user-guide/process-engine/external-tasks/)

### Projects

* [camunda-worker-node](https://github.com/nikku/camunda-worker-node)
* [camunda-external-task-client-js](https://github.com/camunda/camunda-external-task-client-js)


## License

MIT
