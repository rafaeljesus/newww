module.exports = function() {
  var className = ".tab";

  var Tab = function(element, opts) {
    opts = opts || {};

    this.element = element;
    this.$element = $(element);
    this.tabNav = $(".tabs [href='#" + element.id + "']");
    this.isOpen = false;
    this.siblings = $(className).not(this.$element);
    this.$element.data("tab", this);

    this.init();
  };

  Tab.prototype.init = function() {
    if (this.tabNav.parent("li").hasClass("current")) {
      this.open();
    } else {
      this.close();
    }
  };

  Tab.prototype.open = function() {
    this.$element.removeClass("hidden");
    this.$element.addClass("visible");
    this.isOpen = true;
    $(".tabs .current").removeClass("current");
    this.tabNav.addClass("current");

    $.each(this.siblings, function(idx, el) {
      var tab = $(el).data("tab");
      if (tab) {
        tab.close();
      }
    });
  };

  Tab.prototype.close = function() {
    this.$element.removeClass("visible");
    this.$element.addClass("hidden");
    this.isOpen = false;
  };

  Tab.prototype.toggle = function() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  };

  $(function() {
    $(window)[0].scrollTo(0, 0);


    var tabs = $(className);
    $.each(tabs, function(idx, el) {
      var tab = new Tab(el);

      tab.tabNav.on("click", function(e) {
        e.preventDefault();
        tab.open();
        location.hash = $(this).attr('href');
        $(window)[0].scrollTo(0, 0);
      });
    });

    if ($(".tabs .current").attr("href") !== location.hash) {
      var tab = $(location.hash).data('tab');
      tab.open();
    }

    $(window).on("hashchange", function(e) {
      if ($(".tabs .current").attr("href") !== location.hash) {
        var tab = $(location.hash).data('tab');
        tab.open();
      }
    });

  });


};
