var Code = require('code'),
    nock = require('nock'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    it = lab.test,
    after = lab.after,
    before = lab.before,
    server;

// prepare the server
before(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('browse handler', function () {


  describe("GET /browse/keyword/{keyword}", function() {
    var resp
    var mock = nock("https://user-api-example.com")
      .get('/package?keyword=http&count=36&offset=0')
      .reply(200)

    var opts = {
      url: "/browse/keyword/http",
    }

    before(function(done){
      server.inject(opts), function(response) {
        resp = response
        mock.done()
        done()
      }
    })


    it("is ok", function(done) {
      expect(resp.statusCode).to.equal(200)
      done()
    })

    it("uses the right template", function(done) {
      expect(resp.request.response.source).to.equal('browse/keyword');
    })
  })

  // describe("GET /browse/depended", function() {
  //   var resp
  //   var mock = nock("https://user-api-example.com")
  //     .get('/browse/foo')
  //     .reply(200)
  //
  //   var opts = {
  //     url: "",
  //   }
  //
  //   before(function(done){
  //     server.inject(opts), function(response) {
  //       resp = response
  //       mock.done()
  //       done()
  //     }
  //   })
  //
  //   it("is ok", function(done) {
  //     expect(resp.statusCode).to.equal(200)
  //     done()
  //   })
  //
  //   it("uses the right template", function(done) {
  //     expect(resp.request.response.source).to.equal('browse/depended');
  //   })
  // })
  //
  // describe("GET /browse/depended/{package}", function() {
  //   var resp
  //   var mock = nock("https://user-api-example.com")
  //     .get('/browse/foo')
  //     .reply(200)
  //
  //   var opts = {
  //     url: "",
  //   }
  //
  //   before(function(done){
  //     server.inject(opts), function(response) {
  //       resp = response
  //       mock.done()
  //       done()
  //     }
  //   })
  //
  //   it("is ok", function(done) {
  //     expect(resp.statusCode).to.equal(200)
  //     done()
  //   })
  //
  //   it("uses the right template", function(done) {
  //
  //   })
  // })
  //
  // describe("GET /browse/star", function() {
  //   var resp
  //   var mock = nock("https://user-api-example.com")
  //     .get('/browse/foo')
  //     .reply(200)
  //
  //   var opts = {
  //     url: "",
  //   }
  //
  //   before(function(done){
  //     server.inject(opts), function(response) {
  //       resp = response
  //       mock.done()
  //       done()
  //     }
  //   })
  //
  //   it("is ok", function(done) {
  //     expect(resp.statusCode).to.equal(200)
  //     done()
  //   })
  //
  //   it("uses the right template", function(done) {
  //
  //   })
  // })
  //
  // describe("GET /browse/updated", function() {
  //   var resp
  //   var mock = nock("https://user-api-example.com")
  //     .get('/browse/updated')
  //     .reply(200)
  //
  //   var opts = {
  //     url: "",
  //   }
  //
  //   before(function(done){
  //     server.inject(opts), function(response) {
  //       resp = response
  //       mock.done()
  //       done()
  //     }
  //   })
  //
  //   it("is ok", function(done) {
  //     expect(resp.statusCode).to.equal(200)
  //     done()
  //   })
  //
  //   it("uses the right template", function(done) {
  //
  //   })
  // })
  //
  // describe("GET /browse/created", function() {
  //   var resp
  //   var mock = nock("https://user-api-example.com")
  //     .get('/browse/created')
  //     .reply(200)
  //
  //   var opts = {
  //     url: "",
  //   }
  //
  //   before(function(done){
  //     server.inject(opts), function(response) {
  //       resp = response
  //       mock.done()
  //       done()
  //     }
  //   })
  //
  //   it("is ok", function(done) {
  //     expect(resp.statusCode).to.equal(200)
  //     done()
  //   })
  //
  //
  //   it("uses the right template", function(done) {
  //
  //   })
  // })



});
