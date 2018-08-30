/*!
 * Server context
 * Copyright(c) 2016 nashaofu
 * MIT Licensed
 */
'use strict'
/**
 * Module dependencies.
 */
const Emitter = require('events')
const statuses = require('statuses')
/**
 * Expose Context class.
 * Inherits from Emitter.
 */
exports = module.exports = class Context extends Emitter {
  /**
   * Initialize a new Context
   * @API public
   */
  constructor() {
    super()
    // delegates request and respond
    this.delegates()
  }
  /**
   * delegates request and respond
   * @return {Object} self
   * @API private
   */
  delegates() {
    // Request delegation.
    this._getter('request', [
      'url',
      'method',
      'accept',
      'type',
      'cache',
      'acceptEncoding',
      'acceptCharset',
      'acceptLanguage',
      'charset',
      'origin',
      'href',
      'protocol',
      'host',
      'hostname',
      'port',
      'path',
      'pathname',
      'search',
      'query',
      'header',
      'ip'
    ])._method('request', ['get', 'is'])
    // Response delegation.
    this._access('response', [
      'status',
      'body',
      'message',
      'length',
      'lastModified',
      'etag'
    ])
      ._getter('response', ['headerSent', 'writable'])
      ._setter('response', ['type'])
      ._method('response', ['set', 'append', 'remove'])
    return this
  }
  /**
   * Delegate method `name`.
   * @param  {String} target
   * @param  {String} name
   * @return {Context} self
   * @API private
   */
  _method(target, name) {
    if (!Array.isArray(name)) {
      name = [name]
    }
    for (let i = 0; i < name.length; i++) {
      this[name[i]] = function() {
        return this[target][name[i]].apply(this[target], arguments)
      }
    }
    return this
  }
  /**
   * Delegator accessor `name`.
   * @param  {String} target
   * @param  {String} name
   * @return {Context} self
   * @API private
   */
  _access(target, name) {
    this._getter(target, name)._setter(target, name)
    return this
  }
  /**
   * Delegator getter `name`.
   * @param  {String} target
   * @param  {String} name
   * @return {Context} self
   * @API private
   */
  _getter(target, name) {
    if (!Array.isArray(name)) {
      name = [name]
    }
    for (let i = 0; i < name.length; i++) {
      this.__defineGetter__(name[i], function() {
        return this[target][name[i]]
      })
    }
    return this
  }
  /**
   * Delegator setter `name`.
   * @param  {String} target
   * @param  {String} name
   * @return {Context} self
   * @API private
   */
  _setter(target, name) {
    if (!Array.isArray(name)) {
      name = [name]
    }
    for (let i = 0; i < name.length; i++) {
      this.__defineSetter__(name[i], function(value) {
        return (this[target][name[i]] = value)
      })
    }
    return this
  }
  /**
   * Warp error info
   * @param  {String|Number} err
   * @return {Error} error
   * @API public
   */
  throw(err) {
    if ('string' === typeof err) {
      err = {
        msg: err,
        status: 0
      }
    }
    var error = new Error(err.msg)
    error.status = err.status
    return error
  }
  /**
   * Default error handling.
   * @param {Error} err
   * @api private
   */
  onerror(error) {
    if (null == error) {
      return
    }
    if (!(error instanceof Error)) {
      error = new Error(`non-error thrown: ${error}`)
    }
    if ('number' != typeof error.status) {
      error.status = parseInt(error.message)
    }
    this.app.emit('error', error, this)

    if (this.headerSent || !this.writable) {
      error.headerSent = true
      return
    }
    // set Content-Type
    this.type = 'text'
    // ENOENT support
    if ('ENOENT' == error.code) {
      error.status = 404
    }
    if ('number' != typeof error.status || !statuses[error.status]) {
      error.status = 500
    }
    // respond
    const msg = error.expose ? error.message : statuses[error.status]
    this.status = error.status
    this.length = Buffer.byteLength(msg)
    this.res.end(msg)
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
   * Return JSON representation.
   * @return {Object}
   * @api public
   */
  toJSON() {
    return {
      app: this.app,
      request: this.request,
      response: this.response,
      req: '<original node req>',
      res: '<original node res>'
    }
  }
}
