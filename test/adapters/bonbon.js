var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    fixtures = require('../fixtures'),
    nock = require('nock');

var server;
var username1 = 'bob';

beforeEach(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

describe("bonbon", function() {

  beforeEach(function (done) {
    process.env.NODE_ENV = 'production';
    done();
  });

  afterEach(function (done) {
    delete process.env.NODE_ENV;
    done();
  });

  nock("https://user-api-example.com")
    .get('/user/' + username1).times(5)
    .reply(200, fixtures.users.bob)
    .get('/user/' + username1 + '/package?per_page=9999').times(5)
    .reply(200, fixtures.users.packages)
    .get('/user/' + username1 + '/stars').times(5)
    .reply(200, fixtures.users.stars);


  it('allows logged-in npm employees to request the view context with a `json` query param', function (done) {

    var options = {
      url: '/~' + username1 + '?json',
      credentials: fixtures.users.npmEmployee
    };

    expect(process.env.NODE_ENV).to.equal("production");
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.match(/json/);
      expect(resp.result).to.be.an.object();
      done();
    });
  });

  it('returns the whole context object if `json` has no value', function (done) {

    var options = {
      url: '/~' + username1 + '?json',
      credentials: fixtures.users.npmEmployee
    };

    expect(process.env.NODE_ENV).to.equal("production");
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.profile).to.exist();
      expect(resp.result.profile.name).to.exist();
      done();
    });
  });

  it('returns a subset of the context if `json` has a value', function (done) {

    var options = {
      url: '/~' + username1 + '?json=profile.resource',
      credentials: fixtures.users.npmEmployee
    };
    expect(process.env.NODE_ENV).to.equal("production");
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.match(/json/);
      expect(resp.result.github).to.exist();
      expect(resp.result.twitter).to.exist();
      done();
    });
  });

  it('does not allow logged-in non-employees to request the view context', function (done) {

    var options = {
      url: '/~' + username1 + '?json',
      credentials: fixtures.users.bob
    };
    expect(process.env.NODE_ENV).to.equal("production");
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.match(/html/);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/profile');
      done();
    });
  });

  it('does not allow anonymous fixtures.users to request the view context', function (done) {

    var options = {
      url: '/~' + username1 + '?json',
      credentials: fixtures.users.bob
    };
    expect(process.env.NODE_ENV).to.equal("production");
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.match(/html/);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/profile');
      done();
    });
  });

  it('allows anyone to request the view context if NODE_ENV is `dev`', function (done) {
    process.env.NODE_ENV = "dev";
    expect(process.env.NODE_ENV).to.equal("dev");

    var options = {
      url: '/~' + username1 + '?json',
      credentials: null
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.headers['content-type']).to.match(/json/);
      expect(resp.result).to.be.an.object();
      delete process.env.NODE_ENV
      done();
    });
  });

});
