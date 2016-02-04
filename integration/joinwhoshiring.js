var tap = require('tap');
var urlOf = require('./lib/url');
var fillStripeForm = require('./lib/fillStripeForm');

require('./lib/sharedNemo').then(function(nemo) {
  tap.test("Pay for one month of who's hiring", {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/joinwhoshiring'))
      .then(() => t.pass('loaded page'))
      .then(() => nemo.view.joinwhoshiring.oneMonthLink().click())
      .then(() => t.pass('clicked form'))
      .then(() => fillStripeForm(t, nemo))
      .then(() => t.pass('form filled'))
      .then(() => nemo.view.joinwhoshiring.successTextWaitVisible(30000))
      .then(() => t.pass('Signed up for one month'))
  });

  tap.test("Pay for three months of who's hiring", {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/joinwhoshiring'))
      .then(() => t.pass("pay for three months of who's hiring"))
      .then(() => nemo.view.joinwhoshiring.threeMonthsLink().click())
      .then(() => t.pass('clicked form'))
      .then(() => fillStripeForm(t, nemo))
      .then(() => t.pass('form filled'))
      .then(() => nemo.view.joinwhoshiring.successTextWaitVisible(30000))
      .then(() => t.pass("Signed up for three months"))
  });

  tap.test('close driver', function(t) {
    if (!module.parent) {
      nemo.driver.quit();
    }
    t.end();
  });

});
