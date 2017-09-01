const BEFORE_DISASTER = '0';
const AFTER_DISASTER = '1';
const LOCATION_GEOGRAPH_CITY = '0';
const LOCATION_GEOGRAPH_MOUNTAIN = '1';
const LOCATION_GEOGRAPH_BEACH = '2';
const LOCATION_BUILDING_IN = '0';
const LOCATION_BUILDING_OUT = '1';

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
    var si = req.query.si;
    var gu = req.query.gu;
    var dong = req.query.dong;

    var welcomeMessage = "";

    geocoder.geocode(dong, function(err, data) {
        console.log(data);
        getWeather(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng, new Date()).then(function(r) {
            welcomeMessage += r;
            var query = "SELECT isFrequent FROM frequent_flooding WHERE si = \"" + si + "\" && gu = \"" + gu + "\" && dong = \"" + dong + "\"";
            connection.query(query, function(err, rows) {
                if (err) throw err;
                if (rows[0].isFrequent == 1) {
                    welcomeMessage += "현재 계신 " + si + " " + gu + " " + dong + "은(는) 상습 침수 지역입니다.";
                }
                res.send(welcomeMessage);
            });
        });
    });


}

var getWeather = function(latitude, longitude, date) {
    return new Promise((resolve, reject) => {
        geocoder.reverseGeocode(latitude, longitude, function(err, address) {
            var unixTime = Date.parse(date) / 1000;
            forecast.get([latitude, longitude, unixTime], function(err, weather) {
                //console.log(address.results[0].formatted_address);
                var weatherText = date + ", " + address.results[0].formatted_address +
                    "의 날씨 : " + weather.currently.summary + "\n" +
                    "기온 : " + weather.currently.temperature + "℃\n" +
                    "체감 온도 : " + weather.currently.apparentTemperature + "℃\n";
                //console.log(weatherText);
                resolve(weatherText);
            });
        }, { language: 'ko' });
    })
}

exports.chatbot = function(req, res) {
    var latitude = req.query.latitude;
    var longitude = req.query.longitude;
    //var latitude = 35.359951;
    //var longitude = 129.042415;
    var inputMessage = req.query.message;

    //var nowAddress = '대한민국 양산시 삼성동 101 북정네오파트아파트'; //현재위치는 디바이스에서!

    let apiaiReq = apiai.textRequest(inputMessage, {
        sessionId: APIAI_SESSION_ID
    });

    apiaiReq.on('response', (apiAiResponse) => {
        //console.log(apiAiResponse);
        var outMessage = {
            type: "",
            message: ""
        };
        if (apiAiResponse.result.metadata.intentName == '날씨질문') {
            outMessage.type = "weather";
            if (apiAiResponse.result.parameters.address == '') {
                getWeather(latitude, longitude, apiAiResponse.result.parameters.date).then(function(r) {
                    outMessage.message = r;
                    res.send(outMessage);
                })
            } else if (apiAiResponse.result.parameters.date == '') {
                geocoder.geocode(apiAiResponse.result.parameters.address[(apiAiResponse.result.parameters.address.length - 1)], function(err, data) {
                    getWeather(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng, new Date()).then(function(r) {
                        outMessage.message = r;
                        res.send(outMessage);
                    });
                });
            } else {
                geocoder.geocode(apiAiResponse.result.parameters.address[(apiAiResponse.result.parameters.address.length - 1)], function(err, data) {
                    getWeather(data.results[0].geometry.location.lat, data.results[0].geometry.location.lng, apiAiResponse.result.parameters.date).then(function(r) {
                        outMessage.message = r;
                        res.send(outMessage);
                    });
                });
            }
        } else if (apiAiResponse.result.metadata.intentName == '행동요령질문') {
            outMessage.type = "behavior";
            if (apiAiResponse.result.parameters.behavior_after_disaster == 'none' &&
                apiAiResponse.result.parameters.behavior_keyword == 'none' &&
                apiAiResponse.result.parameters.behavior_location_building == 'none' &&
                apiAiResponse.result.parameters.behavior_location_geograph == 'none') {
                outMessage.message = "다시 한번 더 말씀해 주세요.";
                res.send(outMessage);
            }
            var query = "";
            if (apiAiResponse.result.parameters.behavior_after_disaster != 'none') {
                query = "SELECT behavior_content FROM DISASTER_BEHAVIOR WHERE behavior_after_disaster =";
                if (apiAiResponse.result.parameters.behavior_after_disaster == '재해이후') {
                    query += AFTER_DISASTER;
                } else {
                    query += BEFORE_DISASTER;
                }

            } else if (apiAiResponse.result.parameters.behavior_keyword != 'none') {
                query = 'SELECT behavior_content FROM DISASTER_BEHAVIOR WHERE behavior_keyword LIKE \'%' + apiAiResponse.result.parameters.behavior_keyword + '%\'';
            } else if (apiAiResponse.result.parameters.behavior_location_building != 'none') {
                query = "SELECT behavior_content FROM DISASTER_BEHAVIOR WHERE behavior_after_disaster =";
                if (apiAiResponse.result.parameters.behavior_location_building == '실내') {
                    query += LOCATION_BUILDING_IN;
                } else if (apiAiResponse.result.parameters.behavior_location_building == '실외') {
                    query += LOCATION_BUILDING_OUT;
                }
            } else if (apiAiResponse.result.parameters.behavior_location_geograph != 'none') {
                query = "SELECT behavior_content FROM DISASTER_BEHAVIOR WHERE behavior_location_geograph =";
                if (apiAiResponse.result.parameters.behavior_location_geograph == '농촌산간') {
                    query += LOCATION_GEOGRAPH_MOUNTAIN;
                } else if (apiAiResponse.result.parameters.behavior_location_geograph == '해안') {
                    query += LOCATION_GEOGRAPH_BEACH;
                } else {
                    query += LOCATION_GEOGRAPH_CITY;
                }
            }
            query += " ORDER BY RAND() LIMIT 3";
            connection.query(query, function(err, rows) {
                if (err) throw err;

                //console.log('The solution is: ', rows);
                outMessage.message = rows;
                res.send(outMessage);
            });

        } else if (apiAiResponse.result.metadata.intentName == '대피소질문') {
            outMessage.type = 'shelter';
            var shelterMessage = "";
            var query = "";
            query += 'set @orig_lat = 35.359951;\n';
            query += 'set @orig_lon = 129.042415;\n';
            query += 'set @dist = 4000;\n';
            query += 'set @lon1 = @orig_lon-@dist/abs(cos(radians(@orig_lat))*69);\n';
            query += 'set @lon2 = @orig_lon+@dist/abs(cos(radians(@orig_lat))*69);\n';
            query += 'set @lat1 = @orig_lat-(@dist/69);\n';
            query += 'set @lat2 = @orig_lat+(@dist/69);\n';
            query += 'SELECT * , 6371000 * 2 * ASIN(SQRT(POWER(SIN((@orig_lat - abs(a.latitude)) * pi() / 180 / 2), 2) + COS(@orig_lat * pi() / 180) * COS(abs(a.latitude) * pi() / 180) * POWER(SIN((@orig_lon - a.longitude) * pi() / 180 / 2), 2))) as distance ';
            query += 'FROM SHELTER as a '
            query += 'WHERE a.longitude between @lon1 and @lon2 '
            query += 'AND a.latitude between @lat1 and @lat2 '
            query += 'having distance < @dist ORDER BY distance limit 5;';
            connection.query(query, function(err, rows) {
                if (err) throw err;
                //res.send(rows);
                //welcomeMessage += rows;
                //console.log(rows);
                //res.send(rows[7][0]);
                shelterMessage += "가장 가까운 대피소는 " + rows[7][0].shelter_name + "입니다.\n";
                shelterMessage += "거리 : " + parseInt(rows[7][0].distance) + "m\n";
                shelterMessage += "주소 : " + rows[7][0].address_doro + "\n";
                shelterMessage += "전화번호 : " + rows[7][0].supervisor_telephone + "\n";
                shelterMessage += "다음으로 가까운 대피소\n";
                for (var idx = 1; idx <= 3; idx++) {
                    shelterMessage += rows[7][idx].shelter_name + "\n";
                    shelterMessage += "거리 : " + parseInt(rows[7][idx].distance) + "m\n";
                    shelterMessage += "주소 : " + rows[7][idx].address_doro + "\n";
                    shelterMessage += "전화번호 : " + rows[7][idx].supervisor_telephone + "\n";
                }
                outMessage.message = shelterMessage;
                res.send(outMessage);
            });
        } else {
            outMessage.type = 'none';
            outMessage.message = apiAiResponse.result.fulfillment.messages[0].speech;
            res.send(outMessage);
        }
    });

    apiaiReq.on('error', (error) => {
        console.log(error);
    });

    apiaiReq.end();
    //res.send('This is chatbot Server');
}