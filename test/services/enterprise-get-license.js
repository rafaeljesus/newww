var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  Hapi = require('hapi'),
  npme = require('../../services/npme'),
  nock = require('nock'),
  server;

before(function(done) {
  process.env.LICENSE_API = "https://billing.website.com"
  server = new Hapi.Server();
  server.connection({
    host: 'localhost',
    port: '9132'
  });

  server.register(npme, function() {
    server.start(done);
  });
});

after(function(done) {
  delete process.env.LICENSE_API;
  done()
});


var license = {
  details: {
    id: 619,
    customer_id: 123,
    product_id: '12-34-56',
    plan_id: null,
    license_key: '9b0ed7f8-ac3a-408a-8821-86be0426ea76',
    seats: 5,
    begins: '2015-03-12T17:02:44.000Z',
    ends: '2016-03-12T17:02:44.000Z',
    created: '2015-03-13T00:09:48.209Z',
    updated: '2015-03-13T00:09:48.209Z'
  },
  signature: 'some-long-string'
};

describe('getting a specific license from hubspot', function() {
  it('returns the license if it is found', function(done) {

    var productId = '12-34-56',
      customerId = '12345',
      licenseId = license.details.license_key;

    var mock = nock('https://billing.website.com')
      .get('/license/' + productId + '/' + customerId + '/' + licenseId)
      .reply(200, license);

    server.methods.npme.getLicense(productId, customerId, licenseId, function(err, license) {
      mock.done();
      expect(err).to.not.exist();
      expect(license).to.be.an.object();
      expect(license.license_key).to.equal(licenseId);
      done();
    });
  });

  it('returns nothing if not found', function(done) {

    var productId = '12-34-56',
      customerId = '12345',
      licenseId = 'd89355a5-859b-43f4-8d8d-12b661403314';

    var mock = nock('https://billing.website.com')
      .get('/license/' + productId + '/' + customerId + '/' + licenseId)
      .reply(404);

    server.methods.npme.getLicense(productId, customerId, licenseId, function(err, license) {
      mock.done();
      expect(err).to.be.null();
      expect(license).to.be.null();
      done();
    });
  });

  it('returns en error if something goes wrong at hubspot', function(done) {

    var productId = '12-34-56',
      customerId = '12345',
      licenseId = license.details.license_key;

    var mock = nock('https://billing.website.com')
      .get('/license/' + productId + '/' + customerId + '/' + licenseId)
      .reply(400);

    server.methods.npme.getLicense(productId, customerId, licenseId, function(err, license) {
      mock.done();
      expect(err).to.exist();
      expect(err.message).to.equal('unexpected status code fetching license; status=400; customer=' + customerId + ';license=' + licenseId);
      expect(license).to.not.exist();
      done();
    });
  });

});
