/*!
 * Server request
 * Copyright(c) 2016 程刁
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */
const http = require('http');
const url = require('url');
const path = require('path');
const request = exports = module.exports = {
    get header() {
        return this.req.headers;
    },
    get url() {
        return this.req.url;
    },
    get origin() {
        return `${this.req.protocol}://${this.req.host}`;
    },
    get method() {
        return this.req.method;
    },
    get accept() {
        return this.header;
    },
    /**
     * Return JSON representation for showing settings.
     * @return {Object}
     * @api public
     */
    toJSON() {
        return {
            origin: this.origin,
            url: this.url,
            method: this.method,
            accept: this.accept,
            header: this.heade
        }
    },

    /**
     * Inspect implementation.
     * @return {Object}
     * @api public
     */
    inspect() {
        return this.toJSON();
    }
}