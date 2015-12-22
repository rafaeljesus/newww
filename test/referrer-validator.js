var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect;

var referrerValidator = require("../lib/referrer-validator");

describe("referrer-validator", function() {
  it("blows up if there is no default path", function(done) {
    try {
      referrerValidator();
    } catch (e) {
      expect(e).to.exist();
      expect(e.message).to.equal("The default path must be passed");
    } finally {
      done();
    }
  });

  it("returns the default path if no referrer is passed", function(done) {
    var defaultPath = "/default/path";
    var referrer = referrerValidator(defaultPath);
    expect(referrer).to.equal(defaultPath);
    done();
  });

  it("only gives a pathname if the user tries to give a different url", function(done) {
    var defaultPath = "/default/path";
    var r = "http://google.com/wookies";
    var referrer = referrerValidator(defaultPath, r);
    expect(referrer).to.equal("/wookies");
    done();
  });

  it("only gives a pathname if the user tries to give query params", function(done) {
    var defaultPath = "/default/path";
    var r = "http://google.com/wookies?badstuff=here";
    var referrer = referrerValidator(defaultPath, r);
    expect(referrer).to.equal("/wookies");
    done();
  });

  it("it makes sure that the path is valid, or it goes back to default", function(done) {
    var defaultPath = "/default/path";
    var r = "/org/aj989gj--%20--fo";
    var referrer = referrerValidator(defaultPath, r);
    expect(referrer).to.equal("/default/path");
    done();
  });
});
