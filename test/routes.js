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
    var homepage = _.find(routes, function(route) {
      return route.path === "/" && route.method === "GET"
    })
    expect(homepage).to.be.an.object()
    expect(homepage.config.auth.mode).to.equal("try")
    expect(homepage.config.plugins["hapi-auth-cookie"].redirectTo).to.equal(false)
    done();
  })

  it("applies ajax configuration to ajax routes", function(done){
    var star = _.find(routes, function(route) {
      return route.path === "/star" && route.method === "POST"
    })
    expect(star).to.be.an.object();
    expect(star.config.plugins.crumb.source).to.equal("payload");
    expect(star.config.plugins.crumb.restful).to.equal(true);
    done();
  })

  describe("for packages", function() {

    it("defines the same handler for /package/foo and /package/@acme/bar"/*, function (done) {
      var scopey = _.find(routes, function(route) {
        return route.path === "/packages/{scope}/{package}" && route.method === "GET"
      })

      var globey = _.find(routes, function(route) {
        return route.path === "/packages/{package}" && route.method === "GET"
      })
      expect(scopey).to.be.an.object()
      expect(globey).to.be.an.object()
      expect(scopey.handler).to.be.a.function()
      expect(scopey.handler).to.deep.equal(globey.handler)
      done();
    }*/)

  })

})
