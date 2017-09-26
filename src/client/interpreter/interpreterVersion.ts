import * as path from 'path';
import { getInterpreterDisplayName } from '../common/utils';

export interface IInterpreterVersionService {
    getVersion(pythonPath: string, defaultValue: string): Promise<string>;
}

export class InterpreterVersionService implements IInterpreterVersionService {
    getVersion(pythonPath: string, defaultValue: string): Promise<string> {
        return getInterpreterDisplayName(pythonPath)
            .catch(() => path.basename(defaultValue));
    }
}