var fixtures = require('../fixtures'),
    nock = require('nock'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    it = lab.test,
    after = lab.after,
    before = lab.before,
    expect = require('code').expect,
    server;

nock.cleanAll();

describe('browse handler', function () {

  before(function (done) {
    require('../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  after(function (done) {
    server.stop(done);
  });

  describe("GET /browse/keyword/{keyword}", function() {
    var resp;
    var opts = {
      url: "/browse/keyword/http",
    };

    before(function(done){

      var mock = nock("https://user-api-example.com")
        .get('/package?keyword=http&count=36&offset=0')
        .reply(200, fixtures.browse.keyword);

      server.inject(opts, function(response) {
        resp = response;
        mock.done();
        done();
      });
    });

    it("is ok", function(done) {
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("has all the expected context properties", function(done) {
      var context = resp.request.response.source.context;
      expect(context.items).to.be.an.array();
      expect(context.pages).to.exist();
      expect(context.pages.next).to.exist();
      done();
    });

    it("uses the right template", function(done) {
      expect(resp.request.response.source.template).to.equal('browse/keyword');
      done();
    });
  });

  describe("GET /browse/depended", function() {
    var resp;
    var opts = {
      url: "/browse/depended",
    };

    before(function(done){
      var mock = nock("https://user-api-example.com")
        .get('/package?sort=dependents&count=36&offset=0')
        .reply(200, fixtures.browse.depended);

      server.inject(opts, function(response) {
        resp = response;
        mock.done();
        done();
      });
    });

    it("is ok", function(done) {
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("has all the expected context properties", function(done) {
      var context = resp.request.response.source.context;
      expect(context.items).to.be.an.array();
      expect(context.pages).to.exist();
      expect(context.pages.next).to.exist();
      done();
    });

    it("uses the right template", function(done) {
      expect(resp.request.response.source.template).to.equal('browse/depended');
      done();
    });
  });

  describe("GET /browse/depended/{package}", function() {
    var resp;
    var opts = {
      url: "/browse/depended/express",
    };

    before(function(done){

      var mock = nock("https://user-api-example.com")
        .get('/package?dependency=express&count=36&offset=0')
        .reply(200, fixtures.browse.package_dependents);

      server.inject(opts, function(response) {
        resp = response;
        mock.done();
        done();
      });
    });

    it("is ok", function(done) {
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("has all the expected context properties", function(done) {
      var context = resp.request.response.source.context;
      expect(context.items).to.be.an.array();
      expect(context.pages).to.exist();
      expect(context.pages.next).to.exist();
      done();
    });

    it("uses the right template", function(done) {
      expect(resp.request.response.source.template).to.equal('browse/package-dependents');
      done();
    });
  });

  describe("GET /browse/star", function() {
    var resp;
    var opts = {
      url: "/browse/star",
    };

    before(function(done){
      var mock = nock("https://user-api-example.com")
        .get('/package?sort=stars&count=36&offset=0')
        .reply(200, fixtures.browse.starred);

      server.inject(opts, function(response) {
        resp = response;
        mock.done();
        done();
      });
    });

    it("is ok", function(done) {
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("has all the expected context properties", function(done) {
      var context = resp.request.response.source.context;
      expect(context.items).to.be.an.array();
      expect(context.pages).to.exist();
      expect(context.pages.next).to.exist();
      done();
    });

    it("uses the right template", function(done) {
      expect(resp.request.response.source.template).to.equal('browse/starred');
      done();
    });
  });

  describe("GET /browse/updated", function() {
    var resp;
    var opts = {
      url: "/browse/updated",
    };

    before(function(done){
      var mock = nock("https://user-api-example.com")
        .get('/package?sort=modified&count=36&offset=0')
        .reply(200, fixtures.browse.recently_updated);

      server.inject(opts, function(response) {
        resp = response;
        mock.done();
        done();
      });
    });

    it("is ok", function(done) {
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("has all the expected context properties", function(done) {
      var context = resp.request.response.source.context;
      expect(context.items).to.be.an.array();
      expect(context.pages).to.exist();
      expect(context.pages.next).to.exist();
      done();
    });

    it("uses the right template", function(done) {
      expect(resp.request.response.source.template).to.equal('browse/recently-updated');
      done();
    });
  });

  describe("GET /browse/created", function() {
    var resp;
    var opts = {
      url: "/browse/created",
    };

    before(function(done){      
      var mock = nock("https://user-api-example.com")
        .get('/package?sort=created&count=36&offset=0')
        .reply(200, fixtures.browse.recently_created);

      server.inject(opts, function(response) {
        resp = response;
        mock.done();
        done();
      });
    });

    it("is ok", function(done) {
      expect(resp.statusCode).to.equal(200);
      done();
    });

    it("has all the expected context properties", function(done) {
      var context = resp.request.response.source.context;
      expect(context.items).to.be.an.array();
      expect(context.pages).to.exist();
      expect(context.pages.next).to.exist();
      done();
    });

    it("uses the right template", function(done) {
      expect(resp.request.response.source.template).to.equal('browse/recently-created');
      done();
    });
  });

});
