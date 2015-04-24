var expect = require('code').expect,
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    it = lab.test,
    routes = require("../routes/index");

describe("routes", function () {
  it("is an array", function (done) {
    expect(routes).to.be.an.array();
    done();
  });

  it("applies configuration to unauthenticated routes", function(done){
    var homepage = routes.at("GET /");
    expect(homepage).to.be.an.object();
    expect(homepage.config.auth.mode).to.equal("try");
    expect(homepage.config.plugins["hapi-auth-cookie"].redirectTo).to.equal(false);
    done();
  });

  it("applies configuration to ajax routes", function(done){
    var star = routes.at("POST /star");
    expect(star).to.be.an.object();
    expect(star.config.plugins.crumb.source).to.equal("payload");
    expect(star.config.plugins.crumb.restful).to.equal(true);
    done();
  });

  it("defines the same handler for /~ and /profile", function (done) {
    var unix = routes.at("GET /~");
    var bore = routes.at("GET /profile");
    expect(unix).to.be.an.object();
    expect(bore).to.be.an.object();
    expect(unix.handler).to.be.a.function();
    expect(unix.handler).to.deep.equal(bore.handler);
    done();
  });

  it("defines the same handler for scoped and global package pages", function (done) {
    var scopey = routes.at("GET /package/{scope}/{project}");
    var globey = routes.at("GET /package/{package}");
    expect(scopey).to.be.an.object();
    expect(globey).to.be.an.object();
    expect(scopey.handler).to.be.a.function();
    expect(scopey.handler).to.deep.equal(globey.handler);
    done();
  });
});
