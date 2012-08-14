(function(window, document) {

  var $ = window.jQuery || window.Zepto;

  var Swap = function(cfg) {

    this.config = {
      defaultProcessor: 'attr'
    };

    var self = this;

    this.conditionals = cfg.conditionals || {};
    this.listeners = cfg.listeners || [];

    this.allListeners = [];
    this.lastCache = {};

    this.config = $.extend(this.config, cfg || {});

    $.each(this.whens, function(key, func) {
      func.call(self);
    });

    this.refresh();

    return this;
  };

  Swap.prototype.refresh = function() {
    var self = this;
    var rbrace = /^(?:\{.*\}|\[.*\])$/;

    this.allListeners = [];

    $('[data-swap]').each(function() {
      var el = this,
          attributes = [].filter.call(this.attributes, function(at) { return /^data-/.test(at.name); });

      $.each(attributes, function(key, attr) {
        var pieces = attr.name.toLowerCase().split('-'),
            o = {},
            len = pieces.length;

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
              +data + "" === data ? +data :
              rbrace.test(data) ? $.parseJSON(data) :
              data;
            } catch(e) {}
          } else {
            data = undefined;
          }
          return data;
        })(attr.value);
        o.el = el;

        self.allListeners.push(o);
      });
    });

    self.allListeners = self.allListeners.concat(self.allListeners, self.listeners);
  };

  Swap.prototype.runTest = function(conditional, test) {
    var self = this,
        pass = true;

    try {
      var against = this.tests[test].call(this);
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

  Swap.prototype.check = function() {
    var self = this,
        cache = {};

    $.each(this.allListeners, function(key, o) {
      var cacheKey = o.conditional+'#'+o.test;

      if (!isUd(cache[cacheKey])) {
        if (cache[cacheKey]) {
          if (!isUd(self.lastCache[cacheKey]))
            if (self.lastCache[cacheKey] === cache[cacheKey])
              return true;

          if (typeof o.processor === 'function')
            o.processor.call(self, o.param, o.el);
          else
            self.processors[o.processor](o.param, o.el);
        }

        return true;
      }

      if (cache[cacheKey] = self.runTest(self.conditionals[o.conditional], o.test)) {
        if (!isUd(self.lastCache[cacheKey]))
          if (self.lastCache[cacheKey] === cache[cacheKey])
            return true;

        if (typeof o.processor === 'function')
          o.processor.call(self, o.param, o.el);
        else
          self.processors[o.processor](o.param, o.el);
      }
    });

    self.lastCache = cache;
  };

  Swap.prototype.whens = {

    'resize': function() {
      var self = this;
      $(window).bind('resize', function() {self.check()});
    },

    'domready': function() {
      var self = this;
      $(document).bind('ready', function() {self.check()});
    }

  };

  Swap.prototype.tests = {

    'width': function() {
      return $(window).width();
    },

    'drp': function() {
      if (!isUd(window.devicePixelRatio))
        return window.devicePixelRatio;
      else
        throw new Error('not supported');
    }

  };

  Swap.prototype.processors = {

    'attr': function(param, el) {
      $(el).html(param);
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