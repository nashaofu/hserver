/*!
 * Server response
 * Copyright(c) 2016 nashaofu
 * MIT Licensed
 */
'use strict';
/**
 * Module dependencies.
 */
const Emitter = require('events');
const statuses = require('statuses');
const mime = require('mime-types');
const Stream = require('stream');
/**
 * Expose Response class.
 * Inherits from Emitter.
 */
exports = module.exports = class Response extends Emitter {
    /**
     * Initialize a new Request
     * @API public
     */
    constructor() {
        super();
        return this;
    }
    /**
     * Get the request socket.
     * @return {Connection}
     * @api public
     */
    get socket() {
        return this.req.socket;
    }
    /**
     * Get response status code.
     * @return {Number}
     * @api public
     */
    get status() {
        return this.res.statusCode;
    }
    /**
     * Set response status code.
     * @param {Number} code
     * @api public
     */
    set status(status) {
        if ('number' !== typeof status) {
            status = 500;
        }
        // use by set body in line 115
        this._setStatus = true;
        this.res.statusCode = status;
        this.res.statusMessage = statuses[status];
        if (this.body && statuses.empty[status]) {
            this.body = null;
        }
    }
    /**
     * Get response status message
     * @return {String}
     * @api public
     */
    get message() {
        return this.res.statusMessage || statuses[this.status];
    }
    /**
     * Set response status message
     * @param {String} msg
     * @api public
     */
    set message(msg) {
        this.res.statusMessage = msg;
    }
    /**
     * Get response header.
     * @return {Object}
     * @api public
     */
    get header() {
        return this.res._headers || {};
    }
    /**
     * Get response body.
     * @return {Mixed}
     * @api public
     */
    get body() {
        return this._body;
    }
    /**
     * Set response body.
     *
     * @param {String|Buffer|Object|Stream} val
     * @api public
     */
    set body(val) {
        const original = this._body;
        this._body = val;

        if (this.res.headersSent) {
            return;
        }
        if (null == val) {
            if (!statuses.empty[this.status]) {
                this.status = 204;
            }
            this.remove('Content-Type');
            this.remove('Content-Length');
            this.remove('Transfer-Encoding');
            return;
        }
        // set the status
        if (!this._setStatus) {
            this.status = 200;
        }
        // string
        if ('string' == typeof val) {
            if (!this.get('Content-Type')) {
                this.type = /^\s*</.test(val) ? 'html' : 'text';
            }
            this.length = Buffer.byteLength(val);
            return;
        }

        // buffer
        if (Buffer.isBuffer(val)) {
            if (!this.get('Content-Type')) {
                this.type = 'bin';
            }
            this.length = val.length;
            return;
        }
        // stream
        if ('function' == typeof val.pipe) {
            if (val instanceof Stream) {
                val.on('error', (error) => this.context.onerror(error));
            }
            // overwriting
            if (null != original && original != val) {
                this.remove('Content-Length');
            }
            if (!this.get('Content-Type')) {
                this.type = 'bin';
            }
            return;
        }
        // json
        this.remove('Content-Length');
        this.type = 'json';
    }
    /**
     * Get the response mime type
     * @return {String}
     * @api public
     */
    get type() {
        const type = this.get('Content-Type');
        if (!type) {
            return '';
        }
        return type.split(';')[0];
    }
    /**
     * Set the response mime type
     * @param {String}
     * @api public
     */
    set type(type) {
        let charset = '';
        if (this.charset) {
            charset = `;charset=${this.charset}`;
        }
        if (mime.lookup(type)) {
            type = mime.lookup(type)
        }
        this.set('Content-Type', `${type}${charset}`);
    }
    /**
     * Get the response charset
     * @return {String}
     * @api public
     */
    get charset() {
        const type = this.get('Content-Type');
        if (!type) {
            return '';
        }
        const charset = type.split(';')[1] || '';
        if (!charset) {
            return '';
        }
        return charset.split('=')[1] || '';
    }
    /**
     * Set the response charset
     * @return {String}
     * @api public
     */
    set charset(charset) {
        if (!charset) {
            charset = 'utf-8';
        }
        this.set('Content-Type', `${this.type};charset=${charset}`);
    }
    /**
     * Get parsed response Content-Length when present.
     * @return {Number}
     * @api public
     */
    get length() {
        const length = this.header['Content-Length'];
        const body = this.body;
        if (!length) {
            if (!body) {
                return;
            }
            if ('string' == typeof body) {
                return Buffer.byteLength(body);
            }
            if (Buffer.isBuffer(body)) {
                return body.length;
            }
            if ('object' == typeof body) {
                return Buffer.byteLength(JSON.stringify(body));
            }
            return;
        }
        return ~~length;
    }
    /**
     * Set Content-Length field to `length`.
     * @param {Number} length
     * @api public
     */
    set length(length) {
        this.set('Content-Length', length);
    }
    /**
     * Get the Last-Modified date in Date form, if it exists.
     * @return {Date}
     * @api public
     */
    get lastModified() {
        const date = this.get('last-modified');
        if (date) {
            return new Date(date);
        }
    }
    /**
     * Set the Last-Modified date using a string or a Date.
     * @param {String|Date} type
     * @api public
     */
    set lastModified(val) {
        if ('string' == typeof val) {
            val = new Date(val)
        };
        this.set('Last-Modified', val.toUTCString());
    }
    /**
     * Get the ETag of a response.
     * @return {String}
     * @api public
     */
    get etag() {
        return this.get('ETag');
    }
    /**
     * Set the ETag of a response.
     * This will normalize the quotes if necessary.
     * @param {String} etag
     * @api public
     */
    set etag(val) {
        this.set('ETag', val);
    }
    /**
     * Check if a header has been written to the socket.
     * @return {Boolean}
     * @api public
     */
    get headerSent() {
        return this.res.headersSent;
    }
    /**
     * Checks if the request is writable.
     * Tests for the existence of the socket
     * as node sometimes does not set it.
     * @return {Boolean}
     * @api private
     */
    get writable() {
        // can't write any more after response finished
        if (this.res.finished) {
            return false;
        }
        const socket = this.res.socket;
        if (!socket) {
            return true;
        }
        return socket.writable;
    }
    /**
     * Return response header.
     * @param {String} field
     * @return {String}
     * @api public
     */
    get(field) {
        return this.header[field.toLowerCase()] || '';
    }
    /**
     * Set header `field` to `val`, or pass
     * an object of header fields.
     * @param {String|Object|Array} field
     * @param {String} val
     * @api public
     */
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
    }
    /**
     * Append additional header `field` with value `val`.`
     * @param {String} field
     * @param {String|Array} val
     * @api public
     */
    append(field, val) {
        const prev = this.get(field);

        if (prev) {
            val = Array.isArray(prev) ?
                prev.concat(val) :
                [prev].concat(val);
        }

        return this.set(field, val);
    }
    /**
     * Remove header `field`.
     * @param {String} name
     * @api public
     */
    remove(field) {
        this.res.removeHeader(field);
    }
    /**
     * Return JSON representation for showing settings.
     * @return {Object}
     * @api public
     */
    toJSON() {
        return {
            status: this.status,
            message: this.message,
            header: this.header,
            body: this.body,
            type: this.type,
            charset: this.charset,
            length: this.length,
            lastModified: this.lastModified,
            etag: this.etag,
            writable: this.writable,
            socket: '<original node socket>',
        }
    }
    /**
     * Inspect implementation.
     * @return {Object}
     * @api public
     */
    inspect() {
        return this.toJSON();;
    }
}