var tap = require('tap');
var urlOf = require('./lib/url');
var pass = require('./lib/pass');
var P = require('bluebird');

require('./lib/sharedNemo').then(function(nemo) {
  require('./signup');

  tap.test('sign up for private modules ', {
    bail: true
  }, function(t) {
    return nemo.driver.get(urlOf('/settings/billing/subscribe'))
      .then(() => nemo.view.billing.cardNumberWaitVisible())
      .then(() => t.pass("card number field is visible"))
      .then(() => nemo.view.billing.cardNumber().sendKeys("4242424242424242"))
      .then(() => t.pass("sent account number"))
      .then(() => nemo.view.billing.cardExpMonth().sendKeys("12"))
      .then(() => t.pass("sent month"))
      .then(() => nemo.view.billing.cardExpYear().sendKeys("2016"))
      .then(() => t.pass("sent year"))
      .then(() => nemo.view.billing.cardCVC().sendKeys("513"))
      .then(() => t.pass("sent cvv"))
      .then(() => nemo.view.billing.submit().click())
      .then(() => t.pass("submitted form"))
      .then(() => nemo.view.billing.noticeWaitVisible(30000))
      .then(() => t.pass("found notice"))
      .then(function() {
        if (!module.parent) {
          return nemo.driver.quit();
        }
      })
  });
});
