import { pipeline } from 'node:stream/promises';

import { Readable } from 'stream';

import { extract } from 'tar';


export async function isReachable(url) {

  try {
    await fetch(url, {
      signal: AbortSignal.timeout(1000)
    });

    return true;
  } catch (error) {
    return false;
  }
}


export async function download(url, directory) {

  const response = await fetch(url);

  if (response.ok && response.body) {

    return pipeline(
      Readable.fromWeb(response.body),
      extract({
        cwd: directory
      })
    );
  }

  throw new Error(`unexpected result HTTP ${response.status}`);
}