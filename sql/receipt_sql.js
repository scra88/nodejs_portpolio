const db = require('../lib/db');

const receipt = {};

receipt.insert = (req, res, data) => {
    db.query("INSERT INTO receipt(shop_id,user_id) values (?,?) ", data);
}
receipt.findOneUserId = (req, res, id, func) => {
    db.query("select * from receipt where user_id = ?", id, (err, rows) => {
        func(err, rows);
    });
}


module.exports = receipt;