import * as colors from 'colors';
import * as debug from 'debug';

type MessageTypes = 'error' | 'info' | 'debug' | 'verbose' | 'silly';

class Logger {
  private prefixMap: { [level in MessageTypes]: string } = {
    error: colors.red('Error'),
    info: colors.magenta('Info'),
    debug: colors.cyan('Debug'),
    verbose: colors.green('Verbose'),
    silly: colors.rainbow('Silly'),
  };
  private loggers: { [id: string]: debug.IDebugger } = {};
  private logLevelsMap: { [level in MessageTypes]: number } = {
    error: 0,
    info: 1,
    debug: 2,
    verbose: 3,
    silly: 4,
  };
  private logLevel: number = parseInt(process.env.DEBUG_LEVEL, 10);

  public log(name: string, message: string, body: object = null, type: MessageTypes = 'info') {
    // Check if message should be displayed
    if (this.logLevelsMap[type] > this.logLevel) {
      return;
    }

    // Create logger if it doesn't exists
    if (!this.loggers[name]) {
      this.loggers[name] = debug(name);
    }

    if (body) {
      this.loggers[name](`%s: %s\n%O`, this.prefixMap[type], message, body);
    } else {
      this.loggers[name](`%s: %s`, this.prefixMap[type], message);
    }
  }

  public error(name: string, message: string, body: object = null, fatal = false) {
    this.log(name, message, body, 'error');
    if (fatal) {
      process.exit(0);
    }
  }
}

const logger = new Logger();

export { logger };
