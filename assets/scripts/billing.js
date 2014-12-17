var $ = require("jquery");
var dataEl;
var stripePublicKey;

module.exports = function() {
  $(init)
}

var noKey = function() {
  console.error("No element found with data-stripe-public-keys attribute");
}

var init = function() {

  // External stripe scripts are not loaded on all pages
  if (typeof Stripe === "undefined") return;

  try {
    stripePublicKey = $("#payment-form").data('stripePublicKey');
  } catch(e) {
    return noKey();
  }

  if (!stripePublicKey) {
    return noKey();
  }

  Stripe.setPublishableKey(stripePublicKey);
  $('#payment-form').submit(onSubmit);
}

var onSubmit = function(e) {
  var $form = $('#payment-form');
  var formData = {
    number: $('#card-number').val(),
    cvc: $('#card-cvc').val(),
    exp_month: $('#card-exp-month').val(),
    exp_year: $('#card-exp-year').val()
  };

  console.log("formData", formData);

  // Disable the submit button to prevent repeated clicks
  $form.find('input[type=submit]').prop('disabled', true);

  Stripe.card.createToken(formData, stripeResponseHandler);

  // Prevent the form from submitting
  return false;
}

var stripeResponseHandler = function(status, response) {
  console.log(response)
  var $form = $('#payment-form');

  if (response.error) {
    $('.billing-error')
      .text(response.error.message)
      .show();
    $form.find('input[type=submit]').prop('disabled', false);
    return;
  }

  var token = response.id;
  $form.append($('<input type="hidden" name="stripeToken" />').val(response.id));
  // $form.get(0).submit();
}
