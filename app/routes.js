var behaviorsController = require('./controllers/behaviors'),
    chatBotController = require('./controllers/chatBot'),
    express = require('express');

module.exports = function(app) {

    var apiRoutes = express.Router(),
        chatBotRoutes = express.Router(),
        behaviorRoutes = express.Router();

    // behavior Routes
    apiRoutes.use('/behavior', behaviorRoutes);

    behaviorRoutes.get('/allBehaviors', behaviorsController.allBehavior);

    // chatBot Routes
    apiRoutes.use('/chatbot', chatBotRoutes);

    //이거 나중에 post로 바까라
    chatBotRoutes.get('/', chatBotController.chatbot);
    chatBotRoutes.get('/test', chatBotController.welcomeChatbot);

    // Set up routes
    app.use('/api', apiRoutes);

}