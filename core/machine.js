const path = require('path')
const Parameter = require('parameter')
const { httpRequest, stringTemplate } = require('../common/util')

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
          message: `type ${typeof target[key]} ${target[key]} not equal type ${typeof source[key]} ${source[key]}`,
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
// 对象模板实现
function objectTemplate (target, context) {
  if (typeof target !== 'object') {
    return target
  }
  const obj = JSON.parse(JSON.stringify(target))

  function recursive (mutation, context) {
    for (const key of Object.keys(mutation)) {
      if (typeof mutation[key] === 'object') {
        recursive(mutation[key], context)
      } else if (typeof mutation[key] === 'string') {
        mutation[key] = stringTemplate(mutation[key], context)
      }
    }
  }
  recursive(obj, context)
  return obj
}
// 根据上下文封装请求参数
function wrapperParams (node, context) {
  let { method, host, path: urlPath, contentType, query, body } = JSON.parse(JSON.stringify(node))
  method = method || 'GET'
  contentType = contentType || 'json'
  // stringTemplate
  urlPath = stringTemplate(urlPath, context)
  query = objectTemplate(query, context)
  body = objectTemplate(body, context)
  // filter
  if (typeof node.filter === 'object') {
    const filters = Object.keys(node.filter)
    for (const filter of filters) {
      const filename = path.join(process.workspace, 'filters', `${filter}.js`)
      const foo = require(filename)
      const target = node.filter[filter]
      if (target === 'body') {
        body = foo(body, node, context)
      } else if (target === 'query') {
        query = foo(query, node, context)
      } else if (target === 'path') {
        urlPath = foo(urlPath, node, context)
      }
    }
  }
  return { method, host, path: urlPath, contentType, query, body }
}

class Machine {
  constructor (
    { suit, steps, context },
    {
      suitDidMount, suitWillUnmount,
      eachStepWillMount, eachStepWillRequest, eachStepReceivedError, eachStepWillUnmount
    }) {
    this.currentNumber = 0
    this.suit = suit
    this.steps = steps
    this.context = Object.assign({}, context)

    if (suitDidMount) this.suitDidMount = suitDidMount.bind(this)
    if (suitWillUnmount) this.suitWillUnmount = suitWillUnmount.bind(this)
    if (eachStepWillMount) this.eachStepWillMount = eachStepWillMount.bind(this)
    if (eachStepWillRequest) this.eachStepWillRequest = eachStepWillRequest.bind(this)
    if (eachStepReceivedError) this.eachStepReceivedError = eachStepReceivedError.bind(this)
    if (eachStepWillUnmount) this.eachStepWillUnmount = eachStepWillUnmount.bind(this)
  }

  async reduce (node) {
    const context = extract(this.context, node.import)

    const requestParams = wrapperParams(node, context)
    this.eachStepWillRequest && this.eachStepWillRequest(requestParams)
    const res = await httpRequest(requestParams)

    if (res.body !== undefined && res.body !== null) {
      const equal = objectTemplate(node.equal, context)
      const equalError = deepEqual(res.body, equal)
      if (equalError !== undefined) {
        this.eachStepReceivedError &&
          this.eachStepReceivedError(equalError, 'equal', { context, body: res.body, validate: equal })
      }

      const rule = node.rule
      const ruleError = parameter.validate(rule, res.body)
      if (ruleError !== undefined) {
        this.eachStepReceivedError &&
          this.eachStepReceivedError(ruleError, 'rule', { context, body: res.body, validate: rule })
      }
    }

    inject(this.context, res.body, node.context)
  }

  async run () {
    this.suitDidMount && this.suitDidMount()
    while (!this.isDone) {
      this.eachStepWillMount && this.eachStepWillMount(this.currentNode)
      await this.reduce(this.currentNode)
      this.eachStepWillUnmount && this.eachStepWillUnmount(this.currentNode)
      this.currentNumber++
    }
    this.suitWillUnmount && this.suitWillUnmount()
  }

  get currentNode () {
    return this.steps[this.currentNumber] || {}
  }

  get isDone () {
    return this.currentNumber >= this.steps.length
  }
}

module.exports = Machine
