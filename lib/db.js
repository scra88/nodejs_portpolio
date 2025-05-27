const mysql = require('mysql2');



const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'jh'
});
/*

db.connect((err) => {
    if (err) {
        console.log("db 연동 실패");
        throw err;
    } else {
        console.log("db 연동 성공!");
    }
});
*/


module.exports = db;

