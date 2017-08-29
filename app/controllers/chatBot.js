var dbconfig = require('../../config/database.js');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig);

var KEY = require('../../config/key.js');
const APIAI_TOKEN = KEY.APIAI_TOKEN;
const APIAI_SESSION_ID = KEY.APIAI_SESSION_ID;
const apiai = require('apiai')(APIAI_TOKEN);


var geocoder = require('geocoder');

const OpenKoreanTextProcessor = require('open-korean-text-node').default;

var Forecast = require('forecast');
// Initialize
var forecast = new Forecast({
    service: 'darksky',
    key: KEY.DARKSKY_KEY,
    units: 'celcius',
    cache: true, // Cache API requests
    ttl: { // How long to cache requests. Uses syntax from moment.js: http://momentjs.com/docs/#/durations/creating/
        minutes: 27,
        seconds: 45
    }
});

exports.welcomeChatbot = function(req, res) {

    var nowAddress = '수영구'; //현재위치는 디바이스에서!
    var text2 = '오늘 부산 중구 날씨'; //text도 디바이스에서!
    var text = '호우 때 해안에서 행동요령 알려줘';

    let apiaiReq = apiai.textRequest(text, {
        sessionId: APIAI_SESSION_ID
    });

    apiaiReq.on('response', (apiAiResponse) => {
        console.log(apiAiResponse);
        if (apiAiResponse.result.metadata.intentName == '날씨질문') {
            if (apiAiResponse.result.parameters.address == '') {
                getWeather(nowAddress, apiAiResponse.result.parameters.date).then(function(r) {
                    res.send(r);
                })
            } else if (apiAiResponse.result.parameters.date == '') {
                getWeather(apiAiResponse.result.parameters.address, new Date()).then(function(r) {
                    res.send(r);
                })
            } else {
                getWeather(apiAiResponse.result.parameters.address, apiAiResponse.result.parameters.date).then(function(r) {
                    res.send(r);
                })
            }



        } else if (apiAiResponse.result.metadata.intentName == 'Default Fallback Intent') {
            console.log('모르겠음');
        }
    });

    apiaiReq.on('error', (error) => {
        console.log(error);
    });

    apiaiReq.end();
    //res.send('This is chatbot Server');
}

var getWeather = function(address, date) {
    return new Promise((resolve, reject) => {
        geocoder.geocode(address[(address.length - 1)], function(err, data) {
            var lat = data.results[0].geometry.location.lat;
            var lng = data.results[0].geometry.location.lng;
            var unixTime = Date.parse(date) / 1000;
            forecast.get([lat, lng, unixTime], function(err, weather) {
                var weatherText = date + ", " + address[(address.length - 1)] +
                    "의 날씨는 " + weather.currently.summary + ", " +
                    "기온은 " + weather.currently.temperature + "℃, " +
                    "체감 온도는 " + weather.currently.apparentTemperature + "℃ 입니다";
                console.log(weatherText);
                resolve(weatherText);
            });
        });
    })
}

exports.chatbot = function(req, res) {
    //var inputMessage = req.query.message;
    var inputMessage = '호우 때 실내에서 어떻게 해야해?';
    OpenKoreanTextProcessor.normalize(inputMessage).then((normalizedMessage) => {
        OpenKoreanTextProcessor.tokenize(inputMessage).then((messageToken) => {
            OpenKoreanTextProcessor.tokensToJsonArray(messageToken).then((JSONmessageTokenArray) => {
                console.log(JSONmessageTokenArray);
                var nounArray = getNounText(JSONmessageTokenArray);
            });

        });
    });
}


function getNounText(JSONmessageTokenArray) {
    var nounSpliter = [];
    for (var idx = 0; idx < JSONmessageTokenArray.length; idx++) {
        if (JSONmessageTokenArray[idx].pos == 'Noun') {
            nounSpliter.push(JSONmessageTokenArray[idx].text);
        }
    }
    //console.log(nounSpliter);
    return nounSpliter;
}