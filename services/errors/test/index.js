var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var Hapi = require('hapi'),
    errors = require('../index.js'),
    sinon = require('sinon'),
    config = require('../../config'),
    metrics = require('../../adapters/metrics')(config.metrics)
    ;

var server;

var createReplyMock = function () {
  var replyMock = function () { return replyMock; };
  replyMock.view = sinon.spy(function () { return replyMock; });
  replyMock.code = sinon.spy();

  return replyMock;
}

before(function (done) {
  server = Hapi.createServer();
  server.pack.register(errors, done);
});

describe('Bubbling errors up to the user', function () {

  it('should take a code 400 error to the invalid error template', function (done) {
    var replyMock = createReplyMock();
    var replySpy = sinon.spy(replyMock);

    var showError = server.methods.errors.showError(replySpy);
    var opts = {
      namespace: 'somespace'
    };

    showError.call(this, 'someError', 400, 'some message', opts);
    expect(replyMock.view.called).to.be.true;
    expect(replyMock.view.calledWith('errors/invalid')).to.be.true;
    expect(replyMock.code.calledWith(400)).to.be.true;
    done();
  });

  it('should take a code 403 error to the internal error template', function (done) {
    var replyMock = createReplyMock();
    var replySpy = sinon.spy(replyMock);

    var showError = server.methods.errors.showError(replySpy);
    var opts = {
      namespace: 'somespace'
    };

    showError.call(this, 'someError', 403, 'some message', opts);
    expect(replyMock.view.called).to.be.true;
    expect(replyMock.view.calledWith('errors/internal')).to.be.true;
    expect(replyMock.code.calledWith(403)).to.be.true;
    done();
  });

  it('should take a code 404 error to the not-found error template', function (done) {

    var replyMock = createReplyMock();
    var replySpy = sinon.spy(replyMock);

    var showError = server.methods.errors.showError(replySpy);
    var opts = {
      namespace: 'somespace'
    };

    showError.call(this, 'someError', 404, 'some message', opts);
    expect(replyMock.view.called).to.be.true;
    expect(replyMock.view.calledWith('errors/not-found')).to.be.true;
    expect(replyMock.code.calledWith(404)).to.be.true;
    done();
  });

  it('should take a code 500 error to the internal error template', function (done) {

    var replyMock = createReplyMock();
    var replySpy = sinon.spy(replyMock);

    var showError = server.methods.errors.showError(replySpy);
    var opts = {
      namespace: 'somespace'
    };

    showError.call(this, 'someError', 500, 'some message', opts);
    expect(replyMock.view.called).to.be.true;
    expect(replyMock.view.calledWith('errors/internal')).to.be.true;
    expect(replyMock.code.calledWith(500)).to.be.true;
    done();
  });

  it('should avoid sending a view for xhr requests', function (done) {

    var replyMock = createReplyMock();
    var replySpy = sinon.spy(replyMock);

    var showError = server.methods.errors.showError(replySpy);

    var opts = {
      namespace: 'somespace',
      isXhr: true
    };

    showError.call(this, 'someError', 500, 'some message', opts);
    expect(replySpy.called).to.be.true;
    expect(replySpy.args[0][0]).to.include('some message - ');
    expect(replyMock.code.calledWith(500)).to.be.true;
    done();
  });

});
