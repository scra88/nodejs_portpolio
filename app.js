const express = require('express');
const app = express();
const path = require('path');

const boardRouter = require('./router/board');
const userRouter = require('./router/user');
const commentRouter = require('./router/comment');
const shopRouter = require('./router/shop');

app.set('port', process.env.PORT || 3000); // 포트
app.set('views', __dirname + '/views');;
app.set('view engine', "ejs");
//app.use(morgan('combined')); // 서버 로그 남기기
app.use('/', boardRouter);
app.use('/user', userRouter);
app.use('/comment', commentRouter);
app.use('/shop', shopRouter);
app.listen(app.get('port'), () => {
    console.log("서버 온");
});