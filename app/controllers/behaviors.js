var dbconfig = require('../../config/database.js');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig);


exports.allBehaviors = function(req, res) {

    connection.query('SELECT * from DISASTER_BEHAVIOR', function(err, rows) {
        if (err) throw err;

        console.log('The solution is: ', rows);
        res.send(rows);
    });

}

exports.newBehavior = function(req, res) {
    // http://localhost:8080/api/behavior/newBehavior?behavior_after_disaster=0&behavior_location_geography=0&behavior_location_building=0&behavior_content=테스트
    var behavior_after_disaster = req.query.behavior_after_disaster;
    var behavior_location_geograph = req.query.behavior_location_geograph;
    var behavior_location_building = req.query.behavior_location_building;
    var behavior_content = req.query.behavior_content;

    var query = 'INSERT INTO DISASTER_BEHAVIOR (behavior_after_disaster, behavior_location_geograph, behavior_location_building, behavior_content)' +
        'VALUES(\"' + behavior_after_disaster + '\", \"' + behavior_location_geograph + '\", \"' + behavior_location_building + '\", \"' + behavior_content + '\" )';
    connection.query(query, function(err, rows) {
        if (err) throw err;

        console.log('The solution is: ', rows);
        res.send(rows);
    });

}