const db = require('../lib/db');

const shop = {};

shop.insert = (req, res, data) => {
    db.query("INSERT INTO shop(name,price,img,user_id,description,disabled) values (?,?,?,?,?,0)", data);

}
shop.findAll = (req, res, func) => {
    db.query("select * from shop", (err, rows) => {
        func(err, rows);
    });
}
shop.findAllDisabled = (req, res, func) => {
    db.query("select * from shop where disabled = 0", (err, rows) => {
        func(err, rows);
    });
}

shop.findOneDisabled = (req, res, id, func) => {
    db.query("select * from shop where id = ? and disabled = 0", id, (err, rows) => {
        func(err, rows);
    });
}
shop.findOne = (req, res, id, func) => {
    db.query("select * from shop where id = ?", id, (err, rows) => {
        func(err, rows);
    });
}

shop.delete = (req, res, id) => {
    db.query("delete from shop where id = ?", id);
}
shop.update_disabled = (req, res, id) => {
    db.query("update shop set disabled = 1 where id = ?", id);
}
shop.update = (req, res, data) => {
    db.query("update shop set name = ?,description = ?,price = ?,img = ?  where id = ? ", data);
}

module.exports = shop;