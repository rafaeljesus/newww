var _ = require('lodash'),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect;

var routes = require("../routes/index");

describe("routes", function () {

  it("is an array", function (done) {
    expect(routes).to.be.an.array();
    done();
  })

  it("applies unauthenticated configuration to public routes", function(done){
    var homepage = routes.at("GET /")
    expect(homepage).to.be.an.object()
    expect(homepage.config.auth.mode).to.equal("try")
    expect(homepage.config.plugins["hapi-auth-cookie"].redirectTo).to.equal(false)
    done();
  })

  it("applies special configuration to ajax routes", function(done){
    var star = routes.at("POST /star")
    expect(star).to.be.an.object();
    expect(star.config.plugins.crumb.source).to.equal("payload");
    expect(star.config.plugins.crumb.restful).to.equal(true);
    done();
  })

  it("applies special configuration to enterprise routes", function(done){
    var enterprise = routes.at("GET /enterprise")
    expect(enterprise).to.be.an.object();
    expect(enterprise.config.plugins.blankie).to.deep.equal(require('../lib/csp').enterprise);
    done();
  })

  it("defines the same handler for /package/foo and /package/@acme/bar", function (done) {
    var scopey = routes.at("GET /package/{scope}/{package}")
    var globey = routes.at("GET /package/{package}")
    expect(scopey).to.be.an.object()
    expect(globey).to.be.an.object()
    expect(scopey.handler).to.be.a.function()
    expect(scopey.handler).to.deep.equal(globey.handler)
    done();
  })

})
