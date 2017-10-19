const path = require('path')
const { listCases, httpRequest } = require('../util')

const dir = path.join(__dirname, '../../cases/')
console.log(JSON.stringify(listCases(dir), null, 2))

// 50026164-25DB-4EE4-AD56-40B946FB4548
// ;(async function () {
//   const options = {
//     method: 'GET',
//     host: 'http://10.0.32.76:7001',
//     path: '/themes',
//     query: {
//       type: 1
//     }
//   }
//   const data = await httpRequest(options)
//   console.log(JSON.stringify(data))
// })()

// ;(async function () {
//   const options = {
//     method: 'POST',
//     host: 'http://10.0.32.76:7001',
//     path: '/vote/14',
//     body: {
//       index: 1
//     }
//   }
//   const data = await httpRequest(options)
//   console.log(JSON.stringify(data))
// })()
