'use strict';
var expect = require('chai').expect;
var index = require('../dist/index.js');
describe('simple test', () => {
  it('fej should return function', () => {
    var result = typeof index.default.fej === "function";
    expect(result).to.equal(true);
  });
});
