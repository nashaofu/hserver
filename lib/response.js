/*!
 * Server response
 * Copyright(c) 2016 程刁
 * MIT Licensed
 */

'use strict';
const statuses = require('statuses');

const response = exports = module.exports = {
    get status() {
        return this.res.statusCode || 404;
    },
    set status(status) {
        this.res.statusCode = status;
        this.res.statusMessage = statuses[status];
    },
    get message() {
        return this.res.statusMessage || statuses[this.status];
    },
    set message(msg) {
        this.res.statusMessage = msg;
    },
    get header() {
        return this.res._headers || {};
    },
    set length(length) {
        this.set('Content-Length', length);
    },
    get(field) {
        return this.header[field.toLowerCase()] || '';
    },
    set(field, val) {
        if (2 == arguments.length) {
            if (Array.isArray(val)) {
                val = val.map(String);
            } else {
                val = String(val);
            }
            this.res.setHeader(field, val);
        } else {
            for (const key in field) {
                this.set(key, field[key]);
            }
        }
    },
    /**
     * Return JSON representation for showing settings.
     * @return {Object}
     * @api public
     */
    toJSON() {
        return {
            status: this.status,
            message: this.message,
            header: this.header
        }
    },

    /**
     * Inspect implementation.
     * @return {Object}
     * @api public
     */
    inspect() {
        const o = this.toJSON();
        o.body = this.body;
        return o;
    }
}