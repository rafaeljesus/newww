var tmp = require("../templates/team-package.hbs");

var template = function(pkg) {
  if (typeof pkg === "string") {
    pkg = {
      name: pkg,
      permissions: 'write'
    };
  }

  return tmp({
    pkgname: pkg.name || "",
    canWrite: pkg.permissions === "write"
  });
};

var getTeamPackages = function(orgName, teamName) {
  var url = "/org/" + orgName + "/team/" + teamName + "/package";

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

var getPackage = function(orgName, pkg) {
  var url = "/org/" + orgName + "/package";

  var opts = {
    method: "GET",
    url: url,
    json: true,
    data: {
      name: pkg
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

var AddPackageForm = function(form) {
  this.$el = form;
  this.selectMenu = this.$el.find("[name=teams]");
  this.pkgsList = $(".packages-list");
  this.packageCount = 0;

  var action = this.$el.attr("action");
  var actionArr = action.split("/");

  this.orgScope = actionArr[2];
  if (actionArr.length === 5) {
    this.teamName = actionArr[4];
  }
};


AddPackageForm.prototype.removePackage = function(packageName) {
  $('[data-name="' + packageName + '"]').remove();
  this.packageCount--;
  this.updatePackageCount();
};

AddPackageForm.prototype.removeAll = function() {
  this.pkgsList.empty();
  this.packageCount = 0;
  this.updatePackageCount();
};

AddPackageForm.prototype.updatePackageCount = function() {
  $(".add-count .add-number").text(this.packageCount);
  if (this.packageCount === 1) {
    $(".add-count .unit").text("Package");
  } else {
    $(".add-count .unit").text("Packages");
  }
};

AddPackageForm.prototype.addPackages = function(packages) {
  var pkgs = packages.items || packages;

  var list = pkgs.map(function(pkg) {
    return template(pkg);
  }).join("");
  this.pkgsList.append(list);
  this.packageCount = pkgs.length;
  this.updatePackageCount();
};

AddPackageForm.prototype.notify = function(notification) {
  $(".notice").remove();
  var html = "<div class='notice'>" + notification + "</div>";
  $(".container.content").prepend(html);
};

module.exports = function() {
  $(function() {
    var form = $("[data-form-function=add-package-to-team]");

    if (form.length) {
      var auf = new AddPackageForm(form);

      var addBtn = $("#add-package-to-list");

      addBtn.on("click", function() {
        var group = $(this).closest("fieldset");
        var packageName = group.find("[name=package]").val();
        if (!packageName) {
          return;
        }
        auf.addPackages([
          {
            name: packageName
          }
        ]);
        group.find("[name=pkg]").val("");

        var message = "";
        return getPackage(auf.orgScope, packageName)
          .fail(function(obj) {
            if (obj.status === 404) {
              message = "User " + packageName + " is not a pkg of this Org, please add them";
            } else if (obj.status < 500) {
              message = obj.responseJSON && obj.responseJSON.error;
            } else {
              message = "An internal error occurred";
            }
            auf.notify(message);
            return auf.removePackage(packageName);
          });
      });

      auf.selectMenu.on("change", function() {
        var teamName = this.options[this.selectedIndex].value;
        if (teamName === "_none_") {
          return;
        }

        return getTeamPackages(auf.orgScope, teamName)
          .done(function(pkgs) {
            auf.removeAll();
            return auf.addPackages(pkgs);
          })
          .fail(function() {
            auf.notify("An error occurred while populating the list");
          });
      });

      auf.$el.find("[type=submit]").on("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        $("#add-pkg-input")
          .val("")
          .attr("disabled", "disabled");

        auf.$el.submit();
      });

      auf.$el.on("click", ".delete-package", function(e) {
        var packageName = $(e.target).closest("[data-name]").data("name");

        auf.removePackage(packageName);
      });

      auf.$el.on("click", ".remove-all-pkgs", function() {
        console.log('boom')
        auf.removeAll();
      });
    }
  });
};
