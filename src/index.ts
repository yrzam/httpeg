import Server from '@services/server';
import Worker from '@services/worker';

const server = new Server();
Worker.start().then(() => {
  server.start();
});
