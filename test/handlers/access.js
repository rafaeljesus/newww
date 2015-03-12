var fixtures = require("../fixtures"),
    merge = require("lodash").merge,
    nock = require("nock"),
    cheerio = require("cheerio"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    server;

describe("package access", function(){

  before(function (done) {
    require('../mocks/server')(function (obj) {
      server = obj;
      done();
    });
  });

  after(function (done) {
    server.stop(done);
  });

  describe('global package', function() {

    var $
    var resp
    var context
    var options = {url: '/package/browserify/access'};
    var mock = nock("https://user-api-example.com")
      .get('/package/browserify')
      .times(10)
      .reply(200, fixtures.packages.browserify)
      .get('/package/browserify/collaborators')
      .times(10)
      .reply(200, fixtures.collaborators)

    describe('anonymous user', function () {

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("renders a please-log-in prompt", function(done) {
        expect($("p.notice.please-log-in").length).to.equal(1)
        done()
      })

      it("does not render a public/private toggle", function(done){
        expect($("#package-access-toggle").length).to.equal(0)
        done()
      })

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("#collaborators > tbody > tr").length).to.equal(2)
        expect($("#collaborators input[type='radio']:enabled").length).to.equal(0)
        expect($("#collaborators input[type='radio']:disabled").length).to.equal(4)
        done()
      })

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0)
        done()
      })

      it("does not render collaborator removal links", function(done){
        expect($("a.delete-collaborator").length).to.equal(0)
        done()
      })
    })

    describe('logged-in non-collaborator', function () {
      var options = {
        url: '/package/browserify/access',
        credentials: fixtures.users.bob
      }

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("renders an ask-for-access prompt") // aspirational

      it("does not render a public/private toggle", function(done){
        expect($("#package-access-toggle").length).to.equal(0)
        done()
      })

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("#collaborators > tbody > tr").length).to.equal(2)
        expect($("#collaborators input[type='radio']:enabled").length).to.equal(0)
        expect($("#collaborators input[type='radio']:disabled").length).to.equal(4)
        done()
      })

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0)
        done()
      })

      it("does not render collaborator removal links", function(done){
        expect($("a.delete-collaborator").length).to.equal(0)
        done()
      })
    })

    describe('logged-in collaborator', function () {

      var options = {
        url: '/package/browserify/access',
        credentials: fixtures.users.wrigley_the_writer
      }

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("does not render a public/private toggle", function(done){
        expect($("#package-access-toggle").length).to.equal(0)
        done()
      })

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2)
        expect($("tr.collaborator input[type='radio']:enabled").length).to.equal(0)
        expect($("tr.collaborator input[type='radio']:disabled").length).to.equal(4)
        done()
      })

      describe("new collaborator form", function() {

        it("is rendered", function(done){
          expect($("#add-collaborator").length).to.equal(1)
          done()
        })

        it("adds package name as a hidden input", function(done){
          expect($("#add-collaborator input[name='package'][type='hidden']").val())
            .to.equal("browserify")
          done()
        })

        it("makes collaborator name a required input", function(done){
          expect($("#add-collaborator input[name='collaborator'][required='required']").length)
            .to.equal(1)
          done()
        })

        it("defaults to `write` permissions when adding new collaborators", function(done){
          expect($("#add-collaborator input[name='permissions'][type='hidden']").val())
            .to.equal("write")
          done()
        })

      })

      it("renders collaborator removal links", function(done){
        expect($("a.delete-collaborator").length).to.equal(2)
        done()
      })
    })

  })

  describe('scoped public package', function() {

    var $
    var resp
    var context
    var options = {url: '/package/@wrigley_the_writer/scoped_public/access'};
    var mock = nock("https://user-api-example.com")
      .get('/package/@wrigley_the_writer%2Fscoped_public')
      .times(10)
      .reply(200, fixtures.packages.wrigley_scoped_public)
      .get('/package/@wrigley_the_writer%2Fscoped_public/collaborators')
      .times(10)
      .reply(200, fixtures.collaborators)

    describe('anonymous user', function () {

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("renders a please-log-in prompt", function(done) {
        expect($("p.notice.please-log-in").length).to.equal(1)
        done()
      })

      it("renders a disabled public/private toggle", function(done){
        expect($("#package-access-toggle:disabled").length).to.equal(1)
        done()
      })

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2)
        expect($("tr.collaborator input[type='radio']:enabled").length).to.equal(0)
        expect($("tr.collaborator input[type='radio']:disabled").length).to.equal(4)
        done()
      })

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0)
        done()
      })

      it("does not render collaborator removal links", function(done){
        expect($("a.delete-collaborator").length).to.equal(0)
        done()
      })
    })

    describe('logged-in non-collaborator', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_public/access',
        credentials: fixtures.users.bob,
      };

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("renders an ask-for-access prompt") // aspirational

      it("renders a disabled public/private toggle", function(done){
        expect($("#package-access-toggle:disabled").length).to.equal(1)
        done()
      })

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2)
        expect($("tr.collaborator input[type='radio']:enabled").length).to.equal(0)
        expect($("tr.collaborator input[type='radio']:disabled").length).to.equal(4)
        done()
      })

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0)
        done()
      })

      it("does not render collaborator removal links", function(done){
        expect($("a.delete-collaborator").length).to.equal(0)
        done()
      })
    })

    describe('logged-in collaborator with read access', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_public/access',
        credentials: fixtures.users.ralph_the_reader,
      };

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("renders a disabled public/private toggle", function(done){
        expect($("#package-access-toggle:disabled").length).to.equal(1)
        done()
      })

      it("renders disabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2)
        expect($("tr.collaborator input[type='radio']:enabled").length).to.equal(0)
        expect($("tr.collaborator input[type='radio']:disabled").length).to.equal(4)
        done()
      })

      it("does not render new collaborator form", function(done){
        expect($("#add-collaborator").length).to.equal(0)
        done()
      })

      it("does not render collaborator removal links", function(done){
        expect($("a.delete-collaborator").length).to.equal(0)
        done()
      })
    })

    describe('logged-in collaborator with write access', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_public/access',
        credentials: fixtures.users.wrigley_the_writer,
      };

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("renders a disabled public/private toggle", function(done){
        expect($("#package-access-toggle:enabled").length).to.equal(1)
        done()
      })

      it("renders enabled read-only/read-write collaborator toggles", function(done){
        expect($("tr.collaborator").length).to.equal(2)
        expect($("tr.collaborator input[type='radio']:enabled").length).to.equal(4)
        expect($("tr.collaborator input[type='radio']:disabled").length).to.equal(0)
        done()
      })


      describe("new collaborator form", function() {

        it("is rendered", function(done){
          expect($("#add-collaborator").length).to.equal(1)
          done()
        })

        it("adds encoded package name as a hidden input", function(done){
          expect($("#add-collaborator input[name='package'][type='hidden']").val())
            .to.equal("@wrigley_the_writer%2Fscoped_public")
          done()
        })

        it("makes collaborator name a required input", function(done){
          expect($("#add-collaborator input[name='collaborator'][required='required']").length)
            .to.equal(1)
          done()
        })

        it("defaults to `read` permissions when adding new collaborators", function(done){
          expect($("#add-collaborator input[name='permissions'][type='hidden']").val())
            .to.equal("read")
          done()
        })

      })

      it("renders collaborator removal links", function(done){
        expect($("a.delete-collaborator").length).to.equal(2)
        done()
      })
    })
  })

  describe('scoped private package', function() {

    var $
    var resp
    var context
    var options = {
      url: '/package/@wrigley_the_writer/scoped_private/access'
    };
    var mock = nock("https://user-api-example.com")
      .get('/package/@wrigley_the_writer%2Fscoped_private')
      .times(10)
      .reply(200, fixtures.packages.wrigley_scoped_private)
      .get('/package/@wrigley_the_writer%2Fscoped_private/collaborators')
      .times(10)
      .reply(200, fixtures.collaborators)

    describe('anonymous user', function () {

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("returns a 404", function(done){
        expect(resp.statusCode).to.equal(404)
        done()
      })

      it("renders the generic not-found template", function(done){
        expect(resp.request.response.source.template).to.equal('errors/not-found')
        done()
      })
    })

    describe('logged-in non-collaborator', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_private/access',
        credentials: fixtures.users.bob,
      };

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("returns a 404", function(done){
        expect(resp.statusCode).to.equal(404)
        done()
      })

      it("renders the generic not-found template", function(done){
        expect(resp.request.response.source.template).to.equal('errors/not-found')
        done()
      })
    })

    describe('logged-in collaborator with read access', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_private/access',
        credentials: fixtures.users.ralph_the_reader,
      };

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("returns a 200", function(done){
        expect(resp.statusCode).to.equal(200)
        done()
      })
    })

    describe('logged-in collaborator with write access', function () {

      var options = {
        url: '/package/@wrigley_the_writer/scoped_private/access',
        credentials: fixtures.users.wrigley_the_writer,
      };

      before(function(done) {
        server.inject(options, function(response) {
          resp = response
          context = resp.request.response.source.context
          $ = cheerio.load(resp.result)
          mock.done()
          done()
        })
      })

      it("returns a 200", function(done){
        expect(resp.statusCode).to.equal(200)
        done()
      })
    })

  })

})
