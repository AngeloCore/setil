// From: https://github.com/Marak/colors.js/blob/6bc50e79eeaa1d87369bb3e7e608ebed18c5cf26/lib/styles.js
const Colors = {
  gray: "\u001b[90m",
  yellow: "\u001b[33m",
  colorClose: "\u001b[39m"
};

/**
 * debug - show everything
 * warn - show warnings & errors
 * silent - do not log anything
 */
export type LogLevel = "debug" | "warn" | "silent";

export default class Logger {
  logLevel: LogLevel;
  constructor(debug: LogLevel) {
    this.logLevel = debug;
  }

  debug(...log: any) {
    if (this.logLevel != "debug") return;

    console.log(Colors.gray, "[SETIL DEBUG]", ...log, Colors.colorClose);
  }

  warn(...log: any) {
    if (!["debug", "warn"].includes(this.logLevel)) return;

    console.log(Colors.yellow, "[SETIL WARN]", ...log, Colors.colorClose);
  }
}
