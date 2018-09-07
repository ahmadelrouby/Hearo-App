String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function fetchFiles(user, repo) {
    $.ajax({
        url: "sample.txt",
        beforeSend: function( xhr ) {
        xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
    }
    }).done(function( data ) {
        var output = data.replaceAll("\n", "<br />");

        $("#repository").html("<b>Retrieved data:</b><br />" + output );
    }).fail(function() {
        alert("Failed to load!");
    });
}

function checkForFiles() {
    fetchFiles("karim", "");
}

$(document).ready(function(e) {
    checkForFiles();
    var loop = setInterval(checkForFiles, 600);
});