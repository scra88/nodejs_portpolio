const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { imageSizeFromFile } = require('image-size/fromFile');
const multer = require('multer');
const fs = require('fs');
const session = require('express-session');
const session_option = require('../lib/session_option');
const { body, validationResult } = require('express-validator');
const path = require('path');
const shop = require('../sql/shop_sql');
const user = require('../sql/user_sql');
const receipt = require('../sql/receipt_sql');
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
async function login_user_info_func(req, res) {
    return new Promise((resolve, reject) => {
        user.findOne(req, res, req.session.user_id, (err, rows) => {
            resolve(rows[0]);
        });
    });
}
async function user_id_info_func(req, res, id) {
    return new Promise((resolve, reject) => {
        user.findOneId(req, res, id, (err, rows) => {
            resolve(rows[0]);
        });
    })
}
async function shop_info_func(req, res, id) {
    return new Promise((resolve, reject) => {
        shop.findOneDisabled(req, res, id, (err, rows) => {
            resolve(rows[0]);
        });
    })
}
async function shop_info_all_func(req, res, id) {
    return new Promise((resolve, reject) => {
        shop.findOne(req, res, id, (err, rows) => {
            resolve(rows[0]);
        });
    })
}
async function receipt_info_func(req, res, id) {
    return new Promise((resolve, reject) => {
        receipt.findOneUserId(req, res, id, (err, rows) => {
            resolve(rows);
        });
    });
}


router.get('/shop_form', (req, res) => {
    if (req.session.user_id == null) {
        res.redirect("/");
    } else {
        res.render("shop_form");
    }
})




const upload = multer({
    storage: multer.diskStorage({

        destination: (req, file, callback) => {

            if (file.fieldname == "img") {
                callback(null, path.parse(__dirname).dir + "/img");
            }
        },
        filename: (req, file, callback) => {


            const fileName = Date.now() + path.extname(file.originalname);

            callback(null, fileName);
        }
    }),
    fileFilter: (req, file, callback) => {

        const typeArray = file.mimetype.split("/");
        const fileType = typeArray[1];


        if (fileType == "jpg" || fileType == "png" || fileType == "jpeg") {
            console.log("이미지 추가 성공");
            return callback(null, true);
        } else {
            console.log("잘못된 확장자");
            return callback(null, false);
        }


    }
});



router.post('/shop_insert_ok', upload.single('img'), [
    body('name').isLength({ min: 2, max: 20 }),
    body('description').isLength({ min: 2, max: 70 })
], async (req, res) => {
    const { file } = req;
    const img = file.filename;
    const error = validationResult(req);
    const price = req.body.price;

    try {
        await imageSizeFromFile(path.parse(__dirname).dir + '/img/' + img);

        if (!error.isEmpty() || price < 500 || price > 10000000) {
            console.log("오류");
        } else {

            if (req.session.user_id == null) {
                console.log("[shop_insert_ok]로그인 상태가 아님");
                fs.unlinkSync(path.parse(__dirname).dir + '/img/' + img);
                res.redirect("/");
            } else {

                //upload.single('img');

                const user_info = await login_user_info_func(req, res);

                //file.filename // Sql에 들어갈 파일명임
                const name = req.body.name;
                const user_id = user_info.id;
                const description = req.body.description;
                const data = [name, price, img, user_id, description];
                shop.insert(req, res, data);
                res.redirect("/");
            }
        }
    } catch {
        fs.unlinkSync(path.parse(__dirname).dir + '/img/' + img);
        console.log("잘못된 이미지 제거완료");
    }
})
router.get('/shoplist', (req, res) => {
    shop.findAllDisabled(req, res, async (err, rows) => {
        if (rows.length >= 1) {
            for (let i = 0; i < rows.length; i++) {
                const user_id_info = await user_id_info_func(req, res, rows[i].user_id);
                rows[i].user_id = user_id_info.name;
            }
            res.render("shoplist", { rows: rows });
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.write("<script>alert('등록된 상품이 없습니다.');location.href='/';</script>");
        }
        //const user_id_info = await user_id_info_func(req, res, rows.id);
    });

})
router.get('/image', (req, res) => {
    const id = req.query.id;
    const imagePath = path.join(path.parse(__dirname).dir + '/img/' + id); // Adjust the path as needed 
    res.sendFile(imagePath);

})
router.get('/shop_select', (req, res) => {
    const id = req.query.id;
    if (id == null) {
        res.redirect("/");
    } else {
        shop.findOneDisabled(req, res, id, async (err, rows) => {
            if (rows.length >= 1) {
                const user_id_info = await user_id_info_func(req, res, rows[0].user_id);
                rows[0].user_id = user_id_info.name;
                res.render("getShop", { rows: rows[0] });
            } else {
                res.redirect("/");
            }
        });
    }
})
router.post('/shop_delete_ok', [body('shop_id').isLength({ min: 1 })], async (req, res) => {
    const shop_id = req.body.shop_id;

    let responseData = {};
    const error = validationResult(req);

    if (!error.isEmpty() || shop_id < 1) {

        console.log("오류");
    } else {
        if (req.session.user_id == null) {

            responseData.status = 0;
        } else {
            const user_info = await login_user_info_func(req, res);
            const shop_info = await shop_info_func(req, res, shop_id);

            if (user_info.id == shop_info.user_id || user_info.GM == 1) {
                shop.update_disabled(req, res, shop_id);
                //shop.delete(req, res, shop_id);
                console.log("삭제 성공!");
                //fs.unlinkSync(path.parse(__dirname).dir + '/img/' + shop_info.img);
                responseData.status = 2;
            } else {
                responseData.status = 1;
                console.log("본인이 등록한 상품이 아님");
            }
        }
    }
    res.json(responseData);
});
router.get('/shop_update_form', (req, res) => {
    const id = req.query.id;
    if (req.session.user_id == null) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.write("<script>alert('로그인이 필요합니다');location.href='/user/login_form';</script>");
    } else {
        shop.findOneDisabled(req, res, id, (err, rows) => {
            if (rows.length >= 1) {
                res.render("shop_update_form", { rows: rows[0] });
            } else {
                res.redirect("/");
            }
        });
    }
});

router.post('/shop_update_ok', upload.single('img'),
    [body('name').isLength({ min: 2, max: 20 })],
    [body('description').isLength({ min: 2, max: 70 })],
    async (req, res) => {

        let responseData = {};
        const { file } = req;
        const shop_id = req.body.shop_id;
        const name = req.body.name;
        const description = req.body.description;
        const price = req.body.price;
        const shop_info = await shop_info_func(req, res, shop_id);
        let img;
        if (file == null) {
            img = shop_info.img;
        } else {
            img = file.filename;
        }
        const error = validationResult(req);
        if (!error.isEmpty() || price < 500 || price > 10000000) {

            if (file != null) {
                fs.unlinkSync(path.parse(__dirname).dir + '/img/' + img);
            }
            console.log("오류");
            responseData.status = -1;
        } else {
            if (req.session.user_id == null) {
                if (file != null) {
                    fs.unlinkSync(path.parse(__dirname).dir + '/img/' + img);
                }
                responseData.status = 0;
            } else {

                const user_info = await login_user_info_func(req, res);
                const data = [name, description, price, img, shop_id];
                if (user_info.id == shop_info.user_id || user_info.GM == 1) {
                    shop.update(req, res, data);
                    console.log("상점 수정 성공");
                    if (file != null) {
                        fs.unlinkSync(path.parse(__dirname).dir + '/img/' + shop_info.img);
                    }
                    responseData.status = 2;
                } else {
                    responseData.status = 1;
                    if (file != null) {
                        fs.unlinkSync(path.parse(__dirname).dir + '/img/' + img);
                    }
                    console.log("본인이 등록한 상품이 아님");
                }

            }
        }

        res.json(responseData);
    });
router.post('/shop_buy_ok', [body('shop_id').isLength({ min: 1 })],
    async (req, res) => {
        const shop_id = req.body.shop_id;
        let responseData = {};
        const shop_info = await shop_info_func(req, res, shop_id);
        const error = validationResult(req);
        if (!error.isEmpty() || shop_id <= 0) {
            console.log("오류");
        } else {
            if (req.session.user_id == null) {
                responseData.status = 0;
            } else {
                const login_user_info = await login_user_info_func(req, res);
                const user_id_info = await user_id_info_func(req, res, shop_info.user_id);
                if (shop_info.user_id == login_user_info.id) {
                    responseData.status = 1;
                    console.log("본인이 등록한 아이템은 구매할수없음");
                } else if (login_user_info.money < shop_info.price) {
                    console.log("돈이 부족합니다.");
                    responseData.status = 2;
                    responseData.money = login_user_info.money;
                } else {
                    const buyer_data = [shop_info.price, login_user_info.id];
                    const seller_data = [shop_info.price, user_id_info.id];
                    const receipt_data = [shop_id, login_user_info.id];
                    console.log("구매 완료");
                    user.updateMoney(req, res, buyer_data, 1);
                    user.updateMoney(req, res, seller_data, 0);
                    receipt.insert(req, res, receipt_data);
                    responseData.status = 3;
                }
            }
            res.json(responseData);;
        }
    });
router.get('/receipt', async (req, res) => {
    if (req.session.user_id == null) {
        res.redirect("/");
    } else {

        //receipt의 shop_id 가져오기[로그인된 id 기준],shop_id로 shop_info불러와서 render에 넣기
        const login_user_info = await login_user_info_func(req, res);
        const receipt_info = await receipt_info_func(req, res, login_user_info.id);


        let shop_info = [];
        for (let i = 0; i < receipt_info.length; i++) {
            const shop_info_item = await shop_info_all_func(req, res, receipt_info[i].shop_id);
            shop_info.push(shop_info_item);
        }

        if (shop_info.length >= 1) {
            res.render("receipt", { rows: shop_info });
        } else {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.write("<script>alert('구매내역이 없습니다.');location.href='/user/login_form';</script>");
        }

        /*receipt.findOneUserId(req, res, login_user_info.id, async (err, rows) => {
            
            //await shop_info_func(req, res,rows[i].user_id);
            //res.render("receipt", { rows: rows   });
        })*/
    }
})

module.exports = router;