const { body, validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const bcrypt = require("bcryptjs")
const session = require('express-session');
const session_option = require('../lib/session_option');
const user = require('../sql/user_sql');

router.use(express.urlencoded({ extended: true }));


router.use(session({
    secure: session_option.secure,
    secret: session_option.secret,
    resave: session_option.resave,
    saveUninitialized: session_option.saveUninitialized,
    cookie: {
        httpOnly: session_option.cookie.httpOnly,
        Secure: session_option.cookie.Secure,
    },

}));


router.get('/usertest', (req, res) => {
    db.query("select * from user", (err, rows) => {
        console.log("쿼리");
    });
    db.query("select * from user", (err, rows) => {
        console.log("쿼리2");
    });

    console.log("콘솔");
});

router.get('/register_form', (req, res) => {
    res.render('register_form');
});


/*
router.post('/register_validation', (req, res) => {
    let responseData = {};
    user.findOne(req, res, req.body.user_id, (err, rows) => {
        if (rows.length >= 1) {
            responseData.user_id_null = false;
        } else {
            responseData.user_id_null = true;
        }
    }).then(user.findOneName(req, res, req.body.name, (err, rows) => {
        if (rows.length >= 1) {
            responseData.name_null = false;
        } else {
            responseData.name_null = true;
        }
        res.json(responseData);
    }));

});*/

router.post('/ajax', (req, res) => { // 테스트 코드


    const user_id = req.body.user_id;
    const responseData = {};
    responseData.user_id = user_id;

    res.json(responseData);


});

router.post('/register_insert_ok',
    [body('user_id').isLength({ min: 3, max: 10 }),
    body('user_id').isAlphanumeric('en-US', { ignore: ' ' }),
    body('password').isLength({ min: 4, max: 10 }),
    body('name').isLength({ min: 2, max: 6 })
    ],
    async (req, res) => {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            console.log("오류");
        } else {
            let responseData = {};
            const sql = "INSERT INTO user (user_id,password,name,GM,money) VALUES (?,?,?,0,0)"
            const user_id = req.body.user_id;
            const name = req.body.name;
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(req.body.password, salt);


            const data = [user_id, password, name];


            const error = validationResult(req);
            /*
                   db.query("select * from user where user_id = ? or name = ?", [user_id, name], (err, rows) => {
                       if (rows.length >= 1) {
                           responseData.status = 1;
                           console.log("이미 존재하는 아이디 혹은 닉네임");
                           //res.render('error');
                       } else {
                           responseData.status = 2;
                           console.log("회원가입 성공");
                           db.query(sql, data);
                           //res.redirect('/');
                       }
                   });*/
            async function id_check_func() {

                return new Promise((resolve, reject) => {
                    user.findOne(req, res, user_id, (err, rows) => {
                        if (rows.length >= 1) {
                            resolve(1);
                        } else {
                            resolve(0);
                        }
                    });
                });
            }
            async function name_check_func() {

                return new Promise((resolve, reject) => {
                    user.findOneName(req, res, name, (err, rows) => {
                        if (rows.length >= 1) {
                            //console.log("이미 존재하는 닉네임");
                            resolve(1);
                        } else {
                            resolve(0);
                        }
                    });
                });
            }
            const id_check = await id_check_func();
            const name_check = await name_check_func();
            if (id_check == 1) {
                responseData.status = 0;
                console.log("중복된 아이디");
            } else if (name_check == 1) {
                responseData.status = 1;
                console.log("중복된 닉네임");
            }
            if (id_check == 0 && name_check == 0) {
                responseData.status = 2;
                db.query(sql, data);
                console.log("회원가입 성공");
            }
            res.json(responseData);
            //console.log(id_check);
            //console.log(name_check);
            //responseData.status = 2;
            //console.log("회원가입 성공");
            //db.query(sql, data);


        }
    });
router.get('/login_form', (req, res) => {

    if (req.session.user_id == null) {
        res.render("login_form");
    } else {
        res.redirect("/");
    }

});
router.post('/login_ok', [body('user_id').isLength({ min: 3, max: 10 }),
body('password').isLength({ min: 4, max: 10 }),
], (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        console.log("오류");
    } else {
        const user_id = req.body.user_id;
        const password = req.body.password;
        let login_success = 0;

        user.findOne(req, res, user_id, async (err, rows) => {
            let responseData = {};
            if (rows.length >= 1) {
                login_success = 1;
            } else {
                login_success = 0;
            }
            if (login_success == 1 && await bcrypt.compare(password, rows[0].password)) {

                responseData.login_success = 1;
                console.log("로그인 성공");
                req.session.user_id = rows[0].user_id;
            } else {
                responseData.login_success = 0;
                console.log("로그인 실패");
            }
            res.json(responseData);
        });

        /*
            new Promise((resolve, reject) => {
                resolve();
            }).then(db.query("select password from user where user_id = ?", user_id, (err, rows) => {
                if (rows.length >= 1) {
                    login_success = 1;
                } else {
                    login_success = 0;
                }
            })
            ).then(db.query("select * from user where user_id = ?", user_id, async (err, rows) => {
                let responseData = {};
                if (login_success == 1 && await bcrypt.compare(password, rows[0].password)) {
                    responseData.login_success = 1;
                    console.log("로그인 성공");
                    req.session.user_id = rows[0].user_id;
                } else {
                    responseData.login_success = 0;
                    console.log("로그인 실패");
                }
        
                res.json(responseData);
            }));*/
    }
});

router.get('/logout', (req, res) => {
    if (req.session.user_id != null) {
        console.log("로그아웃 완료");
        req.session.destroy();
    }
    res.redirect("/");
});




module.exports = router;