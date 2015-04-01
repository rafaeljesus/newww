var template = require("../../templates/partials/collaborator.hbs");
var formToRequestObject = require("./form-to-request-object")

module.exports = function() {
  $(updateInputsAndHandlers)
}

var updateInputsAndHandlers = function() {
  $('#add-collaborator')
    .unbind("submit", addCollaborator)
    .bind("submit", addCollaborator)

  $('.update-collaborator input')
    .unbind("change", updateCollaborator)
    .bind("change", updateCollaborator)

  $('.remove-collaborator')
    .unbind("submit", removeCollaborator)
    .bind("submit", removeCollaborator)

  $('#package-access-toggle')
    .unbind("change", togglePackageAccess)
    .bind("change", togglePackageAccess)

  // enable/disable permission togglers
  $("input[type=radio][name='collaborator.permissions']")
    .attr('disabled', !$("#collaborators").data("enablePermissionTogglers"))

  // Reveal delete links
  if ($("#collaborators").data("enableDeletion")) {
    $("form.remove-collaborator").css({display: "block"})
  }

  // Clear the 'add' input
  $("#add-collaborator input[name='collaborator.name']").val("")
}

var addCollaborator = function(e) {
  e.preventDefault()
  $.ajax(formToRequestObject($(this)))
    .done(function(data){
      console.log("done", data)
      if (data.collaborator) {
        $("tr.collaborator:last").after(template(data.collaborator))
        updateInputsAndHandlers()
      }
    })
    .fail(errorHandler)
}

var updateCollaborator = function(e) {
  e.preventDefault()
  var $form = $(this).parents("form")
  var opts = formToRequestObject($form)
  $.ajax(opts)
    .done(updateInputsAndHandlers)
    .fail(errorHandler)
}

var removeCollaborator = function(e) {
  e.preventDefault()
  $(this).parents(".collaborator").remove()
  $.ajax(formToRequestObject($(this)))
    .done(updateInputsAndHandlers)
    .fail(errorHandler)
}

var togglePackageAccess = function(e) {
  e.preventDefault()
  var private = $(this).prop("checked")

  if (!private) {
    var $readOnlyInputs = $("[type=radio][name='collaborator.permissions'][value='read']:checked")

    var confirmation = "This will make your package world-readable"
    if ($readOnlyInputs.length) confirmation += " and will remove the read-only collaborators"
    confirmation += ". Are you sure?"

    if (!confirm(confirmation)) {
      $(this).prop("checked", true)
      return false;
    }

    $readOnlyInputs.parents(".collaborator").remove()
  }

  var opts = formToRequestObject($(this).parents("form"))
  opts.data.package = {private: private}

  $("#collaborators").data("enablePermissionTogglers", private)

  updateInputsAndHandlers()
  $.ajax(opts)
    .done(updateInputsAndHandlers)
    .fail(errorHandler)
}

 var errorHandler = function(xhr, status, error) {
   console.error(xhr, status, error)
   $("p.error").text(xhr.responseJSON.message || error).show()
 }
