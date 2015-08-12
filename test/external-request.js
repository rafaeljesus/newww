var Lab = require('lab'),
  Code = require('code'),
  nock = require('nock'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  it = lab.test,
  expect = Code.expect,
  Request = require('../lib/external-request'),
  sinon = require('sinon');

describe('external-request', function() {
  it('logs interesting data when passing a request through', function(done) {
    var infoSpy = sinon.spy();
    var oldLogger = Request.logger.info;
    Request.logger.info = infoSpy;

    var mock = nock('https://google.com')
      .get('/')
      .reply(200);

    Request.get('https://google.com/', function(err, resp, body) {
      expect(err).to.not.exist();
      expect(infoSpy.called).to.be.true();
      Request.logger.info = oldLogger;
      mock.done();
      done();
    });
  });
});