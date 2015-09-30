var Code = require('code'),
  Lab = require('lab'),
  lab = exports.lab = Lab.script(),
  describe = lab.experiment,
  beforeEach = lab.beforeEach,
  afterEach = lab.afterEach,
  it = lab.test,
  expect = Code.expect,
  server;

beforeEach(function(done) {
  require('../mocks/server')(function(obj) {
    server = obj;
    done();
  });
});

afterEach(function(done) {
  server.stop(done);
});

describe('redirects for legacy routes', function() {

  it('sends /recent-authors to homepage', function(done) {
    var options = {
      url: '/recent-authors'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/");
      done();
    });
  });


  it('sends /browse/all to homepage', function(done) {
    var options = {
      url: '/browse/all'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/");
      done();
    });
  });


  it('sends /browse/userstar to homepage', function(done) {
    var options = {
      url: '/browse/userstar'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/");
      done();
    });
  });

  it('sends /browse/author/{user} to package page for user', function(done) {
    var options = {
      url: '/browse/author/bob'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/~bob#packages");
      done();
    });
  });

  it('sends invalid username to 404 for /browse/author/{user}', function(done) {
    var options = {
      url: '/browse/author/%E0%B4%8Aset-cookie:%20foo=bar'
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('sends /browse/userstar/{user} to starred page for user', function(done) {
    var options = {
      url: '/browse/userstar/bob'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/~bob#starred");
      done();
    });
  });

  it('sends invalid username to 404 for /browse/userstar/{user}', function(done) {
    var options = {
      url: '/browse/userstar/%E0%B4%8Aset-cookie:%20foo=bar'
    };

    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });


  it('sends invalid package name to 404', function(done) {
    var options = {
      url: '/packages/%E0%B4%8Aset-cookie:%20foo=bar'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('sends invalid package name with scope to 404', function(done) {
    var options = {
      url: '/packages/@badguy/%E0%B4%8Aset-cookie:%20foo=bar'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('sends /packages/test-package-name to /package/test-package-name', function(done) {
    var options = {
      url: '/packages/test-package-name'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/package/test-package-name");
      done();
    });
  });

  it('sends /packages/@test-scope/test-package-name to /package/@test-scope/test-package-name', function(done) {
    var options = {
      url: '/packages/@test-scope/test-package-name'
    };
    server.inject(options, function(resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.equal("/package/@test-scope/test-package-name");
      done();
    });
  });

});
