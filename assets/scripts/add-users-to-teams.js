var template = function(user) {
  if (typeof user === "string") {
    user = {
      name: user
    };
  }
  var username = user.name || "";
  var role = user.role || "";

  return "<li data-name='" + username + "'>" +
    "<span class='name'><a href='/~" +
    username +
    "'>" +
    username +
    "</a></span>" +
    "<span class='role'>" + role + "</span>" +
    "<button type='button' class='delete-user icon-x'>" +
    "<span class='a11y-only'>Remove User " +
    username +
    "</span></button>" +
    "<input type='hidden' name='member' value='" +
    username + "' />";

};

var getTeamUsers = function(orgName, teamName) {
  var url = "/org/" + orgName + "/team/" + teamName + "/user";

  var opts = {
    method: "GET",
    url: url,
    json: true,
    data: {}
  };

  if (window && window.crumb) {
    opts.data.crumb = window.crumb;
    opts.headers = {
      'x-csrf-token': window.crumb
    };
  }

  return $.ajax(opts);
};

var getUser = function(orgName, user) {
  var url = "/org/" + orgName + "/user";

  var opts = {
    method: "GET",
    url: url,
    json: true,
    data: {
      member: user
    }
  };

  if (window && window.crumb) {
    opts.data.crumb = window.crumb;
    opts.headers = {
      'x-csrf-token': window.crumb
    };
  }

  return $.ajax(opts);
};

var AddUserForm = function(form) {
  this.$el = form;
  this.selectMenu = this.$el.find("[name=teams]");
  this.membersList = $(".members-list");
  this.memberCount = 0;

  var action = this.$el.attr("action");
  var actionArr = action.split("/");

  if (actionArr.length === 5) {
    this.orgScope = actionArr[2];
    this.teamName = actionArr[4];
  }
};


AddUserForm.prototype.removeUser = function(username) {
  $("[data-name=" + username + "]").remove();
  this.memberCount--;
  this.updateMemberCount();
};

AddUserForm.prototype.removeAll = function() {
  this.membersList.empty();
  this.memberCount = 0;
  this.updateMemberCount();
};

AddUserForm.prototype.updateMemberCount = function() {
  $(".add-count .add-number").text(this.memberCount);
  if (this.memberCount === 1) {
    $(".add-count .unit").text("User");
  } else {
    $(".add-count .unit").text("Users");
  }
};

AddUserForm.prototype.addUsers = function(users) {
  var list = users.map(function(user) {
    return template(user);
  }).join("");
  this.membersList.append(list);
  this.memberCount = users.length;
  this.updateMemberCount();
};

AddUserForm.prototype.notify = function(notification) {
  $(".notice").remove();
  var html = "<div class='notice'>" + notification + "</div>";
  $(".container.content").prepend(html);
};

module.exports = function() {
  $(function() {
    var form = $("#add-user-to-team-form");
    var auf = new AddUserForm(form);

    var addBtn = $("#add-member-to-list");

    addBtn.on("click", function() {
      var group = $(this).closest("fieldset");
      var username = group.find("[name=member]").val();
      if (!username) {
        return;
      }
      auf.addUsers([
        {
          name: username
        }
      ]);
      group.find("[name=member]").val("");

      var message = "";
      return getUser(auf.orgScope, username)
        .fail(function(obj) {
          if (obj.status === 404) {
            message = "User " + username + " is not a member of this Org, please add them";
          } else if (obj.status < 500) {
            message = obj.responseJSON && obj.responseJSON.error;
          } else {
            message = "An internal error occurred";
          }
          auf.notify(message);
          return auf.removeUser(username);
        });
    });

    auf.selectMenu.on("change", function() {
      var teamName = this.options[this.selectedIndex].value;
      if (teamName === "_none_") {
        return;
      }

      return getTeamUsers(auf.orgScope, teamName)
        .done(function(users) {
          auf.removeAll();
          return auf.addUsers(users);
        })
        .fail(function(response) {
          console.log(response);
        });
    });

    auf.$el.find("[type=submit]").on("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      $("#add-member-input")
        .val("")
        .attr("disabled", "disabled");

      auf.$el.submit();
    });

    auf.$el.on("click", ".delete-user", function(e) {
      var username = $(e.target).closest("[data-name]").data("name");

      auf.removeUser(username);
    });



  });
};
