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
    trial_length = 30,
    trial_seats = 50;

var server;

before(function (done) {
  process.env.LICENSE_API = "https://billing.website.com"
  server = new Hapi.Server();
  server.connection({ host: 'localhost', port: '9113' });

  server.register(npme, function () {
    server.start(done);
  });
});

after(function (done) {
  delete process.env.LICENSE_API;
  done()
});

describe('creating a trial in hubspot', function () {
  it('creates a new trial if one does not exist', function (done) {
    var productId = process.env.NPME_PRODUCT_ID,
        trialLength = trial_length,
        trialSeats = trial_seats;

    var customer = {
      id: '23456',
      email: 'new@bam.com'
    };

    var hubspot = nock('https://billing.website.com')
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
      expect(err).to.not.exist();
      expect(trial).to.exist();
      expect(trial.id).to.equal('54321');
      done();
    });
  });

  it('returns an existing trial if it already exists', function (done) {
    var productId = process.env.NPME_PRODUCT_ID,
        trialLength = trial_length,
        trialSeats = trial_seats;

    var customer = {
      id: '23456',
      email: 'existing@bam.com'
    };

    var hubspot = nock('https://billing.website.com')
        .get('/trial/' + productId + '/' + customer.email)
        .reply(200, {id: 'abcde'})

    server.methods.npme.createTrial(customer, function (err, trial) {
      expect(err).to.not.exist();
      expect(trial).to.exist();
      expect(trial.id).to.equal('abcde');
      done();
    });
  });

  it('returns an error if hubspot errors out from looking up trial info', function (done) {
    var productId = process.env.NPME_PRODUCT_ID,
        trialLength = trial_length,
        trialSeats = trial_seats;

    var customer = {
      id: '23456',
      email: 'error@bam.com'
    };

    var hubspot = nock('https://billing.website.com')
        .get('/trial/' + productId + '/' + customer.email)
        .reply(400)

    server.methods.npme.createTrial(customer, function (err, trial) {
      expect(err).to.exist();
      expect(trial).to.not.exist();
      expect(err.message).to.equal('Error with getting trial info for error@bam.com');
      done();
    });
  });

  it('returns an error if hubspot errors out from creating a trial', function (done) {
    var productId = process.env.NPME_PRODUCT_ID,
        trialLength = trial_length,
        trialSeats = trial_seats;

    var customer = {
      id: '23456',
      email: 'error@bam.com'
    };

    var hubspot = nock('https://billing.website.com')
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
      expect(err).to.exist();
      expect(trial).to.not.exist();
      expect(err.message).to.equal('Error with creating a trial for error@bam.com');
      done();
    });
  });
});
