/*!
 * Server
 * Copyright(c) 2016 程刁
 * MIT Licensed
 */
'use strict';
/**
 * Module dependencies.
 */
const http = require('http');
const Emitter = require('events');
const Stream = require('stream');
const util = require('./util');
const request = require('./request');
const response = require('./response');
const context = require('./context');
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
        super();
        this.middleware = [];
        this.env = process.env.NODE_ENV || 'development';
        this.request = Object.create(request);
        this.response = Object.create(response);
        this.context = Object.create(context);
    }
    /**
     * Use the given middleware `fn`.
     * @param {Function} fn
     * @return {Application} self
     * @api public
     */
    use(fn) {
        fn = util.convert(fn);
        this.middleware.push(fn);
        return this;
    }
    /**
     * Create a http server
     * @param {Mixed} ...
     * @return {Server}
     * @API public
     */
    listen() {
        const server = http.createServer(this.callback());
        return server.listen.apply(server, arguments);
    }
    /**
     * Return a request handler callback
     * for node's native http server.
     * @return {Function}
     * @api public
     */
    callback() {
        if (!this.listeners('error').length) {
            this.on('error', this.onerror);
        }
        const fn = util.compose(this.middleware);
        return (req, res) => {
            const ctx = this.handle(req, res);
            fn(ctx).then(() => this.send(ctx)).catch(error => ctx.onerror(error));
        }
    }
    /**
     * Initialize a new context.
     * @return {context}
     * @api private
     */
    handle(req, res) {
        const request = Object.create(this.request);
        const response = Object.create(this.response);
        const context = Object.create(this.context);

        request.app = response.app = context.app = this;
        request.req = response.req = context.req = req;
        request.res = response.res = context.res = res;

        response.request = context.request = request;
        request.response = context.response = response;
        request.ctx = response.ctx = context;
        return context;
    }
    /**
     * Response send context 
     * @param  ctx
     * @api private
     */
    send(ctx) {
        const res = ctx.res;
        const body = ctx.body;
        // responses
        if (Buffer.isBuffer(body)) {
            return res.end(body);
        }
        if ('string' == typeof body) {
            return res.end(body);
        }
        if (body instanceof Stream) {
            return body.pipe(res);
        }
    }
    /**
     * Return JSON representation for showing settings.
     * @return {Object}
     * @api public
     */
    toJSON() {
        return {
            env: this.env,
            middleware: this.middleware
        }
    }
    /**
     * Inspect implementation.
     * @return {Object}
     * @api public
     */
    inspect() {
        return this.toJSON();
    }
    /**
     * Default error handler.
     * @param {Error} err
     * @api private
     */
    onerror(error) {
        const msg = error.toString();
        console.log(error);
        console.error(msg);
    }
};