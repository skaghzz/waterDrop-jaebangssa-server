var behaviorsController = require('./controllers/behaviors'),
    chatBotController = require('./controllers/chatBot'),
    userController = require('./controllers/user'),
    express = require('express');

module.exports = function(app) {

    var apiRoutes = express.Router(),
        chatBotRoutes = express.Router(),
        behaviorRoutes = express.Router(),
        userRoutes = express.Router();
    // addlocation // saveToken
    apiRoutes.use('/user', userRoutes);

    userRoutes.get('/addLocation', userController.locations);
    userRoutes.get('/addcurr_Location', userController.curr_location);
    userRoutes.get('/saveToken', userController.saveToken);

    // behavior Routes
    apiRoutes.use('/behavior', behaviorRoutes);

    behaviorRoutes.get('/allBehaviors', behaviorsController.allBehaviors);
    behaviorRoutes.get('/newBehavior', behaviorsController.newBehavior);

    // chatBot Routes
    apiRoutes.use('/chatbot', chatBotRoutes);


    //이거 나중에 post로 바까라
    chatBotRoutes.get('/welcome', chatBotController.welcomeChatbot);
    chatBotRoutes.get('/', chatBotController.chatbot);


    // Set up routes
    app.use('/api', apiRoutes);

}

// localhost:8080/api/behavior/allBehavior
