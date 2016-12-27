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

exports = module.exports = class Context extends Emitter {
    /**
     * Initialize a new Context
     * @API public
     */
    constructor() {
        super();
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
            request: this.request.toJSON(),
            response: this.response.toJSON(),
            app: this.app.toJSON(),
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