#!/usr/bin/env node

const path = require('path')
const program = require('commander')
const Machine = require('./core/machine')
const { listCases } = require('./common/util')
const pkg = require('./package.json')

program
  .version(pkg.version)
  .option('-d, --dir [string]', 'test case directory')
  .parse(process.argv)

if (typeof program.dir === 'string') {
  process.workspace = path.resolve(process.cwd(), program.dir)
} else {
  process.workspace = path.resolve(process.cwd(), './')
}

;(async function () {
  for (const suit of listCases(process.workspace)) {
    const machine = new Machine(suit.data)
    await machine.run()
  }
})()
