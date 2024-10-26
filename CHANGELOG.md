# Changelog

All notable changes to [run-camunda](https://github.com/nikku/run-camunda) are documented here. We use [semantic versioning](http://semver.org/) for releases.

## Unreleased

___Note:__ Yet to be released changes appear here._

## 9.0.0

* `FEAT`: download Camunda `v7.22` per default
* `FEAT`: gracefully await shutdown
* `DEPS`: update to `execa@9`
* `DEPS`: update to `tar@7`
* `CHORE`: turn into ES module

### Breaking Changes

* This package is now ESM only.

## 8.0.0

* `FEAT`: download Camunda `v7.19` per default

## 7.0.0

* `FEAT`: download Camunda `v7.16` per default

## 6.0.0

* `FEAT`: download Camunda `v7.15` per default

## 5.0.0

* `FEAT`: download Camunda `v7.13` per default
* `FEAT`: switch to Camunda BPM Run as runtime
* `CHORE`: drop support for Camunda `<=7.12`

## 4.0.0

* `FEAT`: download Camunda `v7.12` per default

## 3.2.1

* `DOCS`: correct Camunda compatibility badge

## 3.2.0

* `CHORE`: update `got`
* `CHORE`: reduce bundle size by replacing `download` with `got` + `tar`

## 3.1.0

* `CHORE`: simplify log output
* `CHORE`: drop `is-reachable` dependency to further reduce log output

## 3.0.0

* `FEAT`: download Camunda `v7.11` per default
* `CHORE`: decrease install size

## 2.3.0

* `FEAT`: expose `isCamundaLocal` API

## 2.2.0

* `FEAT`: expose API

## 2.1.1

* `CHORE`: expose main entry point

## 2.1.0

* `CHORE`: bump dependencies

## 2.0.0

* `FEAT`: download Camunda `v7.10` per default
* `FEAT`: add ability to use utility via `npx`

## 1.3.0

* `FEAT`: support arbitrary Camunda versions
* `FEAT`: support Windows

## 1.2.2

* `CHORE`: link repository in `package.json`

## 1.2.1

* `CHORE`: fix license statement in `package.json`

## 1.2.0

* `DOCS`: document Camunda usage and link external resources

## 1.1.0

* `FEAT`: wait until Camunda REST api is up

## 1.0.3

* `FIX`: wait actual _seconds_ before reporting Camunda to be up

## 1.0.2

* `DOCS`: documentation improvements

## 1.0.1

* `CHORE`: initial release

## 1.0.0

_Package broken and unpublished. Use `v1.0.1` instead._