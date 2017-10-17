const chalk = require('chalk')

function success (str) {
  return chalk.green(str)
}

function warn (str) {
  return chalk.bgYellow(str)
}

function error (str) {
  return chalk.red(str)
}

function info (str) {
  return chalk.blue(str)
}

function highlight (str) {
  return chalk.cyan(str)
}

module.exports = {
  success,
  warn,
  error,
  info,
  highlight
}
