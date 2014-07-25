// a weighted randomizer for showing who's hiring in the npm nav

var deck = require('deck'),
    Hapi = require('hapi');

var whos_hiring = require('../../static/whos_hiring.json');

exports.register = function (service, options, next) {

  service.method('hiring.getAllWhosHiring', hiring(true));
  service.method('hiring.getRandomWhosHiring', hiring(false));

  next();
}

exports.register.attributes = {
  pkg: require('./package.json')
};

// ====== functions ======

function hiring (showAll) {
  // we don't actually want to make this into a callback, but Hapi won't let us do it otherwise...
  return function (next) {
    var weights = {},
        numCompanies = 0;

    for (var k in whos_hiring) {
      numCompanies++;
      weights[k] = whos_hiring[k].show_weight;
    }

    if (showAll) {
      var order = deck.shuffle(weights),
          companies = order.map(function (c) { return whos_hiring[c]});
      return companies;
    }

    var company = whos_hiring[deck.pick(weights)];
    company.numExtraCompanies = numCompanies - 1;
    return company;
  }
}