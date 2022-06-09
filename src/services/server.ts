import express from 'express';
import config from 'config';
import api from '@routes/api';

export default class Server {
  express;

  constructor() {
    this.express = express();

    this.mountMiddlewares();
    this.mountRoutes();
  }

  private mountMiddlewares(): void {

  }

  private mountRoutes(): void {
    this.express.use(api);
  }

  start() {
    this.express.listen(config.get('port'));
  }
}
