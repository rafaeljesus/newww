var Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    before = lab.before,
    after = lab.after,
    it = lab.test,
    expect = Lab.expect;

var server, source;

before(function (done) {
  server = require('../fixtures/setupServer')(done);

  server.ext('onPreResponse', function (request, next) {
    source = request.response.source;
    next();
  });
});

describe('getting to the recentauthors page', function () {
  it('renders the page when the url is correct', function (done) {
    var opts = {
      url: '/recent-authors'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(200);
      expect(source.template).to.equal('registry/recentauthors');
      expect(source.context.errId).to.not.exist;
      done();
    });
  })

  it('renders an error if the url is invalid', function (done) {
    var opts = {
      url: '/recent-authors/blarg'
    };

    server.inject(opts, function (resp) {
      expect(resp.statusCode).to.equal(404);
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });

  describe('pagination', function () {
    it('understands the page query and uses it properly', function (done) {
      var pageNum = 2;
      var opts = {
        url: '/recent-authors?page=' + pageNum
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/recentauthors');
        expect(source.context.page).to.equal(pageNum);
        expect(source.context.nextPage).to.equal(pageNum + 1);
        expect(source.context.prevPage).to.equal(pageNum - 1);
        done();
      });
    });

    it('coerces negative page numbers to 1', function (done) {
      var pageNum = -1;
      var opts = {
        url: '/recent-authors?page=' + pageNum
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/recentauthors');
        expect(source.context.page).to.equal(1);
        expect(source.context.nextPage).to.equal(2);
        expect(source.context.prevPage).to.not.exist;
        done();
      });
    });

    it('coerces decimal page numbers to 1', function (done) {
      var pageNum = 0.1;
      var opts = {
        url: '/recent-authors?page=' + pageNum
      };

      server.inject(opts, function (resp) {
        expect(resp.statusCode).to.equal(200);
        expect(source.template).to.equal('registry/recentauthors');
        expect(source.context.page).to.equal(1);
        expect(source.context.nextPage).to.equal(2);
        expect(source.context.prevPage).to.not.exist;
        done();
      });
    });
  });
});