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
var fakeBrowse = require('../fixtures/browseData');

var username1 = 'fakeuser',
    username2 = 'fakeusercli';


// prepare the server
before(function (done) {
  require('../fixtures/setupServer')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('Retreiving profiles from the registry', function () {

  it('gets a website-registered user from the registry', function (done) {

    var userMock = nock(process.env.USER_API)
      .get('/forrest')
      .reply(200, {
        name: "forrest",
        email: "forrest@example.com"
      });

    var starMock = nock(process.env.USER_API)
      .get('/forrest/stars')
      .reply(200, [
        'minimist',
        'hapi'
      ]);

    var packageMock = nock(process.env.USER_API)
      .get('/forrest/package?format=mini')
      .reply(200, [
        {name: "foo", description: "It's a foo!"},
        {name: "bar", description: "It's a bar!"}
      ]);

    server.inject('/~forrest', function (resp) {
      userMock.done()
      starMock.done()
      packageMock.done()
      expect(resp.statusCode).to.equal(200);
      var context = resp.request.response.source.context;
      expect(context.profile.name).to.equal("forrest");
      expect(context.profile.stars).to.be.an.array();
      expect(context.profile.packages).to.be.an.array();
      done();
    });
  });

  it("renders a 404 page if user doesn't exist", function (done) {

    var userMock = nock(process.env.USER_API)
      .get('/mr-perdido')
      .reply(404);

    server.inject('/~mr-perdido', function (resp) {
      var source = resp.request.response.source;
      expect(resp.statusCode).to.equal(404);
      expect(source.template).to.equal('errors/user-not-found');
      done();
    });
  });

});
