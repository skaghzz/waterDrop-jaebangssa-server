var dbconfig = require('../../config/database.js');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig);

const OpenKoreanTextProcessor = require('open-korean-text-node').default;
var stringSimilarity = require('string-similarity');

exports.welcomeChatbot = function(req, res) {
    res.send('This is chatbot Server');
}

exports.chatbot = function(req, res) {
    //var inputMessage = res.body.inputMessage;
    var inputMessage = '오늘의 부산시 금정구의 날씨를 알려줘';
    OpenKoreanTextProcessor.normalize(inputMessage).then((normalizedMessage) => {
        OpenKoreanTextProcessor.tokenize(inputMessage).then((messageToken) => {
            OpenKoreanTextProcessor.tokensToJsonArray(messageToken).then((JSONmessageTokenArray) => {
                var nounArray = getNounText(JSONmessageTokenArray);

                res.send(nounArray);
            })

        })
    })

}

function getNounText(JSONmessageTokenArray) {
    var nounSpliter = [];
    for (var idx = 0; idx < JSONmessageTokenArray.length; idx++) {
        if (JSONmessageTokenArray[idx].pos == 'Noun') {
            nounSpliter.push(JSONmessageTokenArray[idx].text);
        }
    }
    console.log(nounSpliter);
    return nounSpliter;
}