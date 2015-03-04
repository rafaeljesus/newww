var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    nock = require("nock"),
    users = require('../../fixtures').users;

var server;

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

    var name = 'bob';
    var mock = nock("https://user-api-example.com")
      .get('/user/' + name)
      .reply(200, users.bob)
      .get('/user/' + name + '/package?per_page=9999')
      .reply(200, users.packages)
      .get('/user/' + name + '/stars')
      .reply(200, users.stars);

    server.inject('/~bob', function (resp) {
      mock.done();
      expect(resp.statusCode).to.equal(200);
      var context = resp.request.response.source.context;
      expect(context.profile.name).to.equal("bob");
      expect(context.profile.stars).to.be.an.array();
      expect(context.profile.packages).to.be.an.object();
      done();
    });
  });

  it("renders a 404 page if user doesn't exist", function (done) {

    var name = 'mr-perdido';
    var mock = nock("https://user-api-example.com")
      .get("/user/" + name)
      .reply(404);

    server.inject('/~mr-perdido', function (resp) {
      mock.done();
      var source = resp.request.response.source;
      expect(resp.statusCode).to.equal(404);
      expect(source.template).to.equal('errors/user-not-found');
      done();
    });
  });

});
