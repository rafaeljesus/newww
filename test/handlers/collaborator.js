var fixtures = require("../fixtures.js"),
    generateCrumb = require("./crumb.js"),
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
    cache;

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
      payload: {
        collaborator: fixtures.collaborators.wrigley_the_writer
      }
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

describe('POST /package/zing/collaborators/wrigley_the_writer', function () {
  var options

  beforeEach(function(done){
    generateCrumb(server, function(crumb) {
      options = {
        method: "post",
        url: "/package/zing/collaborators/wrigley_the_writer",
        credentials: fixtures.users.fakeuser,
        payload: {
          crumb: crumb,
          collaborator: fixtures.collaborators.wrigley_the_writer
        },
        headers: {cookie: 'crumb='+crumb}
      }
      done()
    })
  })

  it('calls back with a JSON object containing the updated collaborator', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.collaborator).to.be.an.object();
      expect(resp.result.collaborator).to.deep.equal(fixtures.collaborators.wrigley_the_writer);
      done();
    });
  });

});


describe('DELETE /package/zing/collaborators/wrigley_the_writer', function () {
  var options

  beforeEach(function(done){
    generateCrumb(server, function(crumb) {
      options = {
        method: "delete",
        url: "/package/zing/collaborators/wrigley_the_writer",
        credentials: fixtures.users.fakeuser,
        payload: {crumb: crumb},
        headers: {cookie: 'crumb='+crumb}
      }
      done()
    })
  })

  it('calls back with a JSON object containing the deleted collaborator', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.collaborator).to.be.an.object();
      expect(resp.result.collaborator).to.deep.equal(fixtures.collaborators.wrigley_the_writer);
      done();
    });
  });

});
