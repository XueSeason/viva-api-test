#!/usr/bin/env node

const path = require('path')
const program = require('commander')
const Machine = require('../core/machine')
const { listCases } = require('../common/util')
const pkg = require('../package.json')
const color = require('../common/color')
const ora = require('ora')

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
    const machine = new Machine(suit.data, {
      suitDidMount () {
        console.log(color.success(`---------------------${this.suit} 测试开始-----------------------`))
      },
      suitWillUnmount () {
        console.log(color.success(`---------------------${this.suit} 测试完毕-----------------------`))
      },
      eachStepWillMount (node) {
        this.spinner = ora(node.desc).start()
      },
      eachStepWillUnmount (node) {
        this.spinner.succeed(`${node.desc}`)
        this.spinner.stop()
      },
      eachStepReceivedError (error, type, { context, body, validate }) {
        this.spinner.fail(`${type} 校验不一致`)
        this.spinner.info(
          '\ncontext:\n' + color.highlight(JSON.stringify(context, null, 2)) +
          '\nbody:\n' + color.highlight(JSON.stringify(body, null, 2)) +
          `\n${type}:\n` + color.highlight(JSON.stringify(validate, null, 2))
        )
        this.spinner.fail(JSON.stringify(error))
        process.exit(1)
      }
    })
    await machine.run()
  }
})()
