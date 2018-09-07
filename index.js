const express = require('express')
const app = express()
var fs = require('fs');
var bodyParser = require('body-parser')
var multer  = require('multer')
var upload1 = multer({ dest: __dirname + '/public/uploads/' })
var upload = multer()
var AWS = require('aws-sdk');
var blobUtil = require('blob-util')
const fetch = require('node-fetch');


var prev = "";
var curr = "";

var current_file = 0;

var connection = null;

var WebSocketServer = require('websocket').server;
var http = require('http');
// Set the region
AWS.config.update({region: 'us-east-1'});
var s3 = new AWS.S3({apiVersion: '2006-03-01'});
var rekognition = new AWS.Rekognition();
var transcribeservice = new AWS.TranscribeService({apiVersion: '2017-10-26'});

// Create an Polly client
const Polly = new AWS.Polly({
    signatureVersion: 'v4',
    region: 'us-east-1'
})


var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(1337, function() {
  console.log('server listening on 1337 for Sockets')
});

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});


// WebSocket server
wsServer.on('request', function(request) {
   connection = request.accept(null, request.origin);

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    // console.log(message);

    // if(message.type ==='binary'){



      // fs.writeFileSync('temp.webm', message.binaryData);
      // base64_decode(message.binaryData.toString('base64'), 'temp.mp3');

      // var params = {Bucket: 'xxxxxx', Key: 'temp1.wav', Body: message.binaryData};
      // // var params = {Bucket: 'xxxxxx', Body: message.binaryData};
      // s3.upload(params, function(err, data) {
      //   console.log(err, data);
      // });


    // }

    // if (message.type === 'utf8') {


      // console.log(message.utf8Data);



      // blobUtil.blobToBase64String(message.utf8Data).then(function (base64String) {
      //   // success
      //   console.log(base64String);
      //
      // }).catch(function (err) {
      //
      //   console.log('errors:' , err)
      //   // error
      // });
      // process WebSocket message
    // }
  });

  connection.on('close', function(connection) {
    // close user connection
  });
});

function get_img_buffer(file){

  // read binary data
  var bitmap = fs.readFileSync(file);
  // convert binary data to base64 buffer
  return new Buffer(bitmap);

}

// function to encode file data to base64 encoded string
function base64_encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
function base64_decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}





// var params = {
//   Image: { /* required */
//     S3Object: {
//       Bucket: 'xxxxxx',
//       Name: 'pic.jpg',
//     }
//   }
// };

app.use(express.static('public'));
// app.use(bodyParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.post('/readout',(req,res) => {

  var submitted = req.body.query;

  let params = {
         'Text': submitted,

        // 'Text': words,
        'OutputFormat': 'ogg_vorbis',
        'VoiceId': 'Kimberly'
    }


    Polly.synthesizeSpeech(params, (err, data) => {
    if (err) {
        console.log('polly error')
        console.log(err.code)
        return res.send("");
    } else if (data) {
        if (data.AudioStream instanceof Buffer) {
          //console.log(data.AudioStream.toString('base64'));
          return res.send("data:audio/ogg;base64,"+data.AudioStream.toString('base64'));
        }
      }
      else
        return res.send("");
    });
});

app.get('/save/:id',(req,res)=>{

    var message = req.params.id;
    if(connection){
      console.log('Message:' ,  message);
      console.log('there is connection');
      connection.send(message);
    }else{
      console.log('no connection');
    }
  // base64_decode(mp3_data, 'example.mp3')

})


function check_job_done(job_name,interval){


  var params = {
      TranscriptionJobName: job_name /* required */
    };
    transcribeservice.getTranscriptionJob(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else  {

        if(data.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED'){
          console.log('\n\n\n DONE DONE DONE \n\n\n');
          var uri = data.TranscriptionJob.Transcript.TranscriptFileUri;

          fetch(uri)
          .then(res=>res.json())
          .then(json => {

            if(connection){
              connection.send(json.results.transcripts[0].transcript);
            }

          })




          clearInterval(interval);

        }else{
          console.log(data);
        }
        // console.log('Checking if job was done: ...')
        // console.log(data);
      }            // successful response
    });



}

app.post('/upload',upload1.single('upl'),(req,res)=>{


  var buffer_read = get_img_buffer(req.file.path)
  var params = {Bucket: 'xxxxxx', Key: 'file_'+current_file+'.wav', Body: buffer_read};
  s3.upload(params, function(err, data) {
    var link = data.Location;

    var params = {
    LanguageCode: 'en-US', /* required */
    Media: { /* required */
      MediaFileUri: link
    },
    MediaFormat: 'wav', /* required */
    TranscriptionJobName: 'sound'+ '_' + Math.random().toString(36).substr(2, 9), /* required */
  };

  current_file++;

    transcribeservice.startTranscriptionJob(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      res.send(data);

      var job_name = data.TranscriptionJob.TranscriptionJobName;
      var interval = setInterval(()=>{
        check_job_done(job_name,interval)
      },20000)
      console.log(data);           // successful response
    }
});

});

})
app.post('/capture',upload.single('photo'),(req, res) => {


  // var buff = get_img_buffer ('quote.jpg');
  // console.log(req.body);
  // return res.send(req.body.data);
  // console.log(req.file)

  // return res.send('okay');


//   var params = {
//   Image: { /* required */
//     Bytes:  buff /* Strings will be Base-64 encoded on your behalf */
//   }
// };


  var new_stuff = "";
  var params = {
  Image: { /* required */
    Bytes:  req.file.buffer /* Strings will be Base-64 encoded on your behalf */
  }
};

  rekognition.detectText(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else  {

      var fl = data.TextDetections;
      var array = []
      var str = ""

      fl.forEach(function(element) {
        if(element.Type == "LINE" && element.Confidence >= 85){
          array.push(element.DetectedText);
          str += element.DetectedText + " "
        }
      });


      if(str !== ""){
        if(str === prev){
          if(str !== curr){
            if(curr === ""){
              curr = str;
              new_stuff = str;
            }else {
              ind = str.indexOf(curr)

              if( ind === 0 ){
                new_stuff = str.substring(curr.length)
                curr = str;
              }else{
                new_stuff = str;
                curr = str;
              }
            }
          }
        }
        prev = str;
      }

      console.log("Read: " , str);
      console.log("New Stuff:" , new_stuff);
      console.log("current Text:", curr);

      if(new_stuff === ""){
        return res.send('');
      }

      let params = {
         'Text': new_stuff,

        // 'Text': words,
        'OutputFormat': 'ogg_vorbis',
        'VoiceId': 'Kimberly'
    }


    Polly.synthesizeSpeech(params, (err, data) => {
    if (err) {
        console.log('polly error')
        console.log(err.code)
        return res.send('');
    } else if (data) {
        if (data.AudioStream instanceof Buffer) {
            // console.log(data.AudioStream.toString('base64'));
            console.log("New Stuff:" , new_stuff);
            console.log("current Text:", curr);
           return res.send("data:audio/ogg;base64,"+data.AudioStream.toString('base64'));


          //
          // fs.writeFile("./speech.mp3", data.AudioStream, function(err) {
          //     if (err) {
          //         return console.log(err)
          //     }
          //     return res.sendFile(__dirname + '/speech.mp3');
          //     console.log("The file was saved!")
          // })



            //
            // fs.writeFile("./speech.mp3", data.AudioStream, function(err) {
            //     if (err) {
            //         return console.log(err)
            //     }
            //     console.log("The file was saved!")
            // })
        }
    }
})

      //res.json({read_word: str,new_word: new_stuff, current_thing: curr});           // successful response

    }
  });
})



app.get('/start', (req,res)=>{

    var params = {
    LanguageCode: 'en-US', /* required */
    Media: { /* required */
      MediaFileUri: 'https://s3.amazonaws.com/xxxxxx/can.wav'
    },
    MediaFormat: 'wav', /* required */
    TranscriptionJobName: 'testbackend', /* required */
  };

  transcribeservice.startTranscriptionJob(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else    {

    res.send(data);
    console.log(data);           // successful response
  }
});
});


app.get('/transcribe', (req,res)=>{


  var params = {
      TranscriptionJobName: 'sound_qmdm76o7p' /* required */
    };
    transcribeservice.getTranscriptionJob(params, function(err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else    {
        console.log(data);
        var uri = data.TranscriptionJob.Transcript.TranscriptFileUri;

        fetch(uri)
        .then(res=>res.json())
        .then(json => {

          res.send(json.results.transcripts[0].transcript);
          console.log(json.results.transcripts[0].transcript);

        });

                  // successful response
    }
  })


});

app.get('/list', (req, res) => {

var params = {
  Bucket: "xxxxxx",
  MaxKeys: 15
 };
 s3.listObjects(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else
{

// return res.send(data.Contents)
 var z = [];
 var fl = data.Contents;

 for(let i = 0; i < fl.length; i++){
   z.push({key:fl[i].Key , size: fl[i].Size , strn: "https://s3.amazonaws.com/xxxxxx/" + fl[i].Key});
 }

//  fl.foreach(function(elements){
//
// })

res.send(z);           // successful response

}

 });

});


app.get('/polly',(req,res)=>{

      words = req.params.data

      let params = {
         'Text': 'Hey, My name is Kimberly and I am here to help you.',

        // 'Text': words,
        'OutputFormat': 'mp3',
        'VoiceId': 'Kimberly'
    }

    // var params = {
    //   LexiconNames: [
    //      "example"
    //   ],
    //   OutputFormat: "mp3",
    //   SampleRate: "8000",
    //   Text: "All Gaul is divided into three parts",
    //   TextType: "text",
    //   VoiceId: "Joanna"
    // };
    //
      Polly.synthesizeSpeech(params, (err, data) => {
      if (err) {
          console.log('polly error')
          console.log(err.code)
      } else if (data) {
          if (data.AudioStream instanceof Buffer) {
              fs.writeFile("./speech.mp3", data.AudioStream, function(err) {
                  if (err) {
                      return console.log(err)
                  }
                  console.log("The file was saved!")
              })
          }
      }
  })

})

app.listen(3000, () => console.log('Example app listening on port 3000!'))
