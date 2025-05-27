const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const session = require('express-session');
const session_option = require('../lib/session_option');
const comment = require('../sql/comment_sql');
const user = require('../sql/user_sql');
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

router.post('/comment_insert_ok', [body('board_id').isLength({ min: 1 }),
body('comments').isLength({ min: 3, max: 20 })], async (req, res) => {

    const responseData = {};
    const board_id = req.body.board_id;
    const comments = req.body.comments;
    const error = validationResult(req);

    if (!error.isEmpty()) {
        console.log("오류");
    } else {
        if (req.session.user_id == null) {
            responseData.status = 0;
        } else {
            async function user_info_func() {
                return new Promise((resolve, reject) => {
                    user.findOne(req, res, req.session.user_id, (err, rows) => {
                        resolve(rows[0]);
                    });
                })
            }

            const user_info = await user_info_func();

            const data = [comments, user_info.id, board_id] //로그인된 아이디로 id값찾기];
            comment.insert(req, res, data);
        }
        res.json(responseData);
    }
});
router.post('/comment_delete_ok', [body('comment_id').isLength({ min: 1 })], async (req, res) => {
    const responseData = {};
    const error = validationResult(req);
    const comment_id = req.body.comment_id;
    if (!error.isEmpty()) {
        console.log("오류");
    } else {
        if (req.session.user_id == null) {
            responseData.status = 0;
        } else {
            async function comment_user_id_func() {
                return new Promise((resolve, reject) => {
                    comment.findOne(req, res, comment_id, (err, rows) => {
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
            const comment_user_id = await comment_user_id_func();
            const user_info = await user_info_func();
            if (comment_user_id == user_info.id || user_info.GM == 1) {
                comment.delete(req, res, comment_id);
                console.log("댓글 삭제완료");
            } else {
                responseData.status = 1;
            }
        }
        res.json(responseData);
    }
})

module.exports = router;