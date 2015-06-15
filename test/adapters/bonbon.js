var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
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

var userMock, licenseMock;

before(function (done) {
  userMock = nock("https://user-api-example.com")
    .get('/user/bob').times(8)
    .reply(200, fixtures.users.bob)
    .get('/user/seldo').times(3)
    .reply(200, fixtures.users.npmEmployee)
    .get('/user/bob/package?format=mini&per_page=100&page=0').times(10)
    .reply(200, fixtures.users.packages)
    .get('/user/bob/stars?format=detailed').times(10)
    .reply(200, fixtures.users.stars)
    .get('/user/bob').times(5)
    .reply(404)
    .get('/user/seldo')
    .reply(404)
    .get('/user/mikeal')
    .reply(404);

  licenseMock = nock('https://license-api-example.com')
    .get('/customer/bob/stripe').times(13)
    .reply(200, {})
    .get('/customer/mikeal/stripe')
    .reply(200, {})
    .get('/customer/seldo/stripe').times(4)
    .reply(200, {});

  done();
});

after(function (done) {
  userMock.done();
  licenseMock.done();
  done();
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

  describe("feature flags", function() {

    beforeEach(function(done){
      process.env.FEATURE_STEALTH = 'false';
      process.env.FEATURE_ALPHA = 'group:npm-humans';
      process.env.FEATURE_BETA = 'group:npm-humans,group:friends,bob';
      process.env.FEATURE_COMMON = 'true';
      done();
    });

    afterEach(function(done){
      delete process.env.FEATURE_STEALTH;
      delete process.env.FEATURE_ALPHA;
      delete process.env.FEATURE_BETA;
      delete process.env.FEATURE_COMMON;
      done();
    });

    it('gives anonymous users access to common features', function(done){
      var options = {
        url: '/~bob'
      };

      server.inject(options, function (resp) {
        var context = resp.request.response.source.context;
        expect(context.features).to.deep.equal({
          stealth: false,
          alpha: false,
          beta: false,
          common: true
        });
        done();
      });
    });

    it('gives people in the friends group access to beta and common features', function(done){
      var options = {
        url: '/~bob',
        credentials: fixtures.users.mikeal
      };

      server.inject(options, function (resp) {
        var context = resp.request.response.source.context;
        expect(context.features).to.deep.equal({
          stealth: false,
          alpha: false,
          beta: true,
          common: true
        });
        done();
      });
    });

    it('gives one-off listed friends access to beta and common features', function(done){
      var options = {
        url: '/~bob',
        credentials: fixtures.users.bob
      };

      server.inject(options, function (resp) {
        var context = resp.request.response.source.context;
        expect(context.features).to.deep.equal({
          stealth: false,
          alpha: false,
          beta: true,
          common: true
        });
        done();
      });
    });

    it('gives npm employees access to alpha, beta, and common features', function(done){
      var options = {
        url: '/~bob',
        credentials: fixtures.users.npmEmployee
      };

      server.inject(options, function (resp) {
        var context = resp.request.response.source.context;
        expect(context.features).to.deep.equal({
          stealth: false,
          alpha: true,
          beta: true,
          common: true
        });
        done();
      });
    });

  });

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
      delete process.env.NODE_ENV;
      done();
    });
  });

});
