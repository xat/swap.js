
describe('Parse Data Attributes', function() {

  var swap = new Swap();

  swap.conditionals.gt960 = {
    'gt': 959
  };

  it('should return false', function() {

    expect(swap._extractAttr({name: 'data-', value: ''})).toBe(false);
    expect(swap._extractAttr({name: 'src', value: ''})).toBe(false);
    expect(swap._extractAttr({name: 'data-dpr-..gt960-show', value: ''})).toBe(false);
    expect(swap._extractAttr({name: 'data-dpr-gt960-show-', value: ''})).toBe(false);
    expect(swap._extractAttr({name: 'data---', value: ''})).toBe(false);
    expect(swap._extractAttr({name: 'data-dpr-gt960-', value: ''})).toBe(false);

  });

  it('should return object', function() {

    expect(swap._extractAttr({name: 'data-dpr-gt960-show', value: ''})).toEqual(jasmine.any(Object));
    expect(swap._extractAttr({name: 'data-dpr-.gt960-show', value: ''})).toEqual(jasmine.any(Object));
    expect(swap._extractAttr({name: 'data-dpr-gt960', value: ''})).toEqual(jasmine.any(Object));

  });

  it('should return object with correct props', function() {

    expect(swap._extractAttr({name: 'data-dpr-gt960-show', value: ''})).toEqual({
      'test': 'dpr',
      'conditional': 'gt960',
      'processor': 'show',
      'param': ''
    });

    expect(swap._extractAttr({name: 'data-dpr-.gt960-show', value: '#test'})).toEqual({
      'neg': true,
      'test': 'dpr',
      'conditional': 'gt960',
      'processor': 'show',
      'param': '#test'
    });

  });

});

describe('Parse Values', function() {

  var swap = new Swap();

  it('should return a string', function() {

    expect(swap._parseValue('test')).toEqual(jasmine.any(String));
    expect(swap._parseValue("{key:val}")).toEqual(jasmine.any(String));
    expect(swap._parseValue("{'key':'val'}")).toEqual(jasmine.any(String));
    expect(swap._parseValue('13,37')).toEqual(jasmine.any(String));

  });

  it('should return an object', function() {

    expect(swap._parseValue('{"key":"val"}')).toEqual(jasmine.any(Object));

  });

  it('should return an object with the correct props', function() {

    expect(swap._parseValue('{"key":"val"}')).toEqual({'key': 'val'});

  });

  it('should return false', function() {

    expect(swap._parseValue('false')).toBe(false);

  });

  it('should return true', function() {

    expect(swap._parseValue('true')).toBe(true);

  });

  it('should return a Number', function() {

    expect(swap._parseValue('1337')).toEqual(jasmine.any(Number));
    expect(swap._parseValue('13.37')).toEqual(jasmine.any(Number));

  });

  it('should return undefined', function() {

    expect(swap._parseValue(null)).toBeUndefined();
    expect(swap._parseValue(false)).toBeUndefined();
    expect(swap._parseValue()).toBeUndefined();
    expect(swap._parseValue(undefined)).toBeUndefined();

  });

});