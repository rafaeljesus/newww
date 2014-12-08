var $ = require("jquery")

module.exports = function() {
  $(handleBillingForm)
}

var handleBillingForm = function() {

  // External stripe scripts are not loaded on all pages
  if (typeof Stripe === "undefined") return;

  console.log("Stripe", Stripe)

  var stripeResponseHandler = function() {
    console.log(arguments)
  }

  $('#billing-form').submit(function(event) {
    var $form = $(this);

    // Disable the submit button to prevent repeated clicks
    // $form.find('input[type=submit]').prop('disabled', true);

    // Stripe.card.createToken($form, stripeResponseHandler);

    // Prevent the form from submitting with the default action
    return false;
  });

}
