module.exports = function() {
  $(function() {
    $(document).on("click", '#cancel-subscription-toggler', function() {
      $("#cancel-subscription").toggle()
      $("#payment-form").hide()
      return false;
    })

    $(document).on("click", '#update-subscription-toggler', function() {
      $("#cancel-subscription").hide()
      $("#payment-form").toggle()
      return false;
    })

  })
}
