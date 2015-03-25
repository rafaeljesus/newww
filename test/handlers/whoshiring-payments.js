var generateCrumb = require("./crumb.js"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Code.expect;

var server;


before(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

after(function (done) {
  server.stop(done);
});

describe('Accessing the joinwhoshiring page', function () {
  it('gets there with ease', function (done) {
    var opts = {
      url: '/joinwhoshiring'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('company/payments');
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

  // when the internet is slow, the longer timeout becomes necessary
  it('renders an error when a stripe key is reused', { timeout: 4000 }, function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        url: '/joinwhoshiring',
        method: 'POST',
        payload: {
          id: 'tok_104Js54fnGb60djYLjp7ISQd',
          email: 'boom@boom.com',
          amount: '35000',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(500);
        expect(resp.result).to.include('internal stripe error');
        done();
      });
    });
  });

  it('renders an error if the email is invalid', function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        url: '/joinwhoshiring',
        method: 'POST',
        payload: {
          id: 'tok_104Js54fnGb60djYLjp7ISQd',
          email: 'boom@boom',
          amount: '35000',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(403);
        expect(resp.result).to.include('validation error');
        done();
      });
    });
  });

  it('renders an error if the amount is not a number', function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        url: '/joinwhoshiring',
        method: 'POST',
        payload: {
          id: 'tok_104Js54fnGb60djYLjp7ISQd',
          email: 'boom@boom.com',
          amount: 'two',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(403);
        expect(resp.result).to.include('validation error');
        done();
      });
    });
  });

  it('renders an error if the amount is invalid', function (done) {

    generateCrumb(server, function (crumb){
      var opts = {
        url: '/joinwhoshiring',
        method: 'POST',
        payload: {
          id: 'tok_104Js54fnGb60djYLjp7ISQd',
          email: 'boom@boom.com',
          amount: '135',
          crumb: crumb
        },
        headers: { cookie: 'crumb=' + crumb }
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(403);
        expect(resp.result).to.include('invalid charge amount error');
        done();
      });
    });
  });

  // How do I test a successful payment?
});
