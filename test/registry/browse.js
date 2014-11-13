var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, p, source;

before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('getting to the browse page', function () {
  it('redirects from plain keyword searches', function (done) {
    var opts = {
      url: '/keyword/something'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(301);
      expect(resp.headers.location).to.include('/browse/keyword/something');
      done();
    });
  });

  it('renders an error if the browse type is invalid', function (done) {
    var opts = {
      url: '/browse/blarg'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      expect(source.template).to.equal('errors/not-found');
      expect(source.context.errId).to.exist;
      done();
    });
  });

  it('understands the page query and uses it properly', function (done) {
    var pageNum = 2;
    var opts = {
      url: '/browse?page=' + pageNum
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('registry/browse');
      expect(source.context.page).to.equal(pageNum);
      expect(source.context.nextPage).to.equal(pageNum + 1);
      expect(source.context.prevPage).to.equal(pageNum - 1);
      done();
    });
  });

  describe('parsing browse paths', function () {
    it('handles "all"', function (done) {
      var opts = {
        url: '/browse/all'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('all');
        expect(source.context.arg).to.not.exist;
        done();
      });
    });

    it('handles "updated"', function (done) {
      var opts = {
        url: '/browse/updated'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('updated');
        expect(source.context.arg).to.not.exist;
        done();
      });
    });

    it('handles "keyword" by itself', function (done) {
      var opts = {
        url: '/browse/keyword'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('keyword');
        expect(source.context.arg).to.not.exist;
        done();
      });
    });

    it('handles "keyword" with an argument', function (done) {
      var opts = {
        url: '/browse/keyword/grunt'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('keyword');
        expect(source.context.arg).to.equal('"grunt"');
        done();
      });
    });

    it('handles "author" by itself', function (done) {
      var opts = {
        url: '/browse/author'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('author');
        expect(source.context.arg).to.not.exist;
        done();
      });
    });

    it('handles "author" with an argument', function (done) {
      var opts = {
        url: '/browse/author/mikeal'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('author');
        expect(source.context.arg).to.equal('mikeal');
        done();
      });
    });

    it('handles "depended" by itself', function (done) {
      var opts = {
        url: '/browse/depended'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('depended');
        expect(source.context.arg).to.not.exist;
        done();
      });
    });

    it('handles "depended" with an argument', function (done) {
      var opts = {
        url: '/browse/depended/request'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('depended');
        expect(source.context.arg).to.equal('request');
        done();
      });
    });

    it('handles "star" by itself', function (done) {
      var opts = {
        url: '/browse/star'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('star');
        expect(source.context.arg).to.not.exist;
        done();
      });
    });

    it('handles "star" with an argument', function (done) {
      var opts = {
        url: '/browse/star/request'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('star');
        expect(source.context.arg).to.equal('request');
        done();
      });
    });

    it('handles "userstar" by itself', function (done) {
      var opts = {
        url: '/browse/userstar'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/browse');
        expect(source.context.type).to.equal('userstar');
        expect(source.context.arg).to.not.exist;
        done();
      });
    });

    it('redirects "userstar" with an argument to profile page #starred', function (done) {
      var opts = {
        url: '/browse/userstar/mikeal'
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(301);
        expect(resp.headers.location).to.include('/~mikeal#starred');
        done();
      });
    });
  });
});
