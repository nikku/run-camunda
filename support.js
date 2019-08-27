const got = require('got');

async function isReachable(url) {

  try {
    await got(url, { timeout: 1000 });

    return true;
  } catch (error) {
    return false;
  }
}

module.exports.isReachable = isReachable;