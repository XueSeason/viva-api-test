const crypto = require('crypto')

function md5 (body) {
  const rawBody = JSON.stringify(body)
  const base64Str = Buffer.from(rawBody).toString('base64')
  const salt = new Date().valueOf()
  const str = crypto.createHash('md5').update(base64Str + salt).digest('hex')

  return Object.assign({}, body, { j: str })
}

module.exports = md5
