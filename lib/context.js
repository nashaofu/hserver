/*!
 * Server context
 * Copyright(c) 2016 程刁
 * MIT Licensed
 */
'use strict';
/**
 * Module dependencies.
 */
const statuses = require('statuses');

const context = exports = module.exports = {
    get url() {
        return this.request.url;
    },
    get method() {
        return this.request.method;
    },
    get status() {
        return this.response.status;
    },
    get accept() {
        return this.request.accept;
    },
    /**
     * Throw an error with `msg` and optional `status`
     */
    throw() {
        throw 'error';
    },

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
        this.app.emit('error', error, this);
        console.log(error)
        // respond
        const code = statuses[error.status] || statuses[500];
        const msg = error.expose ? error.message : code;
        this.response.status = error.status || 500;
        this.response.length = Buffer.byteLength(msg);
        this.res.end(msg);
    },
    /**
     * Inspect implementation.
     * @return {Object}
     * @api public
     */
    inspect() {
        return this.toJSON();
    },
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
            req: '<original node req>',
            res: '<original node res>',
            options: {}
        };
    }
}