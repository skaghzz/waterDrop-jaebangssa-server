var dbconfig = require('../../config/database.js');
var mysql = require('mysql');
var connection = mysql.createConnection(dbconfig);


exports.locations = function(req, res) {

  var device_token = req.query.device_token;
  var si = req.query.si;
  var gu = req.query.gu;
  var dong = req.query.dong;

  connection.query('UPDATE USERS SET address_1 = (SELECT num FROM frequent_flooding WHERE si = ? && gu = ? && dong = ?) WHERE device_token = ?', [si, gu, dong, device_token], function(err, rows) {
    if (err) throw err;

    console.log('The solution is: ', rows[0]);

    console.log('The solution is: ', rows);
    res.send(rows);
  });

}

exports.curr_location = function(req, res) {

  var device_token = req.query.device_token;
  var si = req.query.si;
  var gu = req.query.gu;
  var dong = req.query.dong;

  connection.query('UPDATE USERS SET address_2 = (SELECT num FROM frequent_flooding WHERE si = ? && gu = ? && dong = ?) WHERE device_token = ?', [si, gu, dong, device_token], function(err, rows) {
    if (err) throw err;

    console.log('The solution is: ', rows[0]);

    console.log('The solution is: ', rows);
    res.send(rows);
  });

}

exports.saveToken = function(req, res) {
  var userToken = req.query.device_token;
  console.log('start');

  connection.query('INSERT INTO USERS (device_token) VALUES ("'+userToken+'");', function(err, rows) {
    if (err) throw err;

    console.log('The solution is: ', rows);
    res.send(rows);
  });

}
