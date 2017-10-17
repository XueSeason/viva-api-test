const Parameter = require('parameter')
const color = require('../common/color')
const { httpRequest } = require('../common/util')

const parameter = new Parameter()

// 对 target 混入 source 的内容
function mixin (target, source, keyStr, aliase) {
  const keyRoute = keyStr.split('.')
  for (let i = 0; i < keyRoute.length - 1; i++) {
    const key = keyRoute[i]
    if (aliase === undefined) {
      target[key] = {}
      target = target[key]
    }
    source = source[key]
  }
  const key = keyRoute[keyRoute.length - 1]
  if (aliase === undefined) {
    target[key] = source[key]
  } else {
    target[aliase] = source[key]
  }
}
// 从上下文中提取变量
function extract (context, options) {
  const result = {}
  if (Array.isArray(options)) {
    for (const option of options) {
      mixin(result, context, option)
    }
  } else if (typeof options === 'object') {
    const aliasList = Object.keys(options)
    const keys = aliasList.map(k => options[k])
    for (let i = 0; i < aliasList.length; i++) {
      mixin(result, context, keys[i], aliasList[i])
    }
  } else if (typeof options === 'string') {
    mixin(result, context, options)
  }
  return result
}
// 根据返回的 body 内容，向 context 注入变量
function inject (context, body, options) {
  if (Array.isArray(options)) {
    for (const option of options) {
      mixin(context, body, option)
    }
  } else if (typeof options === 'object') {
    const aliasList = Object.keys(options)
    const keys = aliasList.map(k => options[k])
    for (let i = 0; i < aliasList.length; i++) {
      mixin(context, body, keys[i], aliasList[i])
    }
  } else if (typeof options === 'string') {
    mixin(context, body, options)
  }
}
// 递归使 key value 一一对应
function recursiveEqual (target, source, errors, keyTrack) {
  if (typeof source === 'object') {
    const keys = Object.keys(source)
    for (const key of keys) {
      if (typeof source[key] === 'object' && typeof target[key] === 'object') {
        keyTrack.push(key)
        recursiveEqual(target[key], source[key], errors, keyTrack)
      } else if (source[key] !== target[key]) {
        keyTrack.push(key)
        errors.push({
          message: `${target[key]} not equal ${source[key]}`,
          field: keyTrack.join('.'),
          code: 'not_equal'
        })
      }
    }
  }
}
// 返回 body 等值比较
function deepEqual (target, source) {
  const errors = []
  const keyTrack = []
  recursiveEqual(target, source, errors, keyTrack)
  return errors.length === 0 ? undefined : errors
}
// 递归拍平
function recursiveFlatten (obj, result, keyTrack) {
  const keys = Object.keys(obj)
  for (const key of keys) {
    const value = obj[key]
    if (typeof value === 'object') {
      keyTrack.push(key)
      recursiveFlatten(value, result, keyTrack)
    } else {
      keyTrack.push(key)
      result[keyTrack.join('.')] = value
      keyTrack.length = 0
    }
  }
}
// 拍平对象
function flattenObject (obj) {
  const result = {}
  const keyTrack = []
  recursiveFlatten(obj, result, keyTrack)
  return result
}
// 递归替换
function recursiveReplace (obj, regex, value) {
  if (typeof obj !== 'object') {
    return
  }
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object') {
      recursiveReplace(obj[key], regex, value)
    } else if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(regex, value)
      if (typeof value === 'number') {
        obj[key] = Number(obj[key])
      }
    }
  }
}
// 根据上下文封装请求参数
function wrapperParams (node, context) {
  let { method, host, path, query, body } = JSON.parse(JSON.stringify(node))
  method = method || 'GET'
  // path, query, body
  const flattening = flattenObject(context)
  for (const key of Object.keys(flattening)) {
    const regex = new RegExp('\\${' + key + '}', 'g')
    path = path.replace(regex, flattening[key])
    recursiveReplace(query, regex, flattening[key])
    recursiveReplace(body, regex, flattening[key])
  }
  return { method, host, path, query, body }
}

class Machine {
  constructor ({ suit, steps, context }) {
    this.currentNumber = 0
    this.suit = suit
    this.steps = steps
    this.context = Object.assign({}, context)
  }

  async reduce (node) {
    console.log(color.highlight(`-----------------------${node.desc}-------------------------`))
    // 当前上下文
    const context = extract(this.context, node.import)
    console.log(color.info('当前上下文变量:'), context)

    console.log(color.highlight('开始访问接口'))
    const requestParams = wrapperParams(node, context)
    console.log(color.info(JSON.stringify(requestParams, null, 2)))
    const res = await httpRequest(requestParams)
    // const res = resArr[this.currentNumber]

    console.log(color.highlight('body 等值比较'))
    const equalError = deepEqual(res.body, node.equal)
    if (equalError !== undefined) {
      console.error(color.error('等值比较失败'))
      console.error(equalError)
      throw equalError
    }
    console.log(color.success('等值比较通过'))

    console.log(color.highlight('body 规则匹配'))
    const ruleError = parameter.validate(node.rule, res.body)
    if (ruleError !== undefined) {
      console.error(color.error('匹配不符合预期'))
      console.error(ruleError)
      throw ruleError
    }
    console.log(color.success('匹配符合预期'))

    inject(this.context, res.body, node.context)
    console.log(color.info('追加 body 到当前上下文'), this.context)
  }

  async run () {
    console.log(color.success(`---------------------${this.suit} 测试开始-----------------------`))
    while (!this.isDone) {
      // 处理测试单元
      await this.reduce(this.currentNode)
      this.currentNumber++
    }
    console.log(color.success(`---------------------${this.suit} 测试完毕-----------------------`))
  }

  get currentNode () {
    return this.steps[this.currentNumber] || {}
  }

  get isDone () {
    return this.currentNumber >= this.steps.length
  }
}

module.exports = Machine
