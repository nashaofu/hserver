/*!
 * Server context
 * Copyright(c) 2016 程刁
 * MIT Licensed
 */
'use strict';
/**
 * Module dependencies.
 */
const delegate = require('delegates');
const statuses = require('statuses');

const context = exports = module.exports = {
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
            headerSent: this.headerSent,
            writable: this.writable,
            req: '<original node req>',
            res: '<original node res>'
        };
    }
}

/**
 * Response delegation.
 */
delegate(context, 'response')
    .method('remove')
    .method('set')
    .method('append')
    .access('status')
    .access('message')
    .access('body')
    .access('length')
    .access('type')
    .access('lastModified')
    .access('etag')
    .getter('headerSent')
    .getter('writable');

/**
 * Request delegation.
 */
delegate(context, 'request')
    .method('acceptsLanguage')
    .method('acceptsEncoding')
    .method('acceptsCharsets')
    .method('accept')
    .method('get')
    .method('is')
    .getter('socket')
    .getter('search')
    .getter('method')
    .getter('query')
    .getter('path')
    .getter('url')
    .getter('origin')
    .getter('href')
    .getter('protocol')
    .getter('host')
    .getter('hostname')
    .getter('header')
    .getter('cache')
    .getter('ip');