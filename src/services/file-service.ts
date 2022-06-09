import { v4 as uuidv4 } from 'uuid';
import { join } from 'path';
import { tmpdir } from 'os';
import { readdir, unlink } from 'fs/promises';
import {
  mkdirSync, existsSync, readdirSync, unlinkSync,
} from 'fs';
import winston from '@utils/logger';

export default class FileService {
  static readonly folder = join(tmpdir(), 'httpeg');

  static init() {
    if (!existsSync(FileService.folder)) mkdirSync(FileService.folder);
    else readdirSync(FileService.folder).forEach((el) => unlinkSync(join(FileService.folder, el)));
  }

  private id = uuidv4();

  private state = {
    in: 0,
    out: 0,
  };

  newName(type: 'in' | 'out') {
    this.state[type] += 1;
    const name = `${this.id}_${type}_${this.state.in - 1}`;
    winston.debug('Allocated a new filename: %s', name);
    return name;
  }

  newPath(type: 'in' | 'out') {
    return join(FileService.folder, this.newName(type));
  }

  async getPaths(type: 'in' | 'out') {
    const paths = (await readdir(FileService.folder))
      .filter((el) => el.startsWith(`${this.id}_${type}`))
      .map((el) => join(FileService.folder, el));
    if (paths.length !== this.state[type]) throw new Error('Wrong files count');
    return paths;
  }

  async done() {
    winston.debug('Clear files for request %s', this.id);
    (await readdir(FileService.folder))
      .filter((el) => el.startsWith(this.id))
      .forEach((el) => unlink(join(FileService.folder, el)));
    this.state.in = 0;
    this.state.out = 0;
  }
}

FileService.init();
