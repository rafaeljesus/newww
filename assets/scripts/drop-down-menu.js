$ = require('jquery');

var DropDownMenu = function($el) {
  this.menu = $el;
  this.id = this.menu.attr('id');

  this.menuToggle = $('a[href="#' + this.id + '"]');

  this.menuOverlay = $('.drop-down-menu-overlay[data-drop-down-menu="' + this.id + '"]');
};

DropDownMenu.prototype.close = function() {
  history.pushState({}, '', window.location.pathname);
  this.menu.addClass('hidden').removeClass('visible');
  this.menuOverlay.removeClass('visible');
};

DropDownMenu.prototype.open = function() {
  history.pushState({}, '', window.location.pathname + this.menuToggle.attr('href'));
  this.menu.addClass('visible').removeClass('hidden');
  this.menuOverlay.addClass('visible');
};

DropDownMenu.prototype.addListeners = function() {
  var self = this;

  this.menuToggle.on('click', function(e) {
    e.preventDefault();

    if (self.menu.is(':visible')) {
      self.close();
    } else {
      self.open();
    }
  });

  this.menuOverlay.on('click', function() {
    self.close();
  });
};

module.exports = function() {
  $(function() {

    $.each($('.drop-down-menu'), function(idx, el) {
      var ddm = new DropDownMenu($(el));

      ddm.addListeners();

      // in case you need to refresh while the menu is open
      if (window.location.hash === '#' + ddm.id) {
        ddm.open();
      }

      // for android users and anyone who likes to press the browser navigation buttons
      $(window).on('hashchange', function() {

        if (window.location.hash === '') {
          ddm.close();
        }

        if (window.location.hash === '#' + ddm.id) {
          ddm.open();
        }
      });
    });


  });
};