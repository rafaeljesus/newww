var Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  beforeEach = lab.beforeEach,
  afterEach = lab.afterEach,
  it = lab.test,
  expect = Lab.expect;

var csp = require("../lib/csp");

describe("csp (content security policy)", function () {

  describe("default", function() {
    it("is an object", function (done) {
      expect(csp.default).to.be.an('object');
      done();
    })

    it("allows self", function (done) {
      expect(csp.default.scriptSrc).to.include('self');
      done();
    })

    it("allows google-analytics.com", function (done) {
      expect(csp.default.scriptSrc).to.include('https://www.google-analytics.com');
      done();
    })

    it("does not allow unsafe-inline", function (done) {
      expect(csp.default.scriptSrc).to.not.include('unsafe-inline');
      done();
    })

    it("has a total of seven allowable script sources", function (done) {
      expect(csp.default.scriptSrc).to.have.length(7);
      done();
    })

  })

  describe("enterprise", function() {
    it("is an object", function (done) {
      expect(csp.enterprise).to.be.an('object');
      done();
    })

    it("allows the same scripts as default, plus some others", function (done) {
      csp.default.scriptSrc.forEach(function(src){
        expect(csp.enterprise.scriptSrc).to.include(src);
      });
      expect(csp.enterprise.scriptSrc.length).to.be.above(csp.default.scriptSrc.length);
      done();
    })
  })

})
