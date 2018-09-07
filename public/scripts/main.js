var settings = {showExtension: false,
<<<<<<< HEAD
                key: "xxxxxx",
                repo: "karimah"};
=======
                key: "karimio",
                repo: "Computer Science/Wide Area Networks/Lab 4"};
>>>>>>> parent of 721e744... UI Additions, Repo Fix

function switchTab(slide) {
    $("main").animate({left: (slide * -100)+"%"}, 200);
}

function switchTranslate() {
    switchTab(0);
    document.documentElement.className = "translate";
}

function switchCapture() {
    switchTab(1);
    document.documentElement.className = "capture";
}

function switchNotes() {
    switchTab(2);
    document.documentElement.className = "notes";
}

function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function handleError(error) {
    console.error('Reeeejected!', error);
}

var video = document.querySelector('video');
var canvas = document.querySelector("canvas");
var streaming = false;
var width = 320;
var height = 0;

video.addEventListener('canplay', function(ev){
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth/width);

      video.setAttribute('width', width);
      video.setAttribute('height', height);
      canvas.setAttribute('width', width);
      canvas.setAttribute('height', height);
      streaming = true;
    }
}, false);

function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to a typed array
    var ia = new Uint8Array(byteString.length);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ia], {type:mimeString});
}

function convertDataURIToBinary(dataURI) {
    var BASE64_MARKER = ';base64,';
    var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
    var base64 = dataURI.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));

    for(i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
}

function playSound(aud, src, data) {
    var binary= convertDataURIToBinary(data);
    var blob=new Blob([binary], {type : 'audio/ogg'});

    // var blob= new Blob([data], {type : 'audio/ogg'});
    var blobUrl = URL.createObjectURL(blob);

    src.attr("src", blobUrl);
    aud.pause();
    aud.load();
    aud.oncanplaythrough = aud.play();
}

var audio = $("#audio")[0];
var source = $("#source");

function takePicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
    }

    var dataURL = canvas.toDataURL('image/jpeg', 0.5);
    var blob = dataURItoBlob(dataURL);
    var fd = new FormData();
    fd.append("photo", blob);

    $.ajax({
        url: "capture",
        data: fd,
        type: 'POST',
        timeout: 3000,
        contentType: false,
        processData: false,
        cache: false
    }).done(function( data ) {
        if (data != "") {
            playSound(audio, source, data);
            //playSound(data);
        }
    }).fail(function() {
        // alert("Failed to load!");
    });

    setTimeout(takePicture, 500);
}

function setupCamera() {
    if (!hasGetUserMedia())
        alert("Cannot use Camera! Please use a modern browser!");

    var constraints = {
        audio: false,
        video: true
    };

    var mediaSource = new MediaSource();

    function handleSuccess(stream) {
        console.log('getUserMedia() got stream: ', stream);
        window.stream = stream;
        video.srcObject = stream;

        setTimeout(takePicture, 1000);
    }

    function handleError(error) {
        console.log('navigator.getUserMedia error: ', error);
    }

    navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function getRepository(user, repo) {
    return {
        repositories: [
        {
            name: "Miscellaneous Files",
            type: "folder",
            size: "30000"
        }, {
            name: "Board.png",
            type: "file",
            link: "https://youtube.com",
            size: "30000"
        }, {
            name: "Notes.txt",
            type: "file",
            link: "https://google.com",
            size: "30000"
        },
    ]};

    var out_data;

    $.ajax({
        url: "sample.txt",
        beforeSend: function( xhr ) {
        xhr.overrideMimeType( "text/plain; charset=x-user-defined" );
    }
    }).done(function( data ) {
        out_data = data.jsonify();
    }).fail(function() {
        alert("Failed to load!");
    });

    return out_data;
}

function processFile(el, repo) {
    var name = el["name"];

    if (el["type"] == "folder") {
        if (el["name"] == "..") {
            var p = repo.lastIndexOf("/");
            repo = repo.substring(0, p);
        }
        else if (repo != "") {
            repo += "/" + el["name"];
        }
        else {
            repo = el["name"];
        }

        return "<a onclick='setRepo(\""+repo+"\")' href='javascript:void()' title='"+el["name"]+"' class='folder'><div></div><span>" + name + "</span></a>";
    }
    else {
        var p = name.lastIndexOf(".");
        if (p == -1)
            p = name.length;
        var extension = name.substring(p + 1);

        if (!settings["showExtension"]) {
            name = name.substring(0, p);
        }

        const imageformats = ["png", "jpg", "gif", "tga", "tiff", "bmp", "webp"];
        const videoformats = ["mp4", "avi", "flv", "wmv", "mov"];
        const audioformats = ["wav", "aiff", "au", "flac", "ape", "wv", "m4a", "mp3", "wma", "oog", "aac", "webm"];
        const textformats = ["txt"];

        var className = "unknown";
        if (imageformats.indexOf(extension) != -1) {
            className = "image";
        }
        else if (videoformats.indexOf(extension) != -1) {
            className = "video";
        }
        else if (audioformats.indexOf(extension) != -1) {
            className = "audio";
        }
        else if (textformats.indexOf(extension) != -1) {
            className = "text";
        }

        return "<a href='"+el["link"]+"' title='"+el["name"]+"' class='"+className+"'><div></div><span>" + name + "</span></a>";
    }
}

function displayFiles(user, repo) {
    var data = getRepository(user, repo);

    $("#notes h1").html(user + "/" + repo);

    var folders = "";
    var files = "";

    if (repo != "") {
        var backobj = {
            name: "..",
            type: "folder",
            size: "3000"
        };

        folders = processFile(backobj, repo);
    }

    $.each(data["repositories"], function(key, value) {
        var content = processFile(value, repo);

        if (value["type"] == "folder")
            folders += content;
        else
            files += content;
    });

    $("#repository").html(folders + files);
}

function checkFiles() {
    displayFiles(settings.key, settings.repo);
}

function setRepo(repo) {
    settings.repo = repo;
    checkFiles();
}

var rec;
var chunks = [];
var ws;


function setupMic() {
    var handleSuccess = function(stream) {


        ws = new WebSocket("ws:/localhost:1337");
        ws.onopen = function () {
            console.log("Opened connection to websocket");
        };

        ws.onmessage = function(e) {
          console.log('message received: ', e.data);
          $("#deaf div").append(e.data);

          /*  var jsonResponse = jQuery.parseJSON(e.data);
            // console.log(jsonResponse);
            if (jsonResponse.hypotheses.length > 0) {
                var bestMatch = jsonResponse.hypotheses[0].utterance;
            }*/
        }




        


       console.log('start recording\n');
       audioRecorder.clear();
       audioRecorder.record();

       setTimeout(()=>{

         console.log('stop recording');
         audioRecorder.stop();
         // audioRecorder.getBuffers(gotBuffers);

         saveAudio(ws)


         audioRecorder.clear();
         // audioRecorder.record();


       },30000)



       // rec.start();
       //
       // rec.ondataavailable = function(e) {
       //     chunks.push(e.data);
       // }
       //
       // rec.onstop = function(e) {
       //     // var blob = new Blob(chunks, { 'type' : 'audio/wav; codecs=opus' });
       //     console.log(chunks);
       //     var blob = new Blob(chunks, { 'type' : 'audio/mp3' });
       //     chunks = [];
       //     var blobUrl = URL.createObjectURL(blob);
       //     console.log(blobUrl);
       //     ws.send(blob);
       //
       //     $("#source").attr("src", blobUrl);
       //     $("#audio")[0].pause();
       //     $("#audio")[0].load();
       //     $("#audio")[0].oncanplaythrough =  $("#audio")[0].play();
       //
       //     rec.start();
       // }
       //
       //
       // // export a wav every second, so we can send it using websockets
       // intervalKey = setInterval(function() {
       //     if (rec)
       //         rec.stop();
       // }, 5000);

    };

    navigator.mediaDevices.getUserMedia({ audio: true }).then(handleSuccess);
}

function selectDeaf() {
    $("#capture_select").addClass("capture_selected");
    $("#deaf").show();
    setupMic();
}

function selectBlind() {
    $("#capture_select").addClass("capture_selected");
    $("#blind").show();
    setupCamera();
}

var audioRead = $("#audioRead")[0];
var sourceRead = $("#sourceRead");

function submitRead() {
    var txt = $("textarea").val();
    $.ajax({
        method: "POST",
        url: "/readout",
        data: {query: txt}
    })
    .done(function( msg ) {
        playSound(audioRead, sourceRead, msg);
    });
}

$(document).ready(function(e) {
    $("#switchTranslate").click(switchTranslate);
    $("#switchCapture").click(switchCapture);
    $("#switchNotes").click(switchNotes);

    checkFiles();

    $("#deaf_btn").click(selectDeaf);
    $("#blind_btn").click(selectBlind);
    $("#readsubmit").click(submitRead);
});
