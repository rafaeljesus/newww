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
    config = require('../../../config');

var server;

before(function (done) {
  server = Hapi.createServer('localhost', '9113');

  server.pack.register([
    {
      plugin: npme,
      options: config
    }
  ], function () {
    server.start(done);
  });
});

describe('creating a trial in hubspot', function () {
  it('creates a new trial if one does not exist', function (done) {
    var productId = config.npme.product_id,
        trialLength = config.npme.trial_length,
        trialSeats = config.npme.trial_seats;

    var customer = {
      id: '23456',
      email: 'new@bam.com'
    };

    var hubspot = nock(config.license.api)
        .get('/trial/' + productId + '/' + customer.email)
        .reply(404)
        .put('/trial', {
          customer_id: customer.id,
          product_id: productId,
          length: trialLength,
          seats: trialSeats
        })
        .reply(200, {id: '54321'})

    server.methods.npme.createTrial(customer, function (err, trial) {
      expect(err).to.not.exist;
      expect(trial).to.exist;
      expect(trial.id).to.equal('54321');
      done();
    });
  });

  it('returns an existing trial if it already exists', function (done) {
    var productId = config.npme.product_id,
        trialLength = config.npme.trial_length,
        trialSeats = config.npme.trial_seats;

    var customer = {
      id: '23456',
      email: 'existing@bam.com'
    };

    var hubspot = nock(config.license.api)
        .get('/trial/' + productId + '/' + customer.email)
        .reply(200, {id: 'abcde'})

    server.methods.npme.createTrial(customer, function (err, trial) {
      expect(err).to.not.exist;
      expect(trial).to.exist;
      expect(trial.id).to.equal('abcde');
      done();
    });
  });

  it('returns an error if hubspot errors out from looking up trial info', function (done) {
    var productId = config.npme.product_id,
        trialLength = config.npme.trial_length,
        trialSeats = config.npme.trial_seats;

    var customer = {
      id: '23456',
      email: 'error@bam.com'
    };

    var hubspot = nock(config.license.api)
        .get('/trial/' + productId + '/' + customer.email)
        .reply(400)

    server.methods.npme.createTrial(customer, function (err, trial) {
      expect(err).to.exist;
      expect(trial).to.not.exist;
      expect(err.message).to.equal('Error with getting trial info for error@bam.com');
      done();
    });
  });

  it('returns an error if hubspot errors out from creating a trial', function (done) {
    var productId = config.npme.product_id,
        trialLength = config.npme.trial_length,
        trialSeats = config.npme.trial_seats;

    var customer = {
      id: '23456',
      email: 'error@bam.com'
    };

    var hubspot = nock(config.license.api)
        .get('/trial/' + productId + '/' + customer.email)
        .reply(404)
        .put('/trial', {
          customer_id: customer.id,
          product_id: productId,
          length: trialLength,
          seats: trialSeats
        })
        .reply(400)

    server.methods.npme.createTrial(customer, function (err, trial) {
      expect(err).to.exist;
      expect(trial).to.not.exist;
      expect(err.message).to.equal('Error with creating a trial for error@bam.com');
      done();
    });
  });
});