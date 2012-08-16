(function(win, document) {

  var $ = win.jQuery || win.Zepto;

  var Swap = function(cfg) {
    'use strict';

    this.config = {
      defaultProcessor: 'inner'
    };

    var self = this;

    var cfg = cfg || {};

    this.conditionals = cfg.conditionals || {};
    this.listeners = cfg.listeners || [];
    this.domListeners = [];
    this.lastCache = {};

    this.config = $.extend(this.config, cfg || {});

    $.each(this.whens, function(key, func) {
      func.call(self);
    });

    return this;
  };

  Swap.prototype.rebuild = function() {
    this.domListeners.length = 0;
    this.addArea('[data-swap]');
  };

  Swap.prototype.cleanUp = function() {
    for (var i = (this.domListeners.length-1); i >= 0; i--) {
      var o = this.domListeners[i];
      if(!isUd(o.el)) {
        if (!o.el.parentNode) {
          this.domListeners.splice(i, 1);
        }
      }
    }
  };

  Swap.prototype._extractAttr = function(attr) {
    var pieces = attr.name.toLowerCase().split('-'),o = {} ,len = pieces.length;

    if (len !== 4 && len !== 3)
      return false;

    if (pieces[2].substring(0, 1) === '.') {
      o.neg = true;
      pieces[2] = pieces[2].slice(1);
    }

    if (isUd(this.tests[pieces[1]]) || isUd(this.conditionals[pieces[2]]))
      return false;

    if (len === 4) {
      if (isUd(this.processors[pieces[3]]))
        return false;

      o.processor = pieces[3];
    } else
      o.processor = this.config.defaultProcessor;

    o.test = pieces[1];
    o.conditional = pieces[2];
    o.param = this._parseValue(attr.value);

    return o;
  };

  Swap.prototype._parseValue = function(data) {
    // This code is 'stolen' from jQuery
    if ( typeof data === "string" ) {
      try {
        data = data === "true" ? true :
            data === "false" ? false :
                data === "null" ? null :
                    + data + "" === data ? +data :
                        /^(?:\{.*\}|\[.*\])$/.test(data) ? parseJSON(data) :
                            data;
      } catch(e) {}
    } else {
      data = undefined;
    }
    return data;
  };

  Swap.prototype.addArea = function(selector) {
    var self = this;

    $(selector).each(function() {
      var el = this,
          attributes = [].filter.call(this.attributes, function(at) { return (/^data-/).test(at.name); });

      $.each(attributes, function(key, attr) {
        var o = self._extractAttr(attr);
        if (!o) return true;
        o.el = el;
        self.domListeners.push(o);
      });
    });
  };

  Swap.prototype.runTest = function(conditional, test, type) {
    var self = this, pass = true, t = this.tests[test];

    if (!isUd(t.restrict))
      if (t.restrict[type])
        return false;

    try {
      var against = t.call(this);
    } catch (e) {
      return false;
    }

    $.each(conditional, function(key, val) {
      if (!self.filters[key](against, val)) {
        pass = false;
        return false;
      }
    });

    return pass;
  };

  Swap.prototype.check = function(type) {
    var self = this, cache = {};
    type = type || 'manual';

    $.each([self.listeners, self.domListeners], function(key, collection) {
      $.each(collection, function(key, o) {
        var cacheKey = o.conditional+(o.neg?'#':'##')+o.test;

        if (isUd(cache[cacheKey])) {
          cache[cacheKey] = self.runTest(self.conditionals[o.conditional], o.test, type);
          if (o.neg)
            cache[cacheKey] = !cache[cacheKey];
        }

        if (!isUd(self.lastCache[cacheKey]))
          if (self.lastCache[cacheKey] === cache[cacheKey])
            return true;

        if (cache[cacheKey])
          if (typeof o.processor === 'function')
            o.processor.call(self, o.param, o.el);
          else
            self.processors[o.processor](o.param, o.el);
      });
    });

    self.lastCache = cache;
  };

  Swap.prototype.whens = {

    'resize': function() {
      var self = this;
      $(win).on('resize', function() { self.check('resize'); });
    },

    'domready': function() {
      var self = this;
      $(document).ready(function() {
        self.rebuild();
        self.check('ready');
      });
    }

  };

  Swap.prototype.tests = {

    'width': function() {
      return $(win).width();
    },

    'height': function() {
      return $(win).height();
    },

    'dpr': function() {
      if (!isUd(win.devicePixelRatio))
        return win.devicePixelRatio;
      else
        throw new Error('not supported');
    }

  };

  Swap.prototype.tests.dpr.restrict = {'resize': true};

  Swap.prototype.processors = {

    'attr': function(param, el) {
      if (typeof param !== 'object')
        return false;
      $(el).attr(param);
    },

    'src': function(param, el) {
      $(el).attr('src', param);
    },

    'inner': function(param, el) {
      $(el).html(param);
    },

    'ref': function(param, el) {
      $(el).html($(param).html());
    },

    'show': function(param, el) {
      if (param)
        if (param.length > 0) {
          $(el).find(param).show();
          return;
        }
      $(el).show();
    },

    'hide': function(param, el) {
      if (param)
        if (param.length > 0) {
          $(el).find(param).hide();
          return;
        }
      $(el).hide();
    }

  };

  Swap.prototype.conditionals = {};
  Swap.prototype.listeners = [];

  Swap.prototype.filters = {

    'eq': function(against, val) {
      return against === val;
    },

    'lt': function(against, val) {
      return against < val;
    },

    'gt': function(against, val) {
      return against > val;
    },

    'not': function(against, val) {
      return against !== val;
    }

  };

  var isUd = function(v) {
    return typeof v === 'undefined';
  };

  var parseJSON = (function() {
    if (!isUd(JSON)) return JSON.parse;
    if (!isUd($.parseJSON)) return $.parseJSON;
    return function(val) {return val;};
  })();

  win.Swap = Swap;

})(window, document);