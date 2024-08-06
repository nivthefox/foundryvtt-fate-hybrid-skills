import * as Constants from './Constants.js';

export function debug(...args) {
    console.debug(Constants.MODULE_NAME, " | DEBUG: ", ...args);
}

export function info(...args) {
    console.info(Constants.MODULE_NAME, " | ", ...args);
}

export function warn(...args) {
    console.warn(Constants.MODULE_NAME, " | ", ...args);
}

export function error(...args) {
    console.error(Constants.MODULE_NAME, " | ", ...args);
}
