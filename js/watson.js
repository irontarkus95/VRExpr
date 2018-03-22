// https://github.com/watson-developer-cloud/node-sdk
var SpeechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');
var fs = require('fs');
const download = require('download');
var fire= require("./firebase.js");
var admin = require("firebase-admin");
var serviceAccount = require("./services/services.json");


var speechToText = new SpeechToTextV1({
  username: 'dd99ad11-c7c4-4b98-aea8-96b592f6ce1a',
  password: 'Za05pW1jvRgr',
  url: 'https://stream.watsonplatform.net/speech-to-text/api/'
});

function getFile(fileList,name){
  for(var i=0;i<fileList.length;i++){
    if(fileList[i]["metadata"]['name']==name)
    return fileList[i]['metadata']["mediaLink"];
  }
}
admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: "gs://speech2text-3ab74.appspot.com/"
  });


  function setCheck(path, timeout,key) {
    timeout = setInterval(function() {

        const file = path;
        const fileExists = fs.existsSync(file);

        console.log('Checking for: ', file);
        console.log('Exists: ', fileExists);

        if (fileExists) {
            clearInterval(timeout);
            var stream = fs.createReadStream('js/audio/record.wav')
            .pipe(speechToText.createRecognizeStream({content_type: 'audio/l16; rate=44100'}))
            .pipe(fs.createWriteStream('./transcription.txt'))
            
            stream.on('finish', function(){
                        fs.readFile("./transcription.txt", 'utf8', 
                      function(err, data) {
                          if (err) throw err;
                          console.log(data)
                          fire.writeToDatabase({"Watson":{"Response":data}},key);
                    })
                  });
        }
    }, timeout);

};

module.exports = {
  RecognizeWatson: function(name,key){
  

  try{
    var bucket = admin.storage().bucket();
    bucket.getFiles({}, (err, files,apires) => { download(getFile(files,name)).then(data => {
      fs.writeFileSync('js/audio/record.wav', data);

    });});
    // wait until files are created then process
    setCheck("js/audio/record.wav",2000,key);
   
  }
  catch (err) {
    console.log(err);
  }
  finally{
    
  }

}

}

// RecognizeWatson(name);
