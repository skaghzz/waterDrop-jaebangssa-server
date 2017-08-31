const before_disaster = '0';
const after_disaster = '1';
const location_geograph_city = '0';
const location_geograph_mountain = '1';
const location_geograph_beach = '2';
const location_building_in = '0';
const location_building_out = '1';

var dbconfig = require('../../config/database.js');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig);

var KEY = require('../../config/key.js');
const APIAI_TOKEN = KEY.APIAI_TOKEN;
const APIAI_SESSION_ID = KEY.APIAI_SESSION_ID;
const apiai = require('apiai')(APIAI_TOKEN);

var geocoder = require('geocoder');

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

    var si = '강원도';
    var gu = '양구군';
    var dong = '남면';

    var welcomeMessage = "";

    getWeather(dong, new Date()).then(function(r) {
        welcomeMessage += r;
        var query = "SELECT isFrequent FROM frequent_flooding WHERE si = \"" + si + "\" && gu = \"" + gu + "\" && dong = \"" + dong + "\"";
        connection.query(query, function(err, rows) {
            if (err) throw err;
            //res.send(rows);
            //welcomeMessage += rows;
            if (rows[0].isFrequent == 1) {
                welcomeMessage += "현재 계신 " + si + " " + gu + " " + dong + "은(는) 상습 침수 지역입니다.";
            }
            res.send(welcomeMessage);
        });
    });

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
                    "체감 온도는 " + weather.currently.apparentTemperature + "℃ 입니다.\n";
                console.log(weatherText);
                resolve(weatherText);
            });
        });
    })
}

exports.chatbot = function(req, res) {

    var nowAddress = '수영구'; //현재위치는 디바이스에서!
    //var text = '비올때 위험지역'; //text도 디바이스에서!
    var text = req.query.message;
    console.log(text);

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

        } else if (apiAiResponse.result.metadata.intentName == '행동요령질문') {
            console.log('행동요령질문이군');
            console.log(apiAiResponse.result.parameters);
            if (apiAiResponse.result.parameters.behavior_after_disaster == 'none' &&
                apiAiResponse.result.parameters.behavior_keyword == 'none' &&
                apiAiResponse.result.parameters.behavior_location_building == 'none' &&
                apiAiResponse.result.parameters.behavior_location_geograph == 'none') {
                res.send('다시 한번 더 말씀해 주세요.');
            }
            var query = "";
            if (apiAiResponse.result.parameters.behavior_after_disaster != 'none') {
                query = "SELECT behavior_content FROM DISASTER_BEHAVIOR WHERE behavior_after_disaster =";
                if (apiAiResponse.result.parameters.behavior_after_disaster == '재해이후') {
                    query += after_disaster;
                } else {
                    query += before_disaster;
                }

            } else if (apiAiResponse.result.parameters.behavior_keyword != 'none') {
                query = 'SELECT behavior_content FROM DISASTER_BEHAVIOR WHERE behavior_keyword LIKE \'%' + apiAiResponse.result.parameters.behavior_keyword + '%\'';
            } else if (apiAiResponse.result.parameters.behavior_location_building != 'none') {
                query = "SELECT behavior_content FROM DISASTER_BEHAVIOR WHERE behavior_after_disaster =";
                if (apiAiResponse.result.parameters.behavior_location_building == '실내') {
                    query += location_building_in;
                } else if (apiAiResponse.result.parameters.behavior_location_building == '실외') {
                    query += location_building_out;
                }
            } else if (apiAiResponse.result.parameters.behavior_location_geograph != 'none') {
                query = "SELECT behavior_content FROM DISASTER_BEHAVIOR WHERE behavior_location_geograph =";
                if (apiAiResponse.result.parameters.behavior_location_geograph == '농촌산간') {
                    query += location_geograph_mountain;
                } else if (apiAiResponse.result.parameters.behavior_location_geograph == '해안') {
                    query += location_geograph_beach;
                } else {
                    query += location_geograph_city;
                }
            }
            query += " ORDER BY RAND() LIMIT 3";
            console.log(query);
            connection.query(query, function(err, rows) {
                if (err) throw err;

                console.log('The solution is: ', rows);
                res.send(rows);
            });

        } else if (apiAiResponse.result.metadata.intentName == 'Default Fallback Intent') {
            console.log('모르겠음');
            res.send(apiAiResponse.result.fulfillment.messages[0].speech);
        }
    });

    apiaiReq.on('error', (error) => {
        console.log(error);
    });

    apiaiReq.end();
    //res.send('This is chatbot Server');
}

/*
const OpenKoreanTextProcessor = require('open-korean-text-node').default;
exports.chatbot = function(req, res) {
    //var inputMessage = req.query.message;
    //var inputMessage = '호우 때 실내에서 어떻게 해야해?';
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
*/