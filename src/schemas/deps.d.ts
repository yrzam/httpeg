import type FileService from '@services/file-service';

declare module 'express' {
  interface Request {
    fileService?: FileService;
  }
}
