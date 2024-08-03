(function ($) {
  "use strict";
  $(function () {
    $(".nav-settings").on("click", function () {
      $("#right-sidebar").toggleClass("open");
    });
    $(".settings-close").on("click", function () {
      $("#right-sidebar,#theme-settings").removeClass("open");
    });

    $("#settings-trigger").on("click", function () {
      $("#theme-settings").toggleClass("open");
    });

    // Background constants
    var navbar_classes =
      "navbar-danger navbar-success navbar-warning navbar-dark navbar-light navbar-primary navbar-info navbar-pink";
    var sidebar_classes = "sidebar-light sidebar-dark";
    var $body = $("body");

    // Sidebar backgrounds
    $("#sidebar-light-theme").on("click", function () {
      $body.removeClass(sidebar_classes);
      $body.addClass("sidebar-light");
      $(".sidebar-bg-options").removeClass("selected");
      $(this).addClass("selected");
    });
    $("#sidebar-dark-theme").on("click", function () {
      $body.removeClass(sidebar_classes);
      $body.addClass("sidebar-dark");
      $(".sidebar-bg-options").removeClass("selected");
      $(this).addClass("selected");
    });

    // Navbar Backgrounds
    $(".tiles.primary").on("click", function () {
      $(".navbar").removeClass(navbar_classes);
      $(".navbar").addClass("navbar-primary");
      $(".tiles").removeClass("selected");
      $(this).addClass("selected");
    });
    $(".tiles.success").on("click", function () {
      $(".navbar").removeClass(navbar_classes);
      $(".navbar").addClass("navbar-success");
      $(".tiles").removeClass("selected");
      $(this).addClass("selected");
    });
    $(".tiles.warning").on("click", function () {
      $(".navbar").removeClass(navbar_classes);
      $(".navbar").addClass("navbar-warning");
      $(".tiles").removeClass("selected");
      $(this).addClass("selected");
    });
    $(".tiles.danger").on("click", function () {
      $(".navbar").removeClass(navbar_classes);
      $(".navbar").addClass("navbar-danger");
      $(".tiles").removeClass("selected");
      $(this).addClass("selected");
    });
    $(".tiles.light").on("click", function () {
      $(".navbar").removeClass(navbar_classes);
      $(".navbar").addClass("navbar-light");
      $(".tiles").removeClass("selected");
      $(this).addClass("selected");
    });
    $(".tiles.info").on("click", function () {
      $(".navbar").removeClass(navbar_classes);
      $(".navbar").addClass("navbar-info");
      $(".tiles").removeClass("selected");
      $(this).addClass("selected");
    });
    $(".tiles.dark").on("click", function () {
      $(".navbar").removeClass(navbar_classes);
      $(".navbar").addClass("navbar-dark");
      $(".tiles").removeClass("selected");
      $(this).addClass("selected");
    });
    $(".tiles.default").on("click", function () {
      $(".navbar").removeClass(navbar_classes);
      $(".tiles").removeClass("selected");
      $(this).addClass("selected");
    });

    // Content settings
    const contentContainer = $("#content");
    const cardElement = $(".card");

    // Font family
    $("#font-family-selector").on("change", function () {
      const fontFamily = $(this).val();
      contentContainer.css("font-family", fontFamily);
    });

    // Font size
    $(".font-size-btn").on("click", function () {
      const size = $(this).data("size");
      let fontSize, headingSize;
      switch (size) {
        case "small":
          fontSize = "14px";
          headingSize = "18px";
          break;
        case "medium":
          fontSize = "16px";
          headingSize = "20px";
          break;
        case "large":
          fontSize = "18px";
          headingSize = "24px";
          break;
        default:
          fontSize = "16px";
          headingSize = "20px";
      }
      contentContainer.find("p").css("font-size", fontSize);
      contentContainer
        .find("h1, h2, h3, h4, h5, h6")
        .css("font-size", headingSize);
      contentContainer.find("blockquote, ul, ol").css("font-size", fontSize);
    });

    // Background color
    $(".bg-color-tile").on("click", function () {
      const backgroundColor = $(this).data("color");
      cardElement.css("background-color", backgroundColor);
      $(".bg-color-tile").removeClass("selected");
      $(this).addClass("selected");
    });

    // Reset settings
    $("#reset-settings").on("click", function () {
      contentContainer.css({
        "font-family": "",
        "font-size": "",
      });
      contentContainer
        .find("p, h1, h2, h3, h4, h5, h6, blockquote, ul, ol")
        .css("font-size", "");
      cardElement.css("background-color", "");
      $("#font-family-selector").val("Arial");
      $(".font-size-btn[data-size='medium']").click();
      $(".bg-color-tile[data-color='#ffffff']").click();
    });
  });
})(jQuery);
