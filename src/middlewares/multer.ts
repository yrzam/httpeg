import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import FileService from '@services/file-service';

export default class Multer {
  private static fileProxied = multer({
    limits: {
      fieldSize: Infinity,
    },
    storage: multer.diskStorage({
      destination: (_, __, cb) => cb(null, FileService.folder),
      filename: (req: Request, __, cb) => {
        if (!req.fileService) req.fileService = new FileService();
        return cb(null, req.fileService.newName('in'));
      },
    }),
  });

  static get liveSaveFile() {
    return [
      (req: Request, _: Response, next: NextFunction) => {
        req.fileService = new FileService();
        return next();
      },
      Multer.fileProxied.fields([{ name: 'settings', maxCount: 1 }, { name: 'files' }]),
    ];
  }
}
