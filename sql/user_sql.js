const db = require('../lib/db');

const user = {};

user.findAll = (req, res, func) => {

    db.query("select * from user", (err, rows) => {
        func(err, rows);
    });

}

user.findOneId = (req, res, id, func) => {


    db.query("select * from user where id = ? ", id, (err, rows) => {
        func(err, rows);
    })

}

user.findOne = (req, res, user_id, func) => {


    db.query("select * from user where user_id = ? ", user_id, (err, rows) => {
        func(err, rows);
    })

}
user.findOneName = (req, res, user_name, func) => {


    db.query("select * from user where name = ? ", user_name, (err, rows) => {
        func(err, rows);
    })

}
user.updateMoney = (req, res, data, buyer) => {
    if (buyer) {
        db.query("update user set money = money - ?  where id = ?", data);
    } else {
        db.query("update user set money = money + ?  where id = ?", data);
    }
}
module.exports = user;