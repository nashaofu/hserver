/*!
 * Server context
 * Copyright(c) 2016 程刁
 * MIT Licensed
 */
'use strict';
/**
 * Module dependencies.
 */
const Emitter = require('events');
const statuses = require('statuses');
/**
 * Expose Context class.
 * Inherits from Emitter.
 */
exports = module.exports = class Context extends Emitter {
    /**
     * Initialize a new Context
     * @param  {Object} app      Application
     * @param  {Object} request  Request
     * @param  {Object} response Response
     * @param  {Object} req      original node req
     * @param  {Object} res      original node res
     * @return {Object} self     Context
     * @API public
     */
    constructor(app, request, response, req, res) {
        super();
        this.app = app;
        this.request = request;
        this.response = response;
        this.req = req;
        this.res = res;

        this.request.app = this.response.app = this.app;
        this.request.req = this.response.req = this.req;
        this.request.res = this.response.res = this.res;

        this.response.request = this.request;
        this.request.response = this.response;

        this.delegates();

        return this;
    }
    /**
     * delegates request and respond
     * @return {Object} self
     */
    delegates() {
        this.url = this.request.url;
        this.method = this.request.method;
        this.accept = this.request.accept;

        this.status = this.response.status;
        this.body = this.response.body;
        this.headerSent = this.response.headerSent;
        this.writable = this.response.writable;

        this.get = this.request.get;
        this.set = this.response.set;
        return this;
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
        var error = new Error(err.msg);
        error.status = err.status;
        return error;
    }
    /**
     * Default error handling.
     * @param {Error} err
     * @api private
     */
    onerror(error) {
        if (null == error) {
            return;
        }
        if (!(error instanceof Error)) {
            error = new Error(`non-error thrown: ${error}`);
        }
        if ('number' != typeof error.status) {
            error.status = parseInt(error.message);
        }
        this.app.emit('error', error, this);

        if (this.headerSent || !this.writable) {
            error.headerSent = true;
            return;
        }
        // set Content-Type
        this.type = 'text';
        // ENOENT support
        if ('ENOENT' == error.code) {
            error.status = 404;
        }
        if ('number' != typeof error.status || !statuses[error.status]) {
            error.status = 500;
        }
        // respond
        const msg = error.expose ? error.message : statuses[error.status];
        this.status = error.status;
        this.length = Buffer.byteLength(msg);
        this.res.end(msg);
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
     * Return JSON representation.
     * @return {Object}
     * @api public
     */
    toJSON() {
        return {
            request: this.request,
            response: this.response,
            app: this.app,
            url: this.url,
            method: this.method,
            status: this.status,
            accept: this.accept,
            headerSent: this.headerSent,
            writable: this.writable,
            req: '<original node req>',
            res: '<original node res>'
        };
    }
}