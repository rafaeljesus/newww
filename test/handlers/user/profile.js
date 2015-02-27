var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock");

var server;
var fakeBrowse = require('../../fixtures/browse/index.js');

var username1 = 'fakeuser',
    username2 = 'fakeusercli';

before(function (done) {
  require('../../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('Retreiving profiles from the registry', function () {

  it('gets a website-registered user from the registry', function (done) {
    server.inject('/~forrest', function (resp) {
      expect(resp.statusCode).to.equal(200);
      var context = resp.request.response.source.context;
      expect(context.profile.name).to.equal("forrest");
      expect(context.profile.stars).to.be.an.array();
      expect(context.profile.packages).to.be.an.array();
      done();
    });
  });

  it("renders a 404 page if user doesn't exist", function (done) {
    server.inject('/~mr-perdido', function (resp) {
      var source = resp.request.response.source;
      expect(resp.statusCode).to.equal(404);
      expect(source.template).to.equal('errors/user-not-found');
      done();
    });
  });

});
