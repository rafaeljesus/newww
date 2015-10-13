var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  nock = require('nock');

var Scope = require('../../agents/scope');

describe('Scope', function() {
  describe('get()', function() {
    it('throws an error if the scope is not found', function(done) {
      var scopeMock = nock('https://user-api-example.com')
        .get('/scope/bigco')
        .reply(404);

      Scope('bob').get('bigco', function(err, scope) {
        scopeMock.done();
        expect(err).to.exist();
        expect(err.message).to.equal('scope not found');
        expect(err.statusCode).to.equal(404);
        expect(scope).to.be.undefined();
        done();
      });
    });

    it('returns a scope if the name is found', function(done) {
      var scopeMock = nock('https://user-api-example.com')
        .get('/scope/bigco')
        .reply(200,
          {
            "name": "bigco",
            "type": "user",
            "parent_id": 183,
            "created": "2015-10-12T17:16:47.151Z",
            "updated": "2015-10-12T17:16:47.151Z",
            "deleted": null
          }
      );

      Scope('bob').get('bigco', function(err, scope) {
        scopeMock.done();
        expect(err).to.not.exist();
        expect(scope).to.exist();
        expect(scope.name).to.equal('bigco');
        done();
      });
    });
  });
});
