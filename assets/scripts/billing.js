var stripePublicKey;

module.exports = function() {
  // When the DOM is ready...
  $(init);
};

var noKey = function() {
  console.error("No element found with data-stripe-public-key attribute");
};

var init = function() {

  // External stripe scripts are not loaded on all pages
  if (typeof Stripe === "undefined") {
    return;
  }

  $('#enable-private-modules').click(function(e) {
    e.preventDefault();
    $('#info-private-modules').toggle();
  });

  $('#enable-orgs').click(function(e) {
    e.preventDefault();
    $('#info-orgs').toggle();
  });

  $('#add-billing-info').click(function(e) {
    e.preventDefault();
    $('#payment-form').toggle();
  });

  try {
    stripePublicKey = $("#payment-form").data('stripePublicKey');
  } catch (e) {
    return noKey();
  }

  if (!stripePublicKey) {
    return noKey();
  }

  Stripe.setPublishableKey(stripePublicKey);

  $('#payment-form').submit(onSubmit);
};

var onSubmit = function(e) {
  var $form = $('#payment-form');

  if (!$form.find('#card-number').length) {
    return true;
  }

  var formData = {
    number: $('#card-number').val(),
    cvc: $('#card-cvc').val(),
    exp_month: $('#card-exp-month').val(),
    exp_year: $('#card-exp-year').val()
  };

  // Disable submit button to prevent repeated clicks
  $form.find('input[type=submit]').prop('disabled', true);

  Stripe.card.createToken(formData, stripeResponseHandler);

  // Prevent the form from submitting
  return false;
};

var stripeResponseHandler = function(status, response) {
  var $form = $('#payment-form');

  if (response.error) {
    $('.billing-error')
      .text(response.error.message)
      .show();
    $form.find('input[type=submit]').prop('disabled', false);
    return;
  }

  // Inject generated token into form
  $form.append($('<input type="hidden" name="stripeToken" />').val(response.id));

  // Auto-submit the form
  $form.get(0).submit();
};
