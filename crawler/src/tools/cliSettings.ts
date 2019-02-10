import * as cmd from 'command-line-args';
import { logger } from './logger';

export interface Settings {
  userSettings: UserSetting[];
}
export interface UserSetting {
  username: string;
  limit: number;
}

class CMDLine {
  public config;

  public setup() {
    try {
      const optionDefinitions = [{ name: 'usernames', alias: 'u', type: String, defaultOption: true, multiple: true }];
      const cliInputs: {
        usernames: string[];
      } = cmd(optionDefinitions) as any;
      if (cliInputs.usernames.length === 0) {
        throw new Error('Please enter at least one username');
      }
      const settings = cliInputs.usernames.map((val: string) => {
        const splitString = val.split(':');
        if (!splitString[0]) {
          throw new Error('Invalid username');
        }
        return {
          username: splitString[0],
          limit: splitString[1] ? parseInt(splitString[1], 10) : null,
        };
      });
      return settings;
    } catch (error) {
      logger.error('CMDLine', 'Error parsing cli arguments', error, true);
    }
  }
}

const SETTINGS = new CMDLine().setup();

export { SETTINGS };
