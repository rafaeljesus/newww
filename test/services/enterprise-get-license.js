var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    it = lab.test,
    expect = Lab.expect;

var Hapi = require('hapi'),
    npme = require('../../services/npme'),
    nock = require('nock'),
    config = require('../../config');

var server;

before(function (done) {
  server = Hapi.createServer('localhost', '9115');

  server.pack.register([
    {
      plugin: npme,
      options: config
    }
  ], function () {
    server.start(done);
  });
});

describe('getting licenses from hubspot', function () {
  it('returns the licenses if they are found', function (done) {

    var productId = '12-34-56',
        customerId = '12345';

    var hubspot = nock(config.license.api)
        .get('/license/' + productId + '/' + customerId)
        .reply(200, {licenses: ['1234-5678-90']})

    server.methods.npme.getLicenses(productId, customerId, function (err, licenses) {

      expect(err).to.not.exist;
      expect(licenses).to.be.an('array');
      expect(licenses[0]).to.equal('1234-5678-90');
      done();
    });
  });

  it('returns nothing if they are not found', function (done) {

    var productId = '12-34-56',
        customerId = '12345';

    var hubspot = nock(config.license.api)
        .get('/license/' + productId + '/' + customerId)
        .reply(404)

    server.methods.npme.getLicenses(productId, customerId, function (err, licenses) {

      expect(err).to.be.null;
      expect(licenses).to.be.null;
      done();
    });
  });

  it('returns en error if something goes wrong at hubspot', function (done) {

    var productId = '12-34-56',
        customerId = '12345';

    var hubspot = nock(config.license.api)
        .get('/license/' + productId + '/' + customerId)
        .reply(400)

    server.methods.npme.getLicenses(productId, customerId, function (err, licenses) {

      expect(err).to.exist;
      expect(err.message).to.equal('unexpected status code: 400');
      expect(licenses).to.not.exist;
      done();
    });
  });

});