var crumb

module.exports = function() {
  $(function(){
    crumb = require("./crumb")()
    if (!crumb) return;
    $('#add-collaborator').submit(addCollaborator)
  })
}

var addCollaborator = function(e) {
  console.log("hi")
  var package = $(e.target).find("[name=package]").val()
  var collaborator = $(e.target).find("[name=collaborator]").val()
  var opts = {
    type: "PUT",
    url: "/package/" + package + "/collaborators",
    data: {
      collaborator: {
        name: collaborator,
        permissions: "read"
      }
    },
    headers: {'x-csrf-token': crumb},
  }

  console.log(opts)

  // $.ajax(opts)
  //   .done(onCollaboratorAdded)
  //   .error(onCollaboratorAddError)

  return false
}
