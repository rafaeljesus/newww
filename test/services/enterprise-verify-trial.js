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
    server;

before(function (done) {
  process.env.LICENSE_API = 'https://billing.website.com';
  server = new Hapi.Server();
  server.connection({ host: 'localhost', port: '9116' });

  server.register(npme, function () {
    server.start(done);
  });
});

after(function(done){
  delete process.env.LICENSE_API;
  done();
});

describe('verifying a trial in hubspot', function () {
  it('returns a trial when a customer submits a valid verification key', function (done) {
    var verificationKey = '12-34-56',
        trialId = 'ab-cd-ef';

    var hubspot = nock('https://billing.website.com')
        .get('/trial/' + verificationKey)
        .reply(200, {id: trialId})
        .put('/trial/' + trialId + '/verification')
        .reply(200, {verified: true});

    server.methods.npme.verifyTrial(verificationKey, function (err, verifiedTrial) {
      hubspot.done();
      expect(err).to.not.exist();
      expect(verifiedTrial.verified).to.be.true();
      done();
    });
  });

  it('returns a trial when a customer submits an already verified verification key', function (done) {
    var verificationKey = '12-34-56',
        trialId = 'ab-cd-ef';

    var hubspot = nock('https://billing.website.com')
        .get('/trial/' + verificationKey)
        .reply(200, {id: trialId, verified: true});

    server.methods.npme.verifyTrial(verificationKey, function (err, verifiedTrial) {
      hubspot.done();
      expect(err).to.not.exist();
      expect(verifiedTrial.id).to.equal(trialId);
      expect(verifiedTrial.verified).to.be.true();
      done();
    });
  });

  it('returns an error for a verification key that does not exist', function (done) {
    var verificationKey = '12-34-56';

    var hubspot = nock('https://billing.website.com')
        .get('/trial/' + verificationKey)
        .reply(404);

    server.methods.npme.verifyTrial(verificationKey, function (err, verifiedTrial) {
      hubspot.done();
      expect(err).to.exist();
      expect(err.message).to.equal('verification key not found');
      expect(verifiedTrial).to.not.exist();
      done();
    });
  });

  it('returns an error if there is a problem verifying the trial', function (done) {
    var verificationKey = '12-34-56';

    var hubspot = nock('https://billing.website.com')
        .get('/trial/' + verificationKey)
        .reply(400);

    server.methods.npme.verifyTrial(verificationKey, function (err, verifiedTrial) {
      hubspot.done();
      expect(err).to.exist();
      expect(err.message).to.equal('problem verifying trial for ' + verificationKey);
      expect(verifiedTrial).to.not.exist();
      done();
    });
  });

  it('returns an error if there is a problem starting the trial', function (done) {
    var verificationKey = '12-34-56',
        trialId = 'ab-cd-ef';

    var hubspot = nock('https://billing.website.com')
        .get('/trial/' + verificationKey)
        .reply(200, {id: trialId})
        .put('/trial/' + trialId + '/verification')
        .reply(400);

    server.methods.npme.verifyTrial(verificationKey, function (err, verifiedTrial) {
      hubspot.done();
      expect(err).to.exist();
      expect(err.message).to.equal('problem starting trial for ' + trialId);
      expect(verifiedTrial).to.not.exist();
      done();
    });
  });

});
