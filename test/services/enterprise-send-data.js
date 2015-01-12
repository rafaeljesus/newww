var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    it = lab.test,
    expect = Code.expect;

var Hapi = require('hapi'),
    npme = require('../../services/npme'),
    nock = require('nock'),
    config = require('../../config');

config.license.hubspot.portal_id = 123456;

var server;

before(function (done) {
  server = new Hapi.Server();
  server.connection({ host: 'localhost', port: '9112' });

  server.register([
    {
      register: npme,
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
      expect(err).to.not.exist();
      done();
    });
  });

  it('is successful when hubspot returns a 302', function (done) {

    var hubspot = nock('https://forms.hubspot.com')
        .post('/uploads/form/v2/123456/12345')
        .reply(302)

    var data = {};

    server.methods.npme.sendData('12345', data, function (err) {
      expect(err).to.not.exist();
      done();
    });
  });

  it('fails when hubspot returns something else', function (done) {

    var hubspot = nock('https://forms.hubspot.com')
      .post('/uploads/form/v2/123456/12345')
      .reply(400)

    var data = {};

    server.methods.npme.sendData('12345', data, function (err) {
      expect(err).to.exist();
      expect(err.message).to.equal("unexpected status code: 400")
      done();
    });
  });
});

