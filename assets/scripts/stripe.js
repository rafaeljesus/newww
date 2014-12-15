var $ = require("jquery");
var dataEl;
var stripePublicKey;

module.exports = function() {
  $(handleBillingForm)
}

var noKey = function() {
  console.error("No element found with data-stripe-public-keys attribute");
}

var handleBillingForm = function() {

  // External stripe scripts are not loaded on all pages
  if (typeof Stripe === "undefined") return;

  try {
    stripePublicKey = $("#billing-form").data('stripePublicKey');
  } catch(e) {
    return noKey();
  }

  if (!stripePublicKey) {
    return noKey();
  }

  console.log("stripePublicKey", stripePublicKey)

  Stripe.setPublishableKey(stripePublicKey);

  var stripeResponseHandler = function() {
    console.log(arguments)
  }

  $('#billing-form').submit(function(event) {
    var $form = $(this);

    console.log("submitting")

    // Disable the submit button to prevent repeated clicks
    $form.find('input[type=submit]').prop('disabled', true);

    Stripe.card.createToken($form, stripeResponseHandler);

    console.log("submitted")

    // Prevent the form from submitting with the default action
    return false;
  });

}
