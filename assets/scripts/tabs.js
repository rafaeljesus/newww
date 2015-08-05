module.exports = function() {
  var className = ".tab";

  var Tab = function (element, opts) {
    opts = opts || {};

    this.element = element;
    this.$element = $(element);
    this.tabNav = $("[href='#" + element.id + "']");
    this.isOpen = false;
    this.siblings = $(className).not(this.$element);
    this.$element.data("tab", this);

    this.init();
  };

  Tab.prototype.init = function () {
    if (this.tabNav.parent("li").hasClass("current")) {
      this.open();
    } else {
      this.close();
    }
  };

  Tab.prototype.open = function () {
    this.$element.removeClass("hidden");
    this.$element.addClass("visible");
    this.isOpen = true;

    $.each(this.siblings, function (idx, el) {
      var tab = $(el).data( "tab" );
      console.log(tab);
      if(tab){
        tab.close();
      }
    });
  };

  Tab.prototype.close = function () {
    this.$element.removeClass("visible");
    this.$element.addClass("hidden");
    this.isOpen = false;
  };

  Tab.prototype.toggle = function () {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  };

  $(function() {
    var tabs = $(className);
    $.each( tabs, function (idx, el) {
      var tab = new Tab(el);

      tab.tabNav.on("click", function (e) {
        e.preventDefault();
        $(".tabs .current").removeClass("current");
        tab.tabNav.addClass("current");
        tab.open();
      });
    });
  });


};
