var template = require("../../templates/partials/collaborator.hbs");

module.exports = function() {
  $(updateInputsAndHandlers)
}

var updateInputsAndHandlers = function() {
  $('#add-collaborator').submit(addCollaborator)
  $('.update-collaborator input').change(updateCollaborator)
  $('.remove-collaborator').submit(removeCollaborator)
  $("[data-enable-permission-togglers='true'] input").attr('disabled', false)
  $("[data-enable-deletion='true'] form.remove-collaborator").css({display: "block"})
  $("#add-collaborator input[name='name']").val("")
}

var addCollaborator = function(e) {
  e.preventDefault()
  var opts = formToRequestOptions($(this))
  opts.data = {collaborator: formToObject($(this))}

  $.ajax(opts)
    .done(function(data){
      $("tr.collaborator:last").after(template(data.collaborator))
    })
    .done(successHandler)
    .fail(errorHandler)
}

var updateCollaborator = function(e) {
  e.preventDefault()
  var $form = $(this).parents("form")
  var opts = formToRequestOptions($form)
  opts.data = {
    collaborator: formToObject($form),
    crumb: window.crumb
  }
  $.ajax(opts)
    .done(successHandler)
    .fail(errorHandler)
}

var removeCollaborator = function(e) {
  e.preventDefault()
  var opts = formToRequestOptions($(this))
  $.ajax(opts)
    .done(function(data){
      $("#collaborator-"+data.username).slideUp()
    })
    .done(successHandler)
    .fail(errorHandler)
}

var formToRequestOptions = function($el) {
  return {
    method: $el.attr("method"),
    url: $el.attr("action"),
    headers: {'x-csrf-token': window.crumb},
    json: true
  }
}

var formToObject = function($el) {
  var obj = {}
  $el.serializeArray().forEach(function(input){
    obj[input.name] = input.value
  })
  return obj
}

 var errorHandler = function(xhr, status, error) {
   console.error(error)
   $("p.error").text(error).show()
 }

 var successHandler = function(data) {
   console.log(data)
   updateInputsAndHandlers()
 }
