import { app } from 'electron';
import * as path from 'path';

// Reminder: When testing, this file is mocked in tests/setup.js

export const USER_DATA_PATH = app.getPath('userData');
export const CONFIG_PATH = path.join(app.getPath('home'), '.munew');