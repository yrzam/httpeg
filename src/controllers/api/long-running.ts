import { Request, Response } from 'express';

export default class LongRunning {
  static queue(_req: Request, res: Response) {
    return res.json({ a: true });
  }

  static delete(_req: Request, res: Response) {
    return res.json({ a: true });
  }
}
