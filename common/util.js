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

// 构造 http 请求
async function httpRequest ({ method, host, path, query, body }) {
  const options = {
    method,
    uri: url.resolve(host, path),
    qs: query,
    headers: {
      'User-Agent': 'Viva-Test-Agent'
    },
    body,
    json: true,
    resolveWithFullResponse: true
  }
  const res = await rp(options)
  return { status: res.statusCode, body: res.body }
}

exports.listCases = listCases
exports.httpRequest = httpRequest
