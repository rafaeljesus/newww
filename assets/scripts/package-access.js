var templates = {
  collaborator: require("../../templates/partials/collaborator.hbs"),
}

module.exports = function() {
  $(function(){
    enableAdminControls()
    $('#add-collaborator').submit(addCollaborator)
  })
}

var addCollaborator = function(e) {
  e.preventDefault()

  var collaborator = {}
  $(this).serializeArray().forEach(function(input){
    collaborator[input.name] = input.value;
  })

  var opts = {
    method: $(this).attr("method"),
    url: $(this).attr("action"),
    data: {collaborator: collaborator},
    headers: {'x-csrf-token': window.crumb},
    json: true
  }

  $.ajax(opts)
    .done(function(data){
      // console.log(data, templates.collaborator(data.collaborator))
      $("tr.collaborator:last").after(templates.collaborator(data.collaborator))
      enableAdminControls()
      resetNewCollaboratorForm()
    })
    .error(function(){
      console.error(arguments)
    })
}

var enableAdminControls = function() {
  $("[data-enable-permission-togglers='true'] input")
    .attr('disabled', false)

  $("[data-enable-deletion='true'] form.remove-collaborator")
    .css({display: "block"})
}

var resetNewCollaboratorForm = function() {
  $("#add-collaborator input[name='name']").val("")
}
