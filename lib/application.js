/*!
 * Server
 * Copyright(c) 2016 nashaofu
 * MIT Licensed
 */
'use strict'
/**
 * Module dependencies.
 */
const http = require('http')
const Emitter = require('events')
const Stream = require('stream')
const Request = require('./request')
const Response = require('./response')
const Context = require('./context')
/**
 * Expose Server class.
 * Inherits from Emitter.
 */
exports = module.exports = class Server extends Emitter {
  /**
   * Initialize a new Server
   * @API public
   */
  constructor() {
    super()
    this.proxy = false
    this.middleware = []
    this.env = process.env.NODE_ENV || 'development'

    this.request = new Request()
    this.response = new Response()
    this.context = new Context()
    return this
  }
  /**
   * Use the given middleware `fn`.
   * @param {Function} fn
   * @return {Application} self
   * @api public
   */
  use(fn) {
    if (typeof fn !== 'function') {
      throw new TypeError('middleware must be a function')
    }
    this.middleware.push((context, next) => {
      return fn.call(context, context, next)
    })
    return this
  }
  /**
   * Create a http server
   * @param {Mixed} ...
   * @return {Server}
   * @API public
   */
  listen() {
    const server = http.createServer(this.callback())
    return server.listen.apply(server, arguments)
  }
  /**
   * Return a request handler callback
   * for node's native http server.
   * @return {Function}
   * @api public
   */
  callback() {
    if (!this.listeners('error').length) {
      this.on('error', this.onerror)
    }
    const handle = this.handle()
    return (req, res) => {
      // reset statusCode
      res.statusCode = 404
      // Create a new context
      const context = this.createContext(req, res)
      // execute middleware
      handle(context)
        .then(() => this.send(context))
        .catch(error => this.onerror(error))
    }
  }
  /**
   * Wrap application middleware.
   * @return {Function}
   * @api private
   */
  handle() {
    const middleware = this.middleware
    if (!Array.isArray(middleware)) {
      throw new TypeError('Middleware stack must be an array!')
    }
    for (let i = 0, length = middleware.length; i < length; i++) {
      if (typeof middleware[i] !== 'function') {
        throw new TypeError('Middleware must be composed of functions!')
      }
    }
    /**
     * @param {Object} context
     * @param {Function} next
     * @return {Function}
     * @api public
     */
    return function(context) {
      function next(i) {
        const fn = middleware[i]
        if (!fn) return Promise.resolve(context)
        try {
          return Promise.resolve(fn(context, () => next(i + 1)))
        } catch (err) {
          return Promise.reject(err)
        }
      }
      return next(0)
    }
  }
  /**
   * Create a new context.
   * @param  {Object} req
   * @param  {Object} res
   * @return {Object} context
   * @api private
   */
  createContext(req, res) {
    const request = Object.create(this.request)
    const response = Object.create(this.response)
    const context = Object.create(this.context)

    request.app = response.app = context.app = this
    request.req = response.req = context.req = req
    request.res = response.res = context.res = res

    response.request = context.request = request
    request.response = context.response = response
    request.context = response.context = context
    return context
  }
  /**
   * Response send context
   * @param  {Object} context
   * @api private
   */
  send(context) {
    const res = context.res
    const body = context.body
    const message = context.message || String(context.status)
    if (!context.writable) {
      return
    }
    // Buffer
    if (Buffer.isBuffer(body)) {
      return res.end(body)
    }
    // String
    if ('string' == typeof body) {
      return res.end(body)
    }
    // Stream
    if (body instanceof Stream) {
      return body.pipe(res)
    }
    if (!res.headersSent) {
      context.length = Buffer.byteLength(body || message)
    }
    res.end(body || message)
  }
  /**
   * Return JSON representation for showing settings.
   * @return {Object}
   * @api public
   */
  toJSON() {
    return {
      env: this.env,
      proxy: this.proxy,
      middleware: this.middleware,
      callback: this.callback
    }
  }
  /**
   * Inspect implementation.
   * @return {Object}
   * @api public
   */
  inspect() {
    return this.toJSON()
  }
  /**
   * Default error handler.
   * @param {Error} err
   * @api private
   */
  onerror(error) {
    const msg = error.toString()
    console.error(msg)
  }
}
