import { pipeline } from 'node:stream/promises';

import got from 'got';

import { extract } from 'tar';


export async function isReachable(url) {

  try {
    await got(url, { timeout: 1000 });

    return true;
  } catch (error) {
    return false;
  }
}


export async function download(url, directory) {

  return pipeline(
    got.stream(url),
    extract({
      cwd: directory
    })
  );
}