function pageLoaded() {
    $("body").addClass("loaded");
    $(".loadingScreen").fadeOut(600);
}

$(window).on("load", function() {
    setTimeout(pageLoaded, 800);
});