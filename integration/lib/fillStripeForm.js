var P = require('bluebird');

module.exports = function fillStripeForm(t, nemo) {
  return nemo.view.stripeCheckout.frame().then(function() {
    return nemo.view.stripeCheckout.frame();
  }).then(function(el) {
    return nemo.driver.switchTo().frame(el).then(() => t.pass('switched frame'));
  }).then(function() {
    return P.all([
      nemo.view.joinwhoshiring.emailWaitVisible().sendKeys('test' + Date.now() + '@npmjs.com').then(t.pass),
      nemo.view.joinwhoshiring.cardNumber().sendKeys('4242')
        .then(() => nemo.view.joinwhoshiring.cardNumber().sendKeys('4242'))
        .then(() => nemo.view.joinwhoshiring.cardNumber().sendKeys('4242'))
        .then(() => nemo.view.joinwhoshiring.cardNumber().sendKeys('4242'))
        .then(() => t.pass('entered cc number')),
      nemo.view.joinwhoshiring.ccExp().sendKeys('12')
        .then(() => nemo.view.joinwhoshiring.ccExp().sendKeys('16'))
        .then(() => t.pass('entered exp date')),
      nemo.view.joinwhoshiring.cvc().sendKeys('513'),
      nemo.view.joinwhoshiring.submit().click().then(() => t.pass('submitted payment'))
    ]).then(function() {
      nemo.driver.switchTo().defaultContent();
    });
  });
};
