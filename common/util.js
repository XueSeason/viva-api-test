const fs = require('fs')
const path = require('path')
const url = require('url')
const rp = require('request-promise')

// 同步获取测试用例
function listCases (dir) {
  const cases = []
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const extname = path.extname(file)
    if (extname === '.json') {
      const filePath = path.join(dir, file)
      const filename = path.basename(filePath, '.json')
      const data = fs.readFileSync(filePath)
      try {
        const obj = JSON.parse(data)
        cases.push({ filename, data: obj })
      } catch (error) {
        console.error(error)
      }
    }
  }
  return cases
}

// 字符串模板实现
function stringTemplate (template, context) {
  const regex = /(\\)?\$(\\)?\{([^{}\\]+)(\\)?\}/g
  let typeStr = 'string' // 还原类型
  const str = template.replace(regex, (world, slash1, slash2, token, slash3) => {
    if (slash1 || slash2 || slash3) {
      return world.replace(/\\/g, '')
    }
    const variables = token.trim().split('.')
    let current = JSON.parse(JSON.stringify(context))
    const track = []
    for (const variable of variables) {
      current = current[variable]
      track.push(variable)
      if (current === undefined || current === null) {
        console.warn(`${track.join('.')} 无法被索引`)
        return ''
      }
    }
    typeStr = typeof current
    return current
  })

  if (typeStr === 'number') {
    return Number(str)
  } else if (typeStr === 'boolean') {
    return Boolean(str)
  } else {
    return str
  }
}

// 构造 http 请求
async function httpRequest ({ method, host, path, contentType, query, body }) {
  const options = {
    method,
    uri: url.resolve(host, path),
    qs: query,
    headers: {
      'User-Agent': 'Viva-Test-Agent'
    },
    json: true,
    resolveWithFullResponse: true
  }
  if (contentType === 'form') {
    options.form = body
  } else {
    options.body = body
  }
  try {
    const res = await rp(options)
    return { status: res.statusCode, body: res.body }
  } catch (error) {
    console.error(error.options)
    console.error(error.error)
    console.error('statusCode:', error.statusCode)
    return { status: error.statusCode, body: error.error }
  }
}

exports.listCases = listCases
exports.httpRequest = httpRequest
exports.stringTemplate = stringTemplate
