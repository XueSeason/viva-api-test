// http:\/\/[a-zA-Z.]+\/\d+\/
const regex = new RegExp('http:\\/\\/[a-zA-Z.]+\\/\\d+\\/')
console.log(regex.test('http://www.snapvote.me/10/'))
