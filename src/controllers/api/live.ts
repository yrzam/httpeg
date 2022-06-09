import GUtils from '@utils/generics';
import { Request, Response } from 'express';
import FormData from 'form-data';
import { ZodError } from 'zod';
import { createReadStream } from 'fs';
import Worker from '@services/worker';
import { settings as sParam } from '@schemas/api/live';
import winston from '@utils/logger';

export default class Live {
  static async process(req: Request, res: Response) {
    winston.info('Live: new request');
    if (!req.fileService) throw new Error('Fileservice not bound');

    try {
      // prepare
      const settings = Live.parse(req);
      const files = {
        in: await req.fileService.getPaths('in'),
        out: GUtils.toArray(settings.output).map(() => req.fileService?.newPath('out') as string),
      };
      winston.debug('Processing live request. Settings: %o, Prep paths: %o', settings, files);

      // encode
      await Worker.handleLive({
        input: GUtils.toArray(settings.input).map((el, i) => ({
          path: files.in[i] as string,
          options: GUtils.toArray(el.options),
          format: el.format,
        })),
        output: GUtils.toArray(settings.output).map((el, i) => ({
          path: files.out[i] as string,
          options: GUtils.toArray(el.options),
          format: el.format,
        })),
        vf: typeof settings.vf === 'object' && !Array.isArray(settings.vf) ? [settings.vf] : settings.vf,
        af: typeof settings.af === 'object' && !Array.isArray(settings.af) ? [settings.af] : settings.af,
        cf: settings.cf,
        timeout: settings.timeout,
      });

      // respond
      const form = new FormData();
      files.out.forEach((el) => form.append('files', createReadStream(el)));
      res.setHeader('Content-Type', `multipart/form-data; boundary=${form.getBoundary()}`);
      form.pipe(res);
    } finally {
      // cleanup
      req.fileService?.done();
    }
  }

  private static parse(req: Request) {
    let body; let settings;

    // is body is a valid object?
    try {
      body = JSON.parse(req.body.settings);
    } catch (err) {
      throw new Error('Failed to parse JSON');
    }
    // is body well-formatted?
    try {
      settings = sParam.parse(body);
    } catch (err) {
      if (err instanceof ZodError) throw new Error(`Validation failed: ${err.message}`);
      throw new Error();
    }
    // are files valid?
    if (!req.files || Array.isArray(req.files) || !Array.isArray(req.files['files'])) {
      throw new Error('Bad file params');
    }
    // do settings correspond files?
    if (req.files['files'].length !== GUtils.toArray(settings.input).length) {
      throw new Error('Invalid index mapping');
    }

    return settings;
  }
}
