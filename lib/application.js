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
const request = require('./request');
const response = require('./response');
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
        this.middleware.push(function (context, next) {
            return fn.call(context, next);
        });
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
        const fn = this.getMiddleware();
        return (req, res) => {
            const ctx = this.handle(req, res);
            fn(ctx, () => this.send(ctx));
        }
    }
    getMiddleware() {
        const middleware = this.middleware;
        if (!Array.isArray(middleware)) {
            throw new TypeError('Middleware stack must be an array!');
        }
        for (const fn of middleware) {
            if (typeof fn !== 'function') {
                throw new TypeError('Middleware must be composed of functions!');
            }
        }
        /**
         * @param {Object} context
         * @return {Promise}
         * @api public
         */
        return function (context, next) {
            // last called middleware #
            let index = -1;
            function dispatch(i) {
                index = i;
                let fn = middleware[i];
                if (!fn || i === middleware.length) {
                    fn = next;
                }
                return fn(context, function () {
                    return dispatch(i + 1);
                });
            }
            return dispatch(0);
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
        const context = Object.create(null);

        request.app = response.app = context.app = this;
        request.req = response.req = context.req = req;
        request.res = response.res = context.res = res;

        response.request = context.request = request;
        request.response = context.response = response;
        request.context = response.context = context;
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
        res.end(body || ctx.response.message);
    }
    /**
     * Return JSON representation for showing settings.
     * @return {Object}
     * @api public
     */
    toJSON() {
        return {
            env: this.env,
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
        return this.toJSON();
    }
    /**
     * Default error handler.
     * @param {Error} err
     * @api private
     */
    onerror(error) {
        const msg = error.toString();
        console.error(msg);
    }
};