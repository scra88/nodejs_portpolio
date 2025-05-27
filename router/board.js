const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const board = require('../sql/board_sql');
const user = require('../sql/user_sql');
const comment = require('../sql/comment_sql');
const session = require('express-session');
const session_option = require('../lib/session_option');
const { body, validationResult } = require('express-validator');
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

router.get('/boardtest', (req, res) => {
    /*board.findAll(req, res, (err, rows) => {
        res.render("index", { rows, user_name: "ㅇㅇ" });

    });
    const user_id = "harujip";
    user.findOne(req, res, user_id, (err, rows) => {
        console.log(rows[0]);
    });*/

    res.render('test');
});


router.get('/', (req, res) => {

    let user_name = "";

    async function user_id_change_func() {

        return new Promise((resolve, reject) => {
            let user_id = [];
            board.findAll(req, res, async (err, rows) => {
                if (rows == 0) {
                    resolve(0);
                } else {
                    for (let i = 0; i < rows.length; i++) {
                        user.findOneId(req, res, rows[i].user_id, (err2, rows2) => {
                            rows[i].user_id = rows2[0].name;
                            user_id.push(rows[i].user_id);

                            if (i >= rows.length - 1) {
                                resolve(user_id);
                            }
                        });
                    }
                }
            });
        });
    }
    async function user_info_func() {
        return new Promise((resolve, reject) => {
            if (req.session.user_id == null) {
                resolve(false);
            } else {
                user.findOne(req, res, req.session.user_id, (err, rows) => {
                    
                    resolve(rows[0]);
                });
            }
        });
    }

    board.findAll(req, res, async (err, rows) => {

        const user_info = await user_info_func();
        const rows_name = await user_id_change_func();
        //res.render("test", { rows: rows });

        res.render('index', { rows: rows, user_info: user_info, rows_name: rows_name });
    });






});
router.get('/board_form', (req, res) => {
    if (req.session.user_id == null) {
        res.redirect('/');
    } else {
        res.render("board_form");
    }

});

router.post('/board_insert_ok', (req, res) => {
    if (req.session.user_id != null) {
        user.findOne(req, res, req.session.user_id, (err, rows) => {
            const title = req.body.title;
            const contents = req.body.contents;
            if ((title.length >= 2 && title.length <= 20) && contents.length >= 2 && contents.length <= 100) {
                const data = [title, contents, rows[0].id];
                db.query("INSERT INTO board (title,contents,user_id) VALUES(?,?,?)", data);
                res.redirect('/');
            } else {
                res.render("error");
            }


        })
        //res.redirect('/');
    } else {
        res.render("error");
    }
    /*
    const sql = "INSERT INTO board (title,contents,user_name) VALUES (?,?,?)";
    const title = req.body.title;
    const contents = req.body.contents;
    const data = [title, contents, "ㅇㅇ"];
    db.query(sql, data);
    res.redirect('/');*/
});
router.get('/board_select', async (req, res) => {

    const id = req.query.id;

    async function board_comment_func() {
        return new Promise((resolve, reject) => {
            comment.findAllGetBoard(req, res, id, async (err, rows) => {
                resolve(rows);
            });
        });
    }
    const board_comment = await board_comment_func();
    async function user_info_func(i) {
        return new Promise((resolve, reject) => {
            user.findOneId(req, res, board_comment[i].user_id, (err, rows) => {
                resolve(rows[0]);
            });
        });
    }
    let user_info = [];
    for (let i = 0; i < board_comment.length; i++) {
        user_info[i] = await user_info_func(i);
        board_comment[i].user_id = user_info[i].name;
        if (user_info[i].GM == 1) {
            user_info[i].GM = "[GM]";
        } else {
            user_info[i].GM = "[유저]";
        }
    }



    if (id != null) {
        board.findOne(req, res, id, (err, rows) => {
            if (rows.length >= 1) {
                res.render("getBoard", { rows: rows[0], rows_comment: board_comment, rows_user: user_info });
            } else {
                res.render("error");
            }
        })
    } else {
        res.render("error");
    }
});

router.post("/board_delete_ok", [body('id').isLength({ min: 1 }),

], async (req, res) => {
    let responseData = {};
    const id = req.body.id;
    const error = validationResult(req);
    if (!error.isEmpty() || id < 1) {

        console.log("오류");
    } else {



        if (req.session.user_id == null) {

            responseData.status = 0;
            //res.render('error');
        } else {

            //board 의 user_id와 로그인되어있는 나의 id값을 비교
            async function board_user_id_func() {
                return new Promise((resolve, reject) => {
                    board.findOne(req, res, id, (err, rows) => {
                        resolve(rows[0].user_id);
                    });
                })
            }
            async function user_info_func() {

                return new Promise((resolve, reject) => {
                    user.findOne(req, res, req.session.user_id, (err, rows) => {
                        resolve(rows[0]);
                    });
                });
            }

            const board_user_id = await board_user_id_func();
            const user_info = await user_info_func();
            const user_info_id = user_info.id;
            const user_info_gm = user_info.GM;

            if (board_user_id == user_info_id || user_info_gm == 1) {

                board.deleteOne(req, res, id);
                console.log("삭제 성공!");
                responseData.status = 2;


                //res.redirect("/");
            } else {

                responseData.status = 1;
                console.log("본인의 게시물이 아님");
                //res.render("error");
            }
            //board.deleteOne(req, res, id);

        }

        res.json(responseData);
    }
});

/*
router.post('/board_update_form_validation', async (req, res) => {
    let responseData = {};

    if (req.session.user_id == null) {
        responseData.status = 0;
    } else {

        const id = req.body.id;
        async function board_user_id_func() {
            return new Promise((resolve, reject) => {
                board.findOne(req, res, id, (err, rows) => {

                    resolve(rows[0].user_id);
                });
            });
        }
        async function user_info_func() {
            return new Promise((resolve, reject) => {
                user.findOne(req, res, req.session.user_id, (err, rows) => {
                    resolve(rows[0]);
                });
            });
        }
        const board_user_id = await board_user_id_func();
        const user_info = await user_info_func();
        const user_info_id = user_info.id;
        if (board_user_id == user_info_id || user_info.GM == 1) {
            responseData.status = 2;
        } else {
            responseData.status = 1;
        }
    }

    res.json(responseData);
});*/

router.get('/board_update_form', (req, res) => {


    const id = req.query.id;
    if (req.session.user_id == null) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.write("<script>alert('로그인이 필요합니다');location.href='/user/login_form';</script>");
    } else {
        board.findOne(req, res, id, (err, rows) => {
            if (rows.length >= 1) {
                res.render("board_update_form", { rows: rows });
            } else {
                res.redirect("/");
            }
        });
    }
});



router.post('/board_update_ok',
    [body('id').isLength({ min: 1 }),
    body('title').isLength({ min: 2, max: 20 }),
    body('contents').isLength({ min: 2, max: 100 })], async (req, res) => {
        const error = validationResult(req);
        if (!error.isEmpty()) {
            console.log("오류");
        } else {
            let responseData = {};
            const id = req.body.id;
            const title = req.body.title;
            const contents = req.body.contents;
            const data = [title, contents, id];
            if (req.session.user_id == null) {
                responseData.status = 0;
            } else {
                async function board_user_id_func() {
                    return new Promise((resolve, reject) => {
                        board.findOne(req, res, id, (err, rows) => {

                            resolve(rows[0].user_id);
                        });
                    });
                }
                async function user_info_func() {
                    return new Promise((resolve, reject) => {
                        user.findOne(req, res, req.session.user_id, (err, rows) => {
                            resolve(rows[0]);
                        });
                    });
                }
                const board_user_id = await board_user_id_func();
                const user_info = await user_info_func();
                const user_info_id = user_info.id;
                if (board_user_id == user_info_id || user_info.GM == 1) {
                    responseData.status = 2;
                    board.updateOne(req, res, data);
                    console.log("수정완료");
                } else {
                    responseData.status = 1;
                }
            }
            res.json(responseData);
        }
    });
module.exports = router;