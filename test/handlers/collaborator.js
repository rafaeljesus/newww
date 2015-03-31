var fixtures = require("../fixtures"),
    generateCrumb = require("./crumb.js"),
    Lab = require('lab'),
    nock = require('nock'),
    Code = require('code'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    beforeEach = lab.beforeEach,
    after = lab.after,
    it = lab.test,
    expect = Code.expect,
    server,
    userMock;

var ralph = fixtures.collaborators.ralph_the_reader;
var wrigley = fixtures.collaborators.wrigley_the_writer;

before(function (done) {
  userMock = nock("https://user-api-example.com")
    .get('/user/bob').twice()
    .reply(200, fixtures.users.bob);

  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  userMock.done();
  server.stop(done);
});

describe('GET /package/foo/collaborators', function () {
  var options;

  beforeEach(function(done){
    options = {
      method: "get",
      url: "/package/foo/collaborators",
      credentials: fixtures.users.bob
    };
    done();
  });

  it('calls back with a JSON object containing collaborators', function (done) {
    var mock = nock("https://user-api-example.com")
      .get('/package/foo/collaborators')
      .reply(200, fixtures.collaborators);

    server.inject(options, function (resp) {
      mock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.collaborators.ralph_the_reader).to.be.an.object();
      expect(resp.result.collaborators.wrigley_the_writer).to.be.an.object();
      done();
    });
  });

});


describe('PUT /package/foo/collaborators', function () {
  var options;

  beforeEach(function(done){
    options = {
      method: "put",
      url: "/package/foo/collaborators",
      credentials: fixtures.users.bob,
      payload: {
        collaborator: wrigley
      }
    };
    done();
  });

  it('calls back with a JSON object containing the new collaborator'/*, function (done) {
    var mock = nock("https://user-api-example.com")
      .put('/package/foo/collaborators', wrigley)
      .reply(200, wrigley);

    server.inject(options, function (resp) {
      mock.done()
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.collaborator).to.be.an.object();
      expect(resp.result.collaborator.name).to.equal("wrigley_the_writer");
      done();
    });
  }*/);

});

describe('POST /package/zing/collaborators/wrigley_the_writer', function () {
  var options;

  beforeEach(function(done){
    generateCrumb(server, function(crumb) {
      options = {
        method: "post",
        url: "/package/zing/collaborators/wrigley_the_writer",
        credentials: fixtures.users.bob,
        payload: {
          crumb: crumb,
          collaborator: wrigley
        },
        headers: {cookie: 'crumb='+crumb}
      };
      done();
    });
  });

  it('calls back with a JSON object containing the updated collaborator', function (done) {
    var mock = nock("https://user-api-example.com")
      .post('/package/zing/collaborators/wrigley_the_writer', wrigley)
      .reply(200, wrigley);

    server.inject(options, function (resp) {
      mock.done();
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.collaborator).to.be.an.object();
      expect(resp.result.collaborator.name).to.equal("wrigley_the_writer");
      done();
    });
  });

});


describe('DELETE /package/zing/collaborators/wrigley_the_writer', function () {
  var options;

  beforeEach(function(done){
    generateCrumb(server, function(crumb) {
      options = {
        method: "delete",
        url: "/package/zing/collaborators/wrigley_the_writer",
        credentials: fixtures.users.bob,
        payload: {crumb: crumb},
        headers: {cookie: 'crumb='+crumb}
      };
      done();
    });
  });

  it('calls back with a JSON object containing the deleted collaborator'/*, function (done) {
    var mock = nock("https://user-api-example.com")
      .delete('/package/zing/collaborators/wrigley_the_writer')
      .reply(200, wrigley);

    server.inject(options, function (resp) {
      mock.done()
      expect(resp.statusCode).to.equal(200);
      expect(resp.result.collaborator).to.be.an.object();
      expect(resp.result.collaborator.name).to.equal("wrigley_the_writer")
      done();
    });
  }*/);

});
