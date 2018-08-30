'use strict'
const Hserver = require('../index')
const Hstatic = require('hserver-static')

const port = 8081
const app = new Hserver()

// logger
app.use(async function(ctx, next) {
  console.log(this, ctx)
  await next()
  console.log('1', this.body)
})
// static middleware
app.use(async function(ctx, next) {
  this.body = 'hellow'
  await next()
})

app.use(async function(ctx, next) {
  this.body = '222222'
  await next()
})

app.listen(port)
console.log(`Server is running at http://127.0.0.1:${port}/`)
