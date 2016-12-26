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
const qs = require('querystring');
const typeis = require('type-is');

const request = exports = module.exports = {
    /**
     * Get request header.
     * @return {Object}
     * @api public
     */
    get header() {
        return this.req.headers;
    },
    /**
     * Get request method.
     * @return {String}
     * @api public
     */
    get method() {
        return this.req.method;
    },
    /**
     * Get request URL.
     * @return {String}
     * @api public
     */
    get url() {
        return this.req.url;
    },
    /**
     * Get origin of URL.
     * @return {String}
     * @api public
     */
    get origin() {
        return `${this.protocol}://${this.host}`;
    },
    /**
     * Get full request URL.
     * @return {String}
     * @api public
     */
    get href() {
        return `${this.origin}${this.pathname}${this.search}`;
    },
    /**
     * Get request path.
     * @return {String}
     * @api public
     */
    get path() {
        return url.parse(this.req.url).path;
    },
    /**
     * Get request pathname.
     * @return {String}
     * @api public
     */
    get pathname() {
        return url.parse(this.req.url).pathname;
    },
    /**
     * Parse the "Host" header field host
     * and support X-Forwarded-Host when a
     * proxy is enabled.
     * @return {String} hostname:port
     * @api public
     */
    get host() {
        const proxy = this.app.proxy;
        let host = proxy && this.get('X-Forwarded-Host');
        host = host || this.get('Host');
        if (!host) {
            return '';
        }
        return host.split(/\s*,\s*/)[0];
    },
    /**
     * Parse the "Host" header field hostname
     * and support X-Forwarded-Host when a
     * proxy is enabled.
     * @return {String} hostname
     * @api public
     */
    get hostname() {
        const host = this.host;
        if (!host) {
            return '';
        }
        return host.split(':')[0];
    },
    /**
     * Get the search string.
     * except it includes the leading ?.
     * @return {String}
     * @api public
     */
    get search() {
        return url.parse(this.req.url).search || '';
    },
    /**
     * Get parsed query-string.
     * @return {Object}
     * @api public
     */
    get query() {
        if (!this.req) {
            return '';
        }
        const key = url.parse(this.req.url).query || '';
        const query = {};
        return query[key] || (query[key] = qs.parse(key));
    },
    /**
     * Get the protocol string "http" or "https"
     * @return {String}
     * @api public
     */
    get protocol() {
        const proxy = this.app.proxy;
        if (this.socket.encrypted) {
            return 'https';
        }
        if (!proxy) {
            return 'http';
        }
        const proto = this.get('X-Forwarded-Proto') || 'http';
        return proto.split(/\s*,\s*/)[0];
    },
    /**
     * Get the request port.
     * @return {Connection}
     * @api public
     */
    get port() {
        const host = this.host;
        if (!host) {
            return '';
        }
        return host.split(':')[1];
    },
    /**
     * When `app.proxy` is `true`, parse
     * the "X-Forwarded-For" ip address list.
     * @return {Array}
     * @api public
     */
    get ip() {
        const proxy = this.app.proxy;
        const val = this.get('X-Forwarded-For');
        return proxy && val ? val.split(/\s*,\s*/) : [];
    },
    /**
     * Get the request socket.
     * @return {Connection}
     * @api public
     */
    get socket() {
        return this.req.socket;
    },
    /**
     * Check if the request is fresh
     * Last-Modified and/or the ETag
     * still match.
     * @return {Boolean}
     * @api public
     */
    get cache() {
        const method = this.method;
        const status = this.response.status;
        if ('GET' != method && 'HEAD' != method) return false;
        if ((status >= 200 && status < 300) || 304 == status) {
            // cache function
            return false;
        }
        return false;
    },
    /**
     * Check if the given `type(s)` is acceptable, returning
     * the best match when true, otherwise `undefined`, in which
     * case you should respond with 406 "Not Acceptable".
     * @return {Array}
     * @api public
     */
    get accept() {
        let accept = this.get('accept');
        if (!accept) {
            return [];
        }
        const types = accept.split(',');
        accept = [];
        for (var i = 0; i < types.length; i++) {
            accept.push(types[i].split(';')[0]);
        }
        return accept;
    },
    /**
     * Get accepted encodings or best fit based on `encodings`.
     * @return {Array}
     * @api public
     */
    get acceptEncoding() {
        const acceptEncoding = this.get('Accept-Encoding');
        return acceptEncoding.split(',') || []
    },
    /**
     * Get accepted charsets or best fit based on `charsets`.
     * @return {Array}
     * @api public
     */
    get acceptCharset() {
        let acceptCharset = this.get('Accept-Charset');
        if (!acceptCharset) {
            return ['*'];
        }
        const chaset = acceptCharset.split(',');
        acceptCharset = [];
        for (var i = 0; i < chaset.length; i++) {
            acceptCharset.push(chaset[i].split(';')[0]);
        }
        return acceptCharset;
    },
    /**
     * Get accepted languages or best fit based on `langs`.
     * @return {Array}
     * @api public
     */
    get acceptLanguage() {
        const acceptLanguage = this.get('Accept-Language').split(';');
        if (acceptLanguage[0]) {
            return acceptLanguage[0].split(',');
        }
        return [];
    },
    /**
     * Get the request mime type
     * @return {String}
     * @api public
     */
    get type() {
        const type = this.get('Content-Type');
        if (!type) {
            return '';
        }
        return type.split(';')[0];
    },
    /**
     * Get the request charset.
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
    },
    /**
     * Check if the incoming request contains the "Content-Type"
     * header field, and it contains any of the give mime `type`s.
     * If there is no request body, `null` is returned.
     * If there is no content type, `false` is returned.
     * Otherwise, it returns the first `type` that matches.
     * @param {String|Array} types...
     * @return {String|false|null}
     * @api public
     */
    is(types) {
        if (!types) {
            return typeis(this.req);
        }
        if (!Array.isArray(types)) {
            types = [].slice.call(arguments);
        }
        return typeis(this.req, types);
    },
    /**
     * Return request header.
     * @param {String} field
     * @return {String}
     * @api public
     */
    get(field) {
        const req = this.req;
        field = field.toLowerCase();
        switch (field) {
            case 'referer':
            case 'referrer':
                return req.headers.referrer || req.headers.referer || '';
            default:
                return req.headers[field] || '';
        }
    },
    /**
     * Return JSON representation for showing settings.
     * @return {Object}
     * @api public
     */
    toJSON() {
        return {
            href: this.href,
            origin: this.origin,
            protocol: this.protocol,
            host: this.host,
            hostname: this.hostname,
            port: this.port,
            url: this.url,
            path: this.path,
            pathname: this.pathname,
            search: this.search,
            query: this.query,
            method: this.method,
            ip: this.ip,
            header: this.header,
            socket: '<original node socket>',
            cache: this.cache,
            accept: this.accept,
            acceptEncoding: this.acceptEncoding,
            acceptCharset: this.acceptCharset,
            acceptLanguage: this.acceptLanguage,
            type: this.type,
            charset: this.charset
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