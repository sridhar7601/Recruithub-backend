import { Logger } from '@nestjs/common';

export class CustomLogger extends Logger {
  private shouldLog(level: string): boolean {
    const levels = ['error', 'warn', 'log', 'debug', 'trace'];
    const configLevel = process.env.DEFAULT_LOG_LEVEL || 'log';
    return levels.indexOf(level) <= levels.indexOf(configLevel);
  }

  error(message: string, ...optionalParams: any[]) {
    if (this.shouldLog('error')) {
      super.error(message, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: any[]) {
    if (this.shouldLog('warn')) {
      super.warn(message, ...optionalParams);
    }
  }

  log(message: string, ...optionalParams: any[]) {
    if (this.shouldLog('log')) {
      super.log(message, ...optionalParams);
    }
  }

  debug(message: string, ...optionalParams: any[]) {
    if (this.shouldLog('debug')) {
      super.debug(message, ...optionalParams);
    }
  }

  trace(message: string, ...optionalParams: any[]) {
    if (this.shouldLog('trace')) {
      super.debug(`[TRACE] ${message}`, ...optionalParams);
    }
  }
}
