var generateCrumb = require("../handlers/crumb.js"),
  Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  afterEach = lab.afterEach,
  after = lab.after,
  it = lab.test,
  expect = Code.expect;

var server;
var emailMock;


before(function(done) {
  require('../mocks/server')(function(obj) {
    server = obj;
    emailMock = server.methods.email.send.mailConfig.mailTransportModule;
    server.app.cache._cache.connection.client = {};
    done();
  });
});

afterEach(function(done) {
  emailMock.sentMail = [];
  done();
});

after(function(done) {
  delete server.app.cache._cache.connection.client;
  server.stop(done);
});

function assertEmail () {
  var expectedName = 'Boom Bam';
  var expectedEmail = 'exists@bam.com';
  var expectedTo = '"' + expectedName + '" <' + expectedEmail + '>';
  var expectedFrom = '"npm, Inc." <website@npmjs.com>';
  var expectedVerificationKey = '12ab34cd-a123-4b56-789c-1de2deadbeef';
  var expectedSupportEmail = 'support@npmjs.com';

  var msg = emailMock.sentMail[0];
  expect(msg.data.to).to.equal(expectedTo);
  expect(msg.message._headers.find(function (header) {
    return header.key === 'To';
  }).value).to.equal(expectedTo);
  expect(msg.data.from).to.equal(expectedFrom);
  expect(msg.message._headers.find(function (header) {
    return header.key === 'From';
  }).value).to.equal(expectedFrom);
  expect(msg.data.support_email).to.equal(expectedSupportEmail);
  expect(msg.message.content).to.match(new RegExp(expectedSupportEmail));
  expect(msg.data.verification_key).to.equal(expectedVerificationKey);
  expect(msg.message.content).to.match(new RegExp(expectedVerificationKey));
  expect(msg.message.content).to.match(new RegExp(expectedName));
}

describe('Getting to the thank-you page', function() {
  it('creates a new trial when a customer does not have one yet', function(done) {

    generateCrumb(server, function(crumb) {

      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'exists@bam.com',
          customer_id: '12345',
          agree: true
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        var source = resp.request.response.source;
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('enterprise/thanks');
        assertEmail();
        done();
      });
    });
  });

  it('returns an error if the customer does not exist yet', function(done) {

    generateCrumb(server, function(crumb) {
      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'new@bam.com',
          customer_id: '12345',
          agree: true
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(500);
        expect(resp.request.response.source.error).to.exist();
        done();
      });
    });
  });

  it('returns an error if the given customer id does not match the stored customer id', function(done) {

    generateCrumb(server, function(crumb) {
      var opts = {
        method: 'post',
        url: '/enterprise-trial-signup',
        payload: {
          crumb: crumb,
          customer_email: 'new@bam.com',
          customer_id: '67890',
          agree: true
        },
        headers: {
          cookie: 'crumb=' + crumb
        }
      };

      server.inject(opts, function(resp) {
        expect(resp.statusCode).to.equal(500);
        expect(resp.request.response.source.error).to.exist();
        done();
      });
    });
  });
});
