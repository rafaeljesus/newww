var tap = require('tap');
var urlOf = require('./lib/url');
var fillStripeForm = require('./lib/fillStripeForm');

var P = require('bluebird');

require('./lib/sharedNemo').then(function(nemo) {
  tap.test("Pay for one month of who's hiring", {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/joinwhoshiring')).then(() => t.pass('loaded page'))
      .then(() => nemo.view.joinwhoshiring.oneMonthLink().click().then(() => t.pass('clicked form')))
      .then(() => P.all([
          fillStripeForm(t, nemo).then(function() {
            return nemo.view.joinwhoshiring.successTextWaitVisible().then(() => t.pass('got success'));
          }).then(() => t.pass('form filled'))
        ]));
  });

  tap.test("Pay for three months of who's hiring", {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/joinwhoshiring')).then(() => t.pass("pay for three months of who's hiring"))
      .then(() => nemo.view.joinwhoshiring.threeMonthsLink().click().then(() => t.pass))
      .then(() => P.all([
          fillStripeForm(t, nemo).then(() => nemo.view.joinwhoshiring.successTextWaitVisible()).then(() => t.pass)
        ]));
  });

  tap.test('close driver', function(t) {
    if (!module.parent) {
      nemo.driver.quit();
    }
    t.end();
  });

});
