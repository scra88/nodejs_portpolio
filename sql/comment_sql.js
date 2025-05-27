const db = require('../lib/db');

const comment = {};

comment.insert = (req, res, data) => {
      db.query("INSERT INTO comment (comments,user_id,board_id) VALUES (?,?,?)", data);
};
comment.findAllGetBoard = (req, res, board_id, func) => {
      db.query("SELECT * FROM comment where board_id = ? order by id desc", board_id, (err, rows) => {
            func(err, rows);
      });
}
comment.findOne = (req, res, id, func) => {
      db.query("select * from comment where id = ?", id, (err, rows) => {
            func(err, rows);
      });
}
comment.delete = (req, res, id) => {
      db.query("delete from comment where id = ?", id);
}

module.exports = comment;