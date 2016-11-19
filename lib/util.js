'use strict';
const co = require('co')
exports = module.exports = {
    isGeneratorFunction: function isGeneratorFunction(obj) {
        var constructor = obj.constructor;
        if (!constructor) {
            return false;
        }
        if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) {
            return true;
        }

        function isGenerator(obj) {
            return 'function' == typeof obj.next && 'function' == typeof obj.throw;
        }
        return isGenerator(constructor.prototype);
    },
    compose: function compose(middleware) {
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
        return function(context, next) {
            // last called middleware #
            let index = -1;
            return dispatch(0);

            function dispatch(i) {
                if (i <= index) {
                    return Promise.reject(new Error('next() called multiple times'));
                }
                index = i;
                let fn = middleware[i];
                if (i === middleware.length) {
                    fn = next;
                }
                if (!fn) {
                    return Promise.resolve();
                }
                try {
                    return Promise.resolve(fn(context, function next() {
                        return dispatch(i + 1);
                    }));
                } catch (error) {
                    return Promise.reject(error);
                }
            }
        }
    },
    convert: function convert(mw) {
        if (typeof mw !== 'function') {
            throw new TypeError('middleware must be a function')
        }
        if (mw.constructor.name !== 'GeneratorFunction') {
            // assume it's Promise-based middleware
            return mw
        }
        const converted = function(ctx, next) {
            return co.call(ctx, mw.call(ctx, createGenerator(next)))
        }

        function* createGenerator(next) {
            return yield next()
        }
        converted._name = mw._name || mw.name
        return converted
    },
    fresh: function fresh(req, res) {
        // defaults
        var etagMatches = true;
        var notModified = true;

        // fields
        var modifiedSince = req['if-modified-since'];
        var noneMatch = req['if-none-match'];
        var lastModified = res['last-modified'];
        var etag = res['etag'];
        var cc = req['cache-control'];

        // unconditional request
        if (!modifiedSince && !noneMatch) return false;

        // check for no-cache cache request directive
        if (cc && cc.indexOf('no-cache') !== -1) return false;

        // parse if-none-match
        if (noneMatch) noneMatch = noneMatch.split(/ *, */);

        // if-none-match
        if (noneMatch) {
            etagMatches = noneMatch.some(function(match) {
                return match === '*' || match === etag || match === 'W/' + etag;
            });
        }

        // if-modified-since
        if (modifiedSince) {
            modifiedSince = new Date(modifiedSince);
            lastModified = new Date(lastModified);
            notModified = lastModified <= modifiedSince;
        }

        return !!(etagMatches && notModified);
    }
}