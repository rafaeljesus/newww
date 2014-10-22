var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var Hapi = require('hapi'),
    npme = require('../index'),
    request = require('request'),
    nock = require('nock'),
    config = require('../../../config').license;

// var hubspot = require('./fixtures/fake-hubspot')(config);

var server;

before(function (done) {
  server = Hapi.createServer('localhost', '8000');

  server.pack.register([
    {
      plugin: npme,
      options: config
    }
  ], function () {
    server.start(done);
  });
});

describe('posting a form to hubspot', function () {
  it('is successful when hubspot returns a 204', function (done) {

    var hubspot = nock('https://forms.hubspot.com')
        .post('/uploads/form/v2/123456/12345')
        .reply(204)

    var data = {};

    server.methods.npme.sendData('12345', data, function (err) {
      expect(err).to.not.exist;
      done();
    });
  });

  it('is successful when hubspot returns a 302', function (done) {

    var hubspot = nock('https://forms.hubspot.com')
        .post('/uploads/form/v2/123456/12345')
        .reply(302)

    var data = {};

    server.methods.npme.sendData('12345', data, function (err) {
      expect(err).to.not.exist;
      done();
    });
  });

  it('fails when hubspot returns something else', function (done) {

    var hubspot = nock('https://forms.hubspot.com')
      .post('/uploads/form/v2/123456/12345')
      .reply(400)

    var data = {};

    server.methods.npme.sendData('12345', data, function (err) {
      expect(err).to.exist;
      expect(err.message).to.equal("unexpected status code: 400")
      done();
    });
  });
});

describe('getting a customer from hubspot', function () {
  it('returns a customer when hubspot returns a customer', function (done) {
    var email = 'boom@bam.com';

    var hubspot = nock('https://billing.website.com')
      .get('/customer/' + email)
      .reply(200, {name: "boom"})

    server.methods.npme.getCustomer(email, function (err, customer) {

      expect(err).to.be.null;
      expect(customer).to.exist;
      expect(customer.name).to.equal("boom");
      done();
    });
  });

  it('returns null when hubspot does not find the customer', function (done) {
    var email = 'boom@bam.com';

    var hubspot = nock('https://billing.website.com')
      .get('/customer/' + email)
      .reply(404)

    server.methods.npme.getCustomer(email, function (err, customer) {

      expect(err).to.be.null;
      expect(customer).to.be.null;
      done();
    });
  });

  it('returns an error when hubspot returns an odd status code', function (done) {
    var email = 'boom@bam.com';

    var hubspot = nock('https://billing.website.com')
      .get('/customer/' + email)
      .reply(400)

    server.methods.npme.getCustomer(email, function (err, customer) {

      expect(err).to.exist;
      expect(err.message).to.equal("unexpected status code: 400")
      expect(customer).to.not.exist;
      done();
    });
  });
});

describe('creating a customer in hubspot', function () {
  it('returns a customer when hubspot creates it', function (done) {
    var data = {
      email: 'boom@bam.com',
      firstname: 'Boom',
      lastname: 'Bam',
      phone: '123-456-7890'
    };

    var dataIn = {
      email: data.email,
      name: data.firstname + ' ' + data.lastname,
      phone: data.phone
    };

    var hubspot = nock('https://billing.website.com')
        .put('/customer', dataIn)
        .reply(200, data);

    server.methods.npme.createCustomer(data, function (err, customer) {
      expect(err).to.not.exist;
      expect(customer).to.equal.data;
      done();
    });
  });

  it('returns an error when hubspot is not successful', function (done) {
    var data = {
      email: 'boom@bam.com',
      firstname: 'Boom',
      lastname: 'Bam',
      phone: '123-456-7890'
    };

    var dataIn = {
      email: data.email,
      name: data.firstname + ' ' + data.lastname,
      phone: data.phone
    };

    var hubspot = nock('https://billing.website.com')
        .put('/customer', dataIn)
        .reply(400);

    server.methods.npme.createCustomer(data, function (err, customer) {
      expect(err).to.exist;
      expect(err.message).to.equal('unable to create customer');
      expect(customer).to.not.exist;
      done();
    });
  });

});







