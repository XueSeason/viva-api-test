# viva-api-test

viva-api-test 是一个 REST API 测试工具

- **声明式:** 只需编写 JSON 配置文件，viva-api-test 可以友好地创建测试用例。
- **上下文变量:** viva-api-test 可以保存接口调用的上下文变量，这些变量可以在随后的接口调用时被使用。
- **模块化:** 封装每个测试用例成为模块，可以无痛地衔接每个测试用例，构造一个复杂的业务测试流程。
- **结果校验:** 方便校验接口调用结果，错误提示友好。

## Guide

### 配置

每一个 JSON 文件对应一个业务测试流程，viva-api-test 会对指定目录下所有 JSON 文件装载到测试工具中。

### suit [String]

对应业务测试的名称描述

### context [Object]

业务上下文预配置

### steps [Array]

业务测试的步骤，每个步骤都是一个单元测试

#### desc [String]

步骤描述

#### import [String|Array|Object]

导入业务上下文变量到当前上下文，通常是通过 String 或者 Array 加载一个或者多个上下文变量。

例如:

```js
// 假设业务上下文为
// {
//   uid: 'vivatest',
//   s: { token: 'xxxxxyyyyy' }
// }
// 按照如下配置获取到的当前上下文 { s: { token: 'xxxxxyyyyy' } }
"import": "s.token"
// 按照如下配置获取到的当前上下文 { uid: 'vivatest', s: { token: 'xxxxxyyyyy' } }
"import": ["uid", "s.token"]
```

如果需要对上下文变量进行重命名，需要通过 Object 来为指定上下文变量指定一个别名。

```js
// 假设业务测试的上下文为
// {
//   uid: 'vivatest',
//   s: { token: 'xxxxxyyyyy' }
// }
// 按照如下配置获取到的当前上下文 { uid: 'vivatest', accessToken: 'xxxxxyyyyy' }
"import": {
  "uid": "uid",
  "accessToken": "s.token"
}
```

#### method [String] `可为空`

请求动作，默认为 'GET'

#### host [String]

请求对应 host

#### path [String] `可配置`

请求路径，可以通过上下文变量进行配置。

```js
"import": "voteId", // 导入业务上下文变量 voteId 到当前上下文中
"path": "vote/${voteId}" // 通过模板语法和当前上下文变量，替换 path 路径
```

#### query [Object] `可配置` `可为空`

请求的查询字符串对象，可以通过上下文变量配置，配置方法同 path。

#### body [Object] `可配置` `可为空`

请求体，可以通过上下文变量配置，配置方法同 path。

#### rule [Object] `可为空`

对返回的 body 进行验证 [parameter](https://github.com/node-modules/parameter)

[Example](https://github.com/node-modules/parameter/blob/master/example.js)

#### equal [Object] `可为空`

对返回的 body 进行等值比较。

#### context [Object] `可为空`

将 body 返回的数据导入到业务上下文中，供后续接口使用。

例如：

```js
// 这里保证了 body 的 data 字段中存在 id 属性
"rule": {
  "data": {
    "type": "object",
    "rule": {
      "id": "int",
      "link": "string"
    }
  }
},
// 将 data.id 保存到业务上下文对应的 voteId 中
"context": {
  "voteId": "data.id"
}
```

## Example

```json
{
  "suit": "注册设备并创建投票", // 业务名称
  "context": {
    "uid": "vivatest" // 设置上下文变量，值为 vivatest
  },
  "steps": [{ // 业务接口调用步骤
    "import": ["uid"], // 在此步骤导入上下文变量
    "desc": "注册设备", // 步骤描述
    "method": "PUT",
    "host": "http://localhost:7001",
    "path": "/user",
    "body": { // 请求 body
      "uid": "${uid}" // 在 body 中对上下文变量进行文本替换， ${param} 形式
    },
    // 假设返回数据 { status: 200, body: { result: true, token: "xxxxyyyyzzzz" } }
    "rule": { // response body 参数验证
      "result": "bool", // 验证 result 为 bool 类型
      "token": "string"
    },
    "equal": { // response body 等值比较
      "result": true // result 的值为 true
    },
    "context": {
      "token": "token" // ${token} 为 body 返回的值，并设置为上下文变量
    }
  }, {
    "import": ["token", "uid"], // 导入上下文变量 token
    "desc": "上传投票信息",
    "method": "POST",
    "host": "http://localhost:7001",
    "path": "/vote",
    "query": {
      "uid": "${uid}",
    },
    "body": {
      "token": "${token}",
      "title": "Which is the best?",
      "img": "xxxx.png"
    },
    // 假设返回数据 { status: 200, body: { result: true, data: { id: 1111, link: 'http://www.snapvote.me/15' } } }
    "rule": {
      "data": {
        "type": "object",
        "rule": {
          "id": "int",
          "link": "string"
        }
      }
    },
    "equal": {
      "result": true
    },
    "context": {
      "voteId": "data.id" // 将 body 里的 data.id 设置为上下文变量 voteId
    }
  }, {
    "import": ["token", "voteId"],
    "desc": "获取投票详情",
    "method": "GET",
    "host": "http://localhost:7001",
    "path": "vote/${voteId}", // 替换上下文变量
     // 假设返回数据 {
    //   status: 200,
    //   body: { result: true, data: { id: 1111, title: 'aaaa', img: 'xxxx.png', result: [1, 2], type: 'lr' } }
    // }
    "rule": {
      "data": {
        "type": "object",
        "rule": {
          "id": "int",
          "title": "string",
          "img": "string",
          "result": {
            "type": "array",
            "itemType": "int"
          },
          "type": [
            "lr",
            "rm"
          ]
        }
      }
    }
  }]
}
```