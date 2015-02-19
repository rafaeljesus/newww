var fixtures = require("../fixtures"),
    cheerio = require("cheerio"),
    Code = require('code'),
    Lab = require('lab'),
    lab = exports.lab = Lab.script(),
    describe = lab.experiment,
    beforeEach = lab.beforeEach,
    afterEach = lab.afterEach,
    it = lab.test,
    expect = Code.expect,
    server,
    cookieCrumb;

beforeEach(function (done) {
  require('../mocks/server')(function (obj) {
    server = obj;
    done();
  });
});

afterEach(function (done) {
  server.stop(done);
});

describe('Retreiving packages from the registry', function () {
  it('gets a package from the registry', function (done) {
    var options = {
      url: '/package/request'
    };
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var source = resp.request.response.source;
      expect(source.context.package.name).to.equal('request');
      expect(source.template).to.equal('package/show');
      done();
    });
  });

  it('treats unpublished packages specially', function (done) {
    var options = {
      url: '/package/unpublished'
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(410);
      var source = resp.request.response.source;
      expect(source.template).to.equal('package/unpublished');
      done();
    });
  });

});

describe('getting package download information', function () {
  it('send a downloads data object', function (done) {
    var options = {
      url: '/package/request'
    };

    server.inject(options, function (resp) {
      var package = resp.request.response.source.context.package;
      expect(package.downloads).to.be.an.object();
      expect(package.downloads).to.contain('day');
      expect(package.downloads).to.contain('week');
      expect(package.downloads).to.contain('month');
      done();
    });
  });
});

describe('requesting nonexistent packages', function () {
  var name = 'notfound';
  var options = {
    url: '/package/' + name
  };

  it('returns a 404', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('adds package.name to view context', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      var source = resp.request.response.source;
      expect(source.context.package.name).to.exist();
      done();
    });
  });

  it('renders the 404 template', function (done) {
    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });
});

describe('requesting invalid packages', function () {
  var name = '_.escape';
  var options = {
    url: '/package/' + name
  };

  it('returns a 400', function (done) {
    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(404);
      done();
    });
  });

  it('does NOT add package.name to view context', function (done) {
    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      expect(source.context.package).to.not.exist();
      done();
    });
  });

  it('renders the invalid input template', function (done) {
    server.inject(options, function (resp) {
      var source = resp.request.response.source;
      expect(source.template).to.equal('errors/not-found');
      done();
    });
  });
});

describe('seeing stars', function () {
  it('highlights the star if the user is logged in and has starred the package', function (done) {
    var options = {
      url: '/package/request',
      credentials: fixtures.users.fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var package = resp.request.response.source.context.package;
      expect(package.name).to.equal('request');
      expect(package.isStarred).to.be.true();
      expect(resp.result).to.include('<input id="star-input" type="checkbox" name="isStarred" value="true" checked>');
      done();
    });
  });
});

describe('package nav', function () {

  it('is displayed if user is a collaborator', function (done) {
    var options = {
      url: '/package/request',
      credentials: fixtures.users.mikeal
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var package = resp.request.response.source.context.package;
      expect(package.name).to.equal('request');
      expect(package.isCollaboratedOnByUser).to.be.true();
      var $ = cheerio.load(resp.result)
      expect($(".secondary-nav")).to.have.length(1);
      done();
    });

  });

  it('is not displayed if user is logged in but not a collaborator', function (done) {
    var options = {
      url: '/package/request',
      credentials: fixtures.users.fakeuser
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var package = resp.request.response.source.context.package;
      expect(package.name).to.equal('request');
      expect(package.isCollaboratedOnByUser).to.equal(false);
      var $ = cheerio.load(resp.result)
      expect($(".secondary-nav")).to.have.length(0);
      done();
    });
  });


  it('is not displayed if user is not logged in', function (done) {
    var options = {
      url: '/package/request',
    };

    server.inject(options, function (resp) {
      expect(resp.statusCode).to.equal(200);
      var package = resp.request.response.source.context.package;
      expect(package.name).to.equal('request');
      expect(package.isCollaboratedOnByUser).to.equal(false);
      var $ = cheerio.load(resp.result)
      expect($(".secondary-nav")).to.have.length(0);
      done();
    });
  });


});
