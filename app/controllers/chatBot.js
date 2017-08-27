var dbconfig = require('../../config/database.js');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig);

const OpenKoreanText = require('open-korean-text-node').default;
var stringSimilarity = require('string-similarity');

exports.welcomeChatbot = function(req, res) {
    res.send('This is chatbot Server');
}

exports.chatbot = function(req, res) {
    //var inputMessage = res.body.inputMessage;
    var inputMessage = '오늘 부산 날씨 알려줘';
    var a = OpenKoreanText.tokenizeSync('착한강아지상을 받은 루루')
    var b = a.toJSON();
    console.log(b);


    var outputMessage = inputMessage;
    res.send(outputMessage);
}