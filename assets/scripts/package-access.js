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

  // make it hard for users to demote themselves to read-only access
  if (
    opts.data.collaborator.permissions === "read"
    && opts.data.collaborator.name === $("[data-user-name]").data('userName')
  ) {
    var confirmation = "Are you sure you want to set your own access level to read-only?"
    if (!confirm(confirmation)) return false;
  }

  $.ajax(opts)
    .done(updateInputsAndHandlers)
    .fail(errorHandler)
}

var removeCollaborator = function(e) {
  e.preventDefault()
  var $form = $(this)

  // make it hard for users to remove themselves
  var removingSelf = $("[data-user-name]").data('userName') === $form.data('collaboratorName')
  var confirmation = "Are you sure you want to remove yourself from this package?"
  if (removingSelf && !confirm(confirmation)) return false;

  // hide the element right away for that snappy feel
  $form.parents(".collaborator").remove()

  $.ajax(formToRequestObject($form))
    .done(function(){
      if (removingSelf) {
        return window.location = $form.data('packageUrl') + "?removed-self-from-collaborators"
      }
      updateInputsAndHandlers()
    })
    .fail(errorHandler)
}

var togglePackageAccess = function(e) {
  e.preventDefault()
  var $checkbox = $(this)
  var $form = $checkbox.parents("form")
  var private = $checkbox.prop("checked")

  if (!private) {
    var confirmation = "This will make your package world-readable"
    var $readOnlyInputs = $("[type=radio][name='collaborator.permissions'][value='read']:checked")
    if ($readOnlyInputs.length) confirmation += " and will remove the read-only collaborators"
    confirmation += ". Are you sure?"

    if (!confirm(confirmation)) {
      $checkbox.prop("checked", true)
      return false
    }

    $readOnlyInputs.parents(".collaborator").remove()
  }

  var opts = formToRequestObject($form)
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
