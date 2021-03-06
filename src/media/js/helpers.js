define('helpers',
       ['l10n', 'nunjucks', 'underscore', 'utils', 'format', 'settings', 'urls', 'user'],
       function(l10n, nunjucks, _, utils) {

    var SafeString = nunjucks.require('runtime').SafeString;
    var filters = nunjucks.require('filters');

    function make_safe(func) {
        return function() {
            return new SafeString(func.apply(this, arguments));
        };
    }

    function safe_filter(name, func) {
        filters[name] = make_safe(func);
    }

    filters.extend = function(base, kwargs) {
        delete kwargs.__keywords;
        return _.extend(base, kwargs);
    };

    filters.urlparams = utils.urlparams;
    filters.urlunparam = utils.urlunparam;

    safe_filter('nl2br', function(obj) {
        if (typeof obj !== 'string') {
            return obj;
        }
        return obj.replace(/\n/g, '<br>');
    });

    safe_filter('make_data_attrs', function(obj) {
        return _.pairs(obj).map(function(pair) {
            return 'data-' + utils.escape_(pair[0]) + '="' + utils.escape_(pair[1]) + '"';
        }).join(' ');
    });

    safe_filter('external_href', function(obj) {
        return 'href="' + utils.escape_(obj) + '" target="_blank"';
    });

    filters.translate = utils.translate;

    filters.numberfmt = function(num) {
        if (typeof num === 'number' && num.toLocaleString) {
            return num.toLocaleString();
        }
        return num;
    };

    filters.datetime = function(date) {
        if (!date) {
            return '';
        }
        var orig_date = date;
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        var dateStr = date.toLocaleString();
        if (dateStr === 'Invalid Date') {
            console.warn('Invalid date: ', orig_date);
            return '';
        } else {
            return dateStr;
        }
    };

    filters.filter = function(list, kwargs) {
        var output = [];
        outer:
        for (var i = 0; i < list.length; i++) {
            var val = list[i];
            inner:
            for (prop in kwargs) {
                if (!kwargs.hasOwnProperty(prop) || prop === '__keywords') continue inner;
                if (!(prop in val)) continue outer;
                if (Array.isArray(kwargs[prop]) ?
                    kwargs[prop].indexOf(val[prop]) === -1 :
                    val[prop] !== kwargs[prop]) continue outer;
            }
            output.push(val);
        }
        return output;
    };

    safe_filter('stringify', JSON.stringify);

    filters.format = require('format').format;
    filters.sum = function(obj) {
        return obj.reduce(function(mem, num) {return mem + num;}, 0);
    };

    // Functions provided in the default context.
    var helpers = {
        api: require('urls').api.url,
        apiParams: require('urls').api.params,
        url: require('urls').reverse,
        media: require('urls').media,

        _: make_safe(l10n.gettext),
        _plural: make_safe(l10n.ngettext),
        format: require('format').format,
        settings: require('settings'),
        user: require('user'),

        escape: utils.escape_,
        len: function(x) {return x.length;},
        max: Math.max,
        min: Math.min,
        range: _.range,
        identity: function(obj) {
            if ('__keywords' in obj) delete obj.__keywords;
            return obj;
        },

        REGIONS: require('settings').REGION_CHOICES_SLUG,

        navigator: window.navigator,
        language: window.navigator.l10n ? window.navigator.l10n.language : 'en-US'
    };

    // Put the helpers into the nunjucks global.
    var globals = nunjucks.require('globals');
    for (var i in helpers) {
        if (helpers.hasOwnProperty(i)) {
            globals[i] = helpers[i];
        }
    }

    return helpers;
});
