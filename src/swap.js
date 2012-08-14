(function(window, document) {

  var $ = window.jQuery || window.Zepto;

  var Swap = function(cfg) {

    this.config = {
      defaultProcessor: 'inner'
    };

    var self = this;

    this.conditionals = cfg.conditionals || {};
    this.listeners = cfg.listeners || [];
    this.domListeners = [];
    this.lastCache = {};

    this.config = $.extend(this.config, cfg || {});

    $.each(this.whens, function(key, func) {
      func.call(self);
    });

    this.rebuild();

    return this;
  };

  Swap.prototype.rebuild = function() {
    this.domListeners = [];
    this.addArea('[data-swap]');
  };

  Swap.prototype.addArea = function(selector) {
    var self = this;
    var rbrace = /^(?:\{.*\}|\[.*\])$/;

    $(selector).each(function() {
      var el = this,
          attributes = [].filter.call(this.attributes, function(at) { return /^data-/.test(at.name); });

      $.each(attributes, function(key, attr) {
        var pieces = attr.name.toLowerCase().split('-'), o = {}, len = pieces.length;

        if (len !== 4 && len !== 3)
          return true;

        if (isUd(self.tests[pieces[1]]) || isUd(self.conditionals[pieces[2]]))
          return true;

        if (len === 4) {
          if (isUd(self.processors[pieces[3]]))
            return true;

          o.processor = pieces[3];
        } else
          o.processor = self.config['defaultProcessor'];

        o.test = pieces[1];
        o.conditional = pieces[2];
        o.param = (function(data) {
          // This code is 'stolen' from jQuery
          if ( typeof data === "string" ) {
            try {
              data = data === "true" ? true :
                  data === "false" ? false :
                      data === "null" ? null :
                          + data + "" === data ? +data :
                              rbrace.test(data) ? $.parseJSON(data) :
                                  data;
            } catch(e) {}
          } else {
            data = undefined;
          }
          return data;
        })(attr.value);
        o.el = el;
        o.isDom = true;

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
        var cacheKey = o.conditional+'#'+o.test;

        if (isUd(cache[cacheKey]))
          cache[cacheKey] = self.runTest(self.conditionals[o.conditional], o.test, type);

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
      $(window).bind('resize', function() {self.check('resize')});
    },

    'domready': function() {
      var self = this;
      $(document).bind('ready', function() {self.check('ready')});
    }

  };

  Swap.prototype.tests = {

    'width': function() {
      return $(window).width();
    },

    'height': function() {
      return $(window).height();
    },

    'dpr': function() {
      if (!isUd(window.devicePixelRatio))
        return window.devicePixelRatio;
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
      return !(against === val);
    }

  };

  var isUd = function(v) {
    return typeof v === 'undefined';
  };

  window.Swap = Swap;

})(window, document);