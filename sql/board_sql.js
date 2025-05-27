const db = require('../lib/db');

const board = {};

board.findAll = (req, res, func) => {
    db.query("select * from board", (err, rows) => {
        func(err, rows);
    });
}
board.AddBoard = (req, res, data) => {
    db.query("INSERT INTO board (title,contents,user_id) VALUES (?,?,?)", data);
}
board.findOne = (req, res, id, func) => {


    db.query("select * from board where id = ? ", id, (err, rows) => {
        func(err, rows);
    })
}
board.findOneUserId = (req, res, id, func) => {


    db.query("select * from board where user_id = ? ", id, (err, rows) => {
        func(err, rows);
    })

}
board.deleteOne = (req, res, id) => {
    db.query("delete from board where id = ?", id);
}
board.updateOne = (req, res, data) => {
    db.query("update board set title = ?, contents = ? where id = ?", data);
}

module.exports = board;

/*export function findAll() {
    
    
    db.query("select * from board", (err, rows) => {
        res.render('index', { rows: rows});
    });
}*/

