var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  before = lab.before,
  afterEach = lab.afterEach,
  after = lab.after,
  it = lab.test,
  expect = Code.expect,
  generateCrumb = require("../handlers/crumb.js"),
  emailMock,
  server;

var MockTransport = require('nodemailer-mock-transport');
var sendEmail = require('../../adapters/send-email');
var requireInject = require('require-inject');
var redisMock = require('redis-mock');
var client = redisMock.createClient();

before(function(done) {
  requireInject.installGlobally('../mocks/server', {
    redis: redisMock
  })(function(obj) {
    server = obj;
    sendEmail.mailConfig.mailTransportModule = new MockTransport();
    emailMock = sendEmail.mailConfig.mailTransportModule;
    done();
  });
});

afterEach(function(done) {
  emailMock.sentMail = [];
  done();
});

after(function(done) {
  server.stop(done);
});

function assertEmail(opts, expectedTo) {
  var expectedFrom = '"npm, Inc. Support" <support@npmjs.com>';
  var expectedText = opts.payload.message;
  var expectedSubject = opts.payload.subject + ' - FROM: "' +
    opts.payload.name + '" <' + opts.payload.email + '>';

  var msg = emailMock.sentMail[0];
  expect(msg.data.to).to.equal(expectedTo);
  expect(msg.message._headers.find(function(header) {
    return header.key === 'To';
  }).value).to.equal(expectedTo);
  expect(msg.data.from).to.equal(expectedFrom);
  expect(msg.message._headers.find(function(header) {
    return header.key === 'From';
  }).value).to.equal(expectedFrom);
  expect(msg.data.text).to.equal(expectedText);
  expect(msg.message.content).to.equal(expectedText);
  expect(msg.data.subject).to.equal(expectedSubject);
  expect(msg.message._headers.find(function(header) {
    return header.key === 'Subject';
  }).value).to.equal(expectedSubject);
}

describe('getting contact info', function() {
  it('can be reached via the /contact route', function(done) {
    server.inject('/contact', function(resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('company/contact');
      done();
    });
  });

  it('can be reached via the /support route', function(done) {
    server.inject('/support', function(resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.template).to.equal('company/contact');
      done();
    });
  });
});

describe('sending a contact email', function() {
  it('fails if it is missing the cookie', function(done) {
    var opts = {
      url: '/send-contact',
      method: 'POST',
      payload: {
        name: 'Boom',
        email: 'boom@bam.com',
        subject: 'Hi!',
        inquire: 'support',
        message: 'This is a message.'
      }
    };

    server.inject(opts, function(resp) {
      expect(resp.statusCode).to.equal(403);
      expect(resp.request.response.source.context.message).to.equal('Forbidden');
      done();
    });
  });

  it("posts to zendesk if it's a support inquiry", function(done) {

    // first, forcibly mock the ticket.create method
    var Tickets = require("node-zendesk/lib/client/tickets.js").Tickets;
    Tickets.prototype.create = function(data, callback) {
      expect(data.ticket.requester.name).to.equal('Boom');
      expect(data.ticket.requester.email).to.equal('boom@bam.com');
      expect(data.ticket.subject).to.equal('Hi!');
      expect(data.ticket.comment.body).to.equal('This is a message.');

      callback(null, 201, {
        "url": "https://npmhelp.zendesk.com/api/v2/tickets/1.json",
        "id": 1,
        "external_id": null,
        "via": {
          "channel": "testing",
          "source": {
            "from": {},
            "to": {},
            "rel": null
          }
        },
        "created_at": "2015-04-15T22:05:55Z",
        "updated_at": "2015-04-19T23:02:16Z",
        "type": "incident",
        "subject": "Hi!",
        "raw_subject": "Hi!",
        "description": "description",
        "priority": "high",
        "status": "new",
        "recipient": null,
        "requester_id": 13245,
        "submitter_id": 13245,
        "assignee_id": 13245,
        "organization_id": 12345,
        "group_id": 12345,
        "collaborator_ids": [],
        "forum_topic_id": null,
        "problem_id": null,
        "has_incidents": false,
        "due_at": null,
        "tags": [
          "sample",
          "zendesk"
        ],
        "custom_fields": [],
        "satisfaction_rating": null,
        "sharing_agreement_ids": [],
        "fields": [],
        "followup_ids": [],
        "brand_id": 13245
      })
    };

    server.inject({
      url: '/contact'
    }, function(resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/send-contact',
          method: 'POST',
          payload: {
            name: 'Boom',
            email: 'boom@bam.com',
            subject: 'Hi!',
            inquire: 'support',
            message: 'This is a message.',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(opts, function(resp) {
          expect(resp.statusCode).to.equal(200);
          var source = resp.request.response.source;
          expect(source.template).to.equal('company/contact');
          done();
        });
      });
    });
  });

  it("sends an email to security if it's a security inquiry", function(done) {

    server.inject({
      url: '/contact'
    }, function(resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/send-contact',
          method: 'POST',
          payload: {
            name: 'Boom',
            email: 'boom@bam.com',
            subject: 'Hi!',
            inquire: 'security',
            message: 'This is a message.',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(opts, function(resp) {
          expect(resp.statusCode).to.equal(200);
          var source = resp.request.response.source;
          expect(source.template).to.equal('company/contact');
          assertEmail(opts, 'security <security@npmjs.com>');
          done();
        });
      });
    });
  });

  it('sends an email to npm if it\'s a general inquiry', function(done) {

    server.inject({
      url: '/contact'
    }, function(resp) {
      var header = resp.headers['set-cookie'];
      expect(header.length).to.equal(1);

      var cookieCrumb = header[0].match(/crumb=([^\x00-\x20\"\,\;\\\x7F]*)/)[1];

      expect(resp.result).to.include('<input type="hidden" name="crumb" value="' + cookieCrumb + '"/>');

      generateCrumb(server, function(crumb) {
        var opts = {
          url: '/send-contact',
          method: 'POST',
          payload: {
            name: 'Boom',
            email: 'boom@bam.com',
            subject: 'Hi!',
            inquire: 'general',
            message: 'This is a message.',
            crumb: crumb
          },
          headers: {
            cookie: 'crumb=' + crumb
          }
        };

        server.inject(opts, function(resp) {
          expect(resp.statusCode).to.equal(200);
          var source = resp.request.response.source;
          expect(source.template).to.equal('company/contact');
          assertEmail(opts, 'npm <npm@npmjs.com>');
          done();
        });
      });
    });
  });
});
