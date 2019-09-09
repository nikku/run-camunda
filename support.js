const stream = require('stream');

const {
  promisify
} = require('util');

const got = require('got');

const pipeline = promisify(stream.pipeline);

const tar = require('tar');


async function isReachable(url) {

  try {
    await got(url, { timeout: 1000 });

    return true;
  } catch (error) {
    return false;
  }
}

module.exports.isReachable = isReachable;


async function download(url, directory) {

  return pipeline(
    got.stream(url),
    tar.extract({
      cwd: directory
    })
  );
}

module.exports.download = download;