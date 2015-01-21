var Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server, cookieCrumb,
    forms = require('../fixtures/signupForms');

// prepare the server
before(function (done) {
  require('../fixtures/setupServer')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

var postSignup = function (payload) {
  return {
    url: '/signup',
    method: 'POST',
    payload: payload,
    headers: { cookie: 'crumb=' + cookieCrumb }
  };
};

// TODO add a redis instance so that we can test all of these wonderful little things

describe('Confirming an email address', function () {

  it('goes to the email confirmation template on success'/*, function (done) {
    var options = {
      url: '/signup'

    };

    server.inject(options, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];
      forms = forms(cookieCrumb);

      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('user/signup-form');
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
      done();
    });
  }*/);

  it('returns an error if no token is passed');

  it('returns an error if the token does not exist in the db');

  it('returns an error if the token in the cache does not match the token from the url');

  it('drops the token after confirming the email');
});
