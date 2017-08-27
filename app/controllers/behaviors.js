var dbconfig = require('../../config/database.js');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig);

exports.allBehavior = function(req, res) {

    connection.query('SELECT * from DISASTER_BEHAVIOR', function(err, rows) {
        if (err) throw err;

        console.log('The solution is: ', rows);
        res.send(rows);
    });

}