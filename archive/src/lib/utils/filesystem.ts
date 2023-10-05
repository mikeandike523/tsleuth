import fs from 'fs';

import { v4 as uuidv4 } from 'uuid';

import { stripExt } from '<^w^>/lib/utils/filepath';

/**
 *
 * Get a guaranteed unique uuidv4 in a given directory
 *
 * @param directory
 */
export function uuidv4InDirectory(directory: string, ext = ''): string {
  if (!fs.existsSync(directory)) {
    throw new Error(
      `Directory ${directory} does not exist. uuidv4InDirectory will not create the directory.`,
    );
  }
  ext = ext.replace(/^\./, '');
  const items = fs.readdirSync(directory);
  const uuids = items.map((item) => stripExt(item)); // Assume that the folder only contains uuids
  let uuid = uuidv4();
  while (uuids.includes(uuid)) {
    uuid = uuidv4();
  }
  return uuid + (ext ? '.' + ext : uuid);
}
