/*!
 * Server context
 * Copyright(c) 2016 程刁
 * MIT Licensed
 */
'use strict';
const context = exports = module.exports = {
    get accept() {
        return this.request.accept;
    },
    get url() {
        return this.request.url;
    },
    get method() {
        return this.request.method;
    },
    /**
     * Throw an error with `msg` and optional `status`
     */
    throw() {
        throw createError.apply(null, arguments);
    },

    /**
     * Default error handling.
     * @param {Error} err
     * @api private
     */
    onerror(err) {
        this.res.wirteHead(500);
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
            accept: this.accept,
            req: '<original node req>',
            res: '<original node res>'
        };
    }
}