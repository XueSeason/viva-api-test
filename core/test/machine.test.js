const voteOption = require('../../cases/vote.json')
const Machine = require('../machine')

const machine = new Machine(voteOption)
machine.run()

// const resArr = [
//   { status: 200, body: { result: true, token: 'aaaabbbbccc' } },
//   { status: 200, body: { result: true, data: { id: 1111, link: 'http://www.snapvote.me/15' } } },
//   {
//     status: 200,
//     body: { result: true, data: { id: 1111, title: 'aaaa', img: 'xxxx.png', result: [1, 2], type: 'lr' } }
//   }
// ]

// const options = 's.token'
// const options = ['uid', 's.token']
// const options = {
//   uid: 'uid',
//   accessToken: 's.token'
// }
// const str = extract({
//   uid: 'vivatest',
//   s: { token: 'xxxxxyyyyy' }
// }, options)
// console.log(str)

// console.log(flattenObject({ a: 1, b: { c: 2 } }))

// console.log(deepEqual(resArr[2], { status: 200, body: { result: true } }))
// console.log(deepEqual({
//   records: [{
//     id: 0,
//     name: 'season'
//   }, {
//     id: 1,
//     name: 'xue'
//   }]
// }, {
//   records: {
//     '0': {
//       id: 1,
//       name: 'xue'
//     }
//   }
//   }))