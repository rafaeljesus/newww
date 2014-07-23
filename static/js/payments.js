$(document).ready(function () {

  var amount;

  var handler = StripeCheckout.configure({
    key: $('input[type=hidden]').data('key'),
    image: '/static/img/logos/n-64.png',
    token: function(token, args) {
      token.amount = amount;
      token.crumb = $('input[name=crumb]').val();

      $.ajax({
        url: '/joinwhoshiring',
        data: token,
        type: 'POST'
      })
      .done(function (resp) {
        $('section').hide();
        $('h1:last').after('<h2 style="color: green;">Thank you for your payment! We\'ll get back to you soon.</h2>');
      })
      .error(function (resp) {
        $('section').hide();
        $('h1:last').after('<h2 style="color: red;">Something went wrong. Please contact us at <a href="mailto:whoshiring@npmjs.com">whoshiring@npmjs.com</a>.</h2>');
      })
    }
  });

  $('#one-month').click(function (e) {
    amount = 35000;

    handler.open({
      name: 'npm, Inc.',
      description: "Pay $350 for 1 month of advertising",
      amount: amount
    });
    e.preventDefault();
  });

  $('#three-months').click(function (e) {
    amount = 100000

    handler.open({
      name: 'npm, Inc.',
      description: "Pay $1000 for 3 months of advertising",
      amount: amount
    });
    e.preventDefault();
  });
});