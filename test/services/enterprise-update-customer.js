var expect = require('code').expect,
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    Hapi = require('hapi'),
    npme = require('../../services/npme'),
    nock = require('nock'),
    existingUser = require('../fixtures/enterprise').existingUser,
    server;

before(function (done) {
  process.env.LICENSE_API = 'https://billing.website.com';
  server = new Hapi.Server();
  server.connection({ host: 'localhost', port: '9133' });

  server.register(npme, function () {
    server.start(done);
  });
});

after(function (done) {
  delete process.env.LICENSE_API;
  done();
});

describe('updating a customer via hubspot', function () {
  it('returns the customer if it is successful', function (done) {

    var customerId = 12345;

    var mock = nock('https://billing.website.com')
        .post('/customer/' + customerId, existingUser)
        .reply(200, existingUser);

    server.methods.npme.updateCustomer(customerId, existingUser, function (err, customer) {
      mock.done();
      expect(err).to.not.exist();
      expect(customer).to.be.an.object();
      expect(customer.id).to.equal(customerId);
      done();
    });
  });

  it('returns en error if something goes wrong at hubspot', function (done) {

    var customerId = 12345;

    var mock = nock('https://billing.website.com')
        .post('/customer/' + customerId, existingUser)
        .reply(400);

    server.methods.npme.updateCustomer(customerId, existingUser, function (err, customer) {
      mock.done();
      expect(err).to.exist();
      expect(err.message).to.equal('unable to update customer ' + customerId);
      expect(customer).to.not.exist();
      done();
    });
  });

});
