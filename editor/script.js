/* global JSONEditor */
var element = document.getElementById('editor')

JSONEditor.defaults.options.theme = 'bootstrap3'
JSONEditor.defaults.options.iconlib = 'fontawesome4'

var editor = new JSONEditor(element, {
  schema: {
    title: '测试用例 - 编辑器',
    type: 'object',
    properties: {
      suit: { type: 'string', title: '业务名词' },
      context: { type: 'object', title: '业务上下文', format: 'grid' },
      steps: {
        type: 'array',
        title: '步骤',
        format: 'grid',
        uniqueItems: true,
        items: {
          type: 'object',
          title: 'Step',
          properties: {
            desc: { type: 'string', title: '步骤描述' },
            method: { type: 'string', enum: ['GET', 'POST', 'PUT'] },
            host: { type: 'string' },
            path: { type: 'string' },
            contentType: { type: 'string', enum: ['form', 'json'] },
            import: { type: ['string', 'array', 'object'], format: 'grid' },
            body: { type: 'object', format: 'grid' },
            rule: { type: 'object', format: 'grid' },
            context: { type: 'object', format: 'grid' },
            filter: { type: 'object', format: 'grid' }
          }
        }
      }
    }
  }
})

editor.on('ready', function () {
  editor.validate()
})
