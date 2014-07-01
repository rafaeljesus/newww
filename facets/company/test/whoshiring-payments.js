var Lab = require('lab'),
    describe = Lab.experiment,
    before = Lab.before,
    it = Lab.test,
    expect = Lab.expect;

var server, serverResponse, source;

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
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('payments');
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
        amount: '35000'
      }
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
        amount: '35000'
      }
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
        amount: '135'
      }
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(403);
      expect(resp.result).to.include('validation error');
      done();
    });
  });

  // How do I test a successful payment?
});