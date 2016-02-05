var P = require('bluebird');

module.exports = function fillStripeForm(t, nemo) {
  return nemo.view.stripeCheckout.frame()
    .then(() => nemo.view.stripeCheckout.frame())
    .then(el => nemo.driver.switchTo().frame(el))
    .then(() => t.pass('switched frame'))
    .then(() => nemo.view.joinwhoshiring.emailWaitVisible().sendKeys('test' + Date.now() + '@npmjs.com'))
    .then(() => t.pass("entered email"))
    .then(() => nemo.view.joinwhoshiring.cardNumber().sendKeys('4242')
      .then(() => nemo.view.joinwhoshiring.cardNumber().sendKeys('4242'))
      .then(() => nemo.view.joinwhoshiring.cardNumber().sendKeys('4242'))
      .then(() => nemo.view.joinwhoshiring.cardNumber().sendKeys('4242'))
      .then(() => t.pass('entered cc number')))
    .then(() => nemo.view.joinwhoshiring.ccExp().sendKeys('12')
      .then(() => nemo.view.joinwhoshiring.ccExp().sendKeys('16'))
      .then(() => t.pass('entered exp date')))
    .then(() => nemo.view.joinwhoshiring.cvc().sendKeys('513'))
    .then(() => nemo.view.joinwhoshiring.submit().click())
    .then(() => t.pass('submitted payment'))
    .then(() => nemo.driver.switchTo().defaultContent())
};
