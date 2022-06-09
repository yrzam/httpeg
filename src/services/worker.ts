import DB from './db';
import { Encoding, EncodingParams } from './encoding';
import FileService from './file-service';

export default class Worker {
  static async start() {
    FileService.init();
    await DB.start();
  }

  static async handleLive(params: EncodingParams) {
    await new Promise((resolve, reject) => {
      const enc = new Encoding(params);
      enc.on('end', () => resolve(undefined));
      enc.on('error', (err: unknown) => reject(err));
    });
  }

  static async stop() {
    await DB.stop();
  }
}
