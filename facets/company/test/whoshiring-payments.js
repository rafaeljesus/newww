var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var server, serverResponse, source, cookieCrumb;

before(function (done) {
  server = require('./fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('Accessing the whoshiring page', function () {
  it('gets there with ease', function (done) {
    var opts = {
      url: '/joinwhoshiring'
    };

    server.inject(opts, function (resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('payments');
      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');
      done();
    });
  });

  it('renders an error if the cookie crumb is missing', function (done) {
    var options = {
      url: '/joinwhoshiring',
      method: 'POST',
      payload: {}
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(403);
      done();
    });
  });


  it('renders an error when a stripe key is reused', function (done) {
    var opts = {
      url: '/joinwhoshiring',
      method: 'POST',
      payload: {
        id: 'tok_104Js54fnGb60djYLjp7ISQd',
        email: 'boom@boom.com',
        amount: '35000',
        crumb: cookieCrumb
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(500);
      expect(resp.result).to.include('internal stripe error');
      done();
    });
  });

  it('renders an error if the email is invalid', function (done) {
    var opts = {
      url: '/joinwhoshiring',
      method: 'POST',
      payload: {
        id: 'tok_104Js54fnGb60djYLjp7ISQd',
        email: 'boom@boom',
        amount: '35000',
        crumb: cookieCrumb
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(resp.result).to.include('validation error');
      done();
    });
  });

  it('renders an error if the amount is not a number', function (done) {
    var opts = {
      url: '/joinwhoshiring',
      method: 'POST',
      payload: {
        id: 'tok_104Js54fnGb60djYLjp7ISQd',
        email: 'boom@boom.com',
        amount: 'two',
        crumb: cookieCrumb
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(resp.result).to.include('validation error');
      done();
    });
  });

  it('renders an error if the amount is invalid', function (done) {
    var opts = {
      url: '/joinwhoshiring',
      method: 'POST',
      payload: {
        id: 'tok_104Js54fnGb60djYLjp7ISQd',
        email: 'boom@boom.com',
        amount: '135',
        crumb: cookieCrumb
      },
      headers: { cookie: 'crumb=' + cookieCrumb }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(resp.result).to.include('invalid charge amount error');
      done();
    });
  });

  // How do I test a successful payment?
});