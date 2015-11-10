var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  beforeEach = lab.beforeEach,
  afterEach = lab.afterEach,
  it = lab.test,
  expect = Code.expect;

var csp = require("../lib/csp");

describe("csp (content security policy)", function() {

  describe("default", function() {
    it("is an object", function(done) {
      expect(csp.default).to.be.an.object();
      done();
    })

    describe("scriptSrc", function() {
      it("allows self", function(done) {
        expect(csp.default.scriptSrc).to.include('self');
        done();
      })

      it("allows google-analytics.com", function(done) {
        expect(csp.default.scriptSrc).to.include('https://www.google-analytics.com');
        done();
      })

      it("allows twitter tracking", function(done) {
        expect(csp.default.scriptSrc).to.include('https://platform.twitter.com/oct.js');
        done();
      })

      it("does not allow unsafe-inline", function(done) {
        expect(csp.default.scriptSrc).to.not.include('unsafe-inline');
        done();
      })

      it("has many allowable script sources", function(done) {
        expect(csp.default.scriptSrc.length).to.be.above(5);
        done();
      })
    })

    describe("frameSrc", function() {

      it("allows checkout.stripe.com", function(done) {
        expect(csp.default.frameSrc).to.include('https://checkout.stripe.com');
        done();
      })

      it("allows js.stripe.com", function(done) {
        expect(csp.default.frameSrc).to.include('https://js.stripe.com');
        done();
      })

      it("allows www.youtube.com", function(done) {
        expect(csp.default.frameSrc).to.include('https://www.youtube.com');
        done();
      })

    })

  })

})
