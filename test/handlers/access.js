var fixtures = require("../fixtures"),
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

    describe('anonymous user', function () {
      it("renders a please-log-in prompt")
      it("does not render a public/private toggle")
      it("renders disabled read-only/read-write collaborator toggles")
      it("does not render new collaborator form")
    })

    describe('logged-in non-collaborator', function () {
      it("renders an ask-for-access prompt") // aspirational
      it("does not render a public/private toggle")
      it("renders disabled read-only/read-write collaborator toggles")
      it("does not render new collaborator form")
    })

    describe('logged-in collaborator', function () {
      it("does not render a public/private toggle")
      it("renders disabled read-only/read-write collaborator toggles")
      it("renders enabled new collaborator form")
      it("renders enabled collaborator removal links")
    })

  })

  describe('scoped public package', function() {

    describe('anonymous user', function () {
      it("renders a please-log-in prompt")
      it("renders a disabled public/private toggle")
      it("renders disabled read-only/read-write collaborator toggles")
      it("does not render new collaborator form")
    })

    describe('logged-in non-collaborator', function () {
      it("renders an ask-for-access prompt") // aspirational
      it("renders a disabled public/private toggle")
      it("renders disabled read-only/read-write collaborator toggles")
      it("does not render new collaborator form")
    })

    describe('logged-in collaborator with read access', function () {
      it("renders a disabled public/private toggle")
      it("renders disabled read-only/read-write collaborator toggles")
      it("emphasizes logged-in user in collaborator list")
      it("does not render new collaborator form")
      it("does not render collaborator removal links")
    })

    describe('logged-in collaborator with write access', function () {
      it("renders enabled public/private toggle")
      it("renders enabled read-only/read-write collaborator toggles")
      it("emphasizes logged-in user in collaborator list")
      it("renders enabled new collaborator form")
      it("renders enabled collaborator removal links")
    })

  })

  describe('scoped private package', function() {

    describe('anonymous user', function () {
      it("returns a 404")
      it("renders the generic not-found page")
      it("renders a please-log-in prompt")
    })

    describe('logged-in non-collaborator', function () {
      it("returns a 404")
      it("renders the generic not-found page")
    })

    describe('logged-in collaborator with read access', function () {
      it("returns a 200")
    })

    describe('logged-in collaborator with write access', function () {
      it("returns a 200")
    })

  })

})
