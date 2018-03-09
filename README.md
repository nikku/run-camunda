# run-camunda

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


## License

MIT