var $ = require("jquery");

module.exports = function () {

  if (typeof StripeCheckout === 'undefined') {
    console.log("No stripe")
    return;
  }

  $(function () {

    console.log("ready to enterprise license")

    var amount;

    var handler = StripeCheckout.configure({
      key: $('input[type=hidden]').data('key'),
      image: '/static/images/n-64.png',
      token: function(token, args) {
        token.amount = amount;
        token.crumb = $('input[name="crumb"]').val();

        $.ajax({
          url: '/enterprise/license',
          beforeSend: function(xhr) {
            xhr.setRequestHeader('X-CSRF-Token', $('input[name="crumb"]').val())
          },
          data: token,
          type: 'POST',
          headers: {'x-csrf-token': $('input[name="crumb"]').val()}
        })
        .done(function (resp) {
          $('section').hide()
          $('h1:last').after('<h2 style="color: green;">Thank you for your payment! We\'ll get back to you soon.</h2>')
        })
        .error(function (resp) {
          $('section').hide()
          $('h1:last').after('<h2 style="color: red;">Something went wrong. Please contact us at <a href="mailto:whoshiring@npmjs.com">whoshiring@npmjs.com</a>.</h2>')
        })
      }
    });

    $('#buy-multi-seat').click(function (e) {
      var seatString = $('#multi-seat-count').val()
      if (!seatString) {
        alert("You must enter a number of seats")
        e.preventDefault()
        return false
      }
      var seats = parseInt(seatString)
      amount = 2000 * seats;

      handler.open({
        name: 'npm, Inc.',
        description: "Buy " + seats + " seat license, billed monthly",
        amount: amount
      });
      e.preventDefault()
    });


  })
}
