import mongoose from 'mongoose';
import config from 'config';
import winston from '@utils/logger';

export default class DB {
  static async start() {
    winston.info('Connecting to database');
    await mongoose.connect(config.get('mongoUrl'));
    winston.info('Connection with database established');
  }

  static async stop() {
    winston.info('Disconnecting from database');
    await mongoose.disconnect();
    winston.info('Disconnected from database');
  }
}
