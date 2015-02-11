var fixtures = require("../fixtures.js"),
    Lab = require('lab'),
    Code = require('code'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    server,
    source,
    cache,
    cookieCrumb;

before(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

describe('GET /package/foo/collaborators', function () {
  var options

  beforeEach(function(done){
    options = {
      method: "get",
      url: "/package/foo/collaborators",
      credentials: fixtures.users.fakeuser
    }
    done()
  })

  it('calls back with a JSON object containing collaborators', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.collaborators).to.be.an.object();
      expect(resp.result.collaborators).to.deep.equal(fixtures.collaborators);
      done();
    });
  });

  it('calls back with an error if bearer token is missing', function (done) {
    delete options.credentials
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.be.above(399);
      done();
    });
  });

});


describe('PUT /package/foo/collaborators', function () {
  var options

  beforeEach(function(done){
    options = {
      method: "put",
      url: "/package/foo/collaborators",
      credentials: fixtures.users.fakeuser,
      payload: fixtures.collaborators.wrigley_the_writer
    }
    done()
  })

  it('calls back with a JSON object containing the new collaborator', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.collaborator).to.be.an.object();
      expect(resp.result.collaborator).to.deep.equal(fixtures.collaborators.wrigley_the_writer);
      done();
    });
  });

});
