import winston from '@utils/logger';
import FFmpeg from 'fluent-ffmpeg';
import Timer from 'tiny-timer';
import { EventEmitter } from 'tsee';

export type EncodingParams = {
  input: Array<{
    path: string,
    options?: Parameters<FFmpeg.FfmpegCommand['addInputOptions']>
    format: string
  }>,
  output: Array<{
    path: string,
    options?: Parameters<FFmpeg.FfmpegCommand['addOutputOptions']>,
    format: string
  }>,
  vf?: Parameters<FFmpeg.FfmpegCommand['audioFilters']>[0] | undefined,
  af?: Parameters<FFmpeg.FfmpegCommand['audioFilters']>[0] | undefined,
  cf?: {
    spec: Parameters<FFmpeg.FfmpegCommand['complexFilter']>[0],
    map?: Parameters<FFmpeg.FfmpegCommand['complexFilter']>[1]
  } | undefined
  timeout?: number | undefined
};

export class Encoding {
  private state = {
    done: false,
    paused: false,
    errored: false,
    donePercent: 0,
  };

  private timer = new Timer();

  private events = new EventEmitter<{
    start:() => void,
    end: () => void,
    error: (err: Error) => void
  }>();

  private command!: FFmpeg.FfmpegCommand;

  constructor(params: EncodingParams) {
    this.start(params);
    this.addHandlers();
  }

  private start(params: EncodingParams) {
    winston.debug('Preparing ffmpeg params: %o', params);
    this.command = FFmpeg();
    params.input.forEach((el) => {
      this.command.addInput(el.path);
      this.command.addInputOptions(...(el.options || []), `-f ${el.format}`);
    });
    if (params.vf) this.command.videoFilters(params.vf);
    if (params.af) this.command.audioFilters(params.af);
    if (params.cf) this.command.complexFilter(params.cf.spec, params.cf.map);
    params.output.forEach((el) => {
      this.command.addOutput(el.path);
      this.command.addOutputOptions(...(el.options || []), `-f ${el.format}`);
    });
    winston.info('Starting encode process');
    this.command.run();
    if (params.timeout) this.timer.start(params.timeout);
  }

  pause() {
    if (this.running) {
      winston.info('Pausing encode process');
      this.command.kill('SIGSTOP');
      this.state.paused = true;
      this.timer.pause();
    }
  }

  resume() {
    if (this.state.paused && !this.state.done && !this.state.errored) {
      winston.info('Resuming encode process');
      this.command.kill('SIGCONT');
      this.state.paused = false;
      this.timer.resume();
    }
  }

  cancel() {
    winston.info('Cancelling encode process');
    this.command.kill('SIGKILL');
  }

  private addHandlers() {
    this.command.on('start', () => this.events.emit('start'));
    this.command.on('progress', (progress) => {
      winston.debug('ffmpeg progress: %d', progress.percent);
      this.state.donePercent = progress.percent;
    });
    this.command.on('end', () => {
      winston.info('Encoding done (success)');
      this.state.done = true;
      this.timer.stop();
      this.events.emit('end');
    });
    this.command.on('error', (err: Error) => {
      winston.info('Encoding errored: %s', err.stack);
      this.state.errored = true;
      this.timer.stop();
      this.events.emit('error', err);
    });
    this.timer.on('done', () => {
      winston.info('Encoding cancelled due to timeout');
      this.state.errored = true;
      this.events.emit('error', new Error('Time ran out'));
    });
  }

  on(...args: Parameters<typeof this.events.on>) {
    this.events.on(...args);
  }

  get donePercent() {
    return this.state.donePercent;
  }

  get errored() {
    return this.state.errored;
  }

  get done() {
    return this.state.done;
  }

  get running() {
    return !this.state.paused && !this.state.done && !this.state.errored;
  }
}
