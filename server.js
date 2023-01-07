const express = require('express');
const res = require('express/lib/response');
const app = express();
//body-parser는 요청데이터 해석을 쉽게 도와줌
//const bodyParser = require('body-parser');
app.use(express.urlencoded({extended: true})) 
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
require('dotenv').config()



var db;
//디비 연결
MongoClient.connect(process.env.DB_URL, function(에러, client){
    if(에러) {return console.log(에러)}

    db = client.db('hee-app');
    app.db = db;
    app.listen(process.env.PORT, function(){
      console.log('listening on 8080')
    });
  })

/*listen(서버를 띄울 포트번호, 띄운 후 실행할 코드)
app.listen(8080, function() {
    console.log('listening on 8080')
});
*/

/*
app.get('경로', function(요청req, 응답res){
    응답.send('반갑습니다.')
});
*/

// 메인으로 가면 index.html 열림
app.get('/', function(req, res){
    res.render('index.ejs')
});


// app.get('/write', function(req, res){
//     res.render('write.ejs')
// });

app.get('/signup', function(req, res){
  res.render('signup.ejs')
});

//보기
// app.get('/list', function(req, res){
//     db.collection('post').find().toArray(function(에러, 결과){
//       console.log(결과)
//       res.render('list.ejs', { posts : 결과 })
//     })
//   })
  

  // 유저가 detail/?로 접속하면 디비에서 {_id:?}인 게시물을 찾음.
  // 찾은 결과를 detail.ejs로 보냄
  // app.get('/detail/:id', function(req, res){
  //     db.collection('post').findOne({_id: parseInt(req.params.id)}, function(에러, 결과){
  //         console.log(결과)
  //         res.render('detail.ejs', {data: 결과})
  //     })
      

  // })

app.get('/edit/:id', function(req, res){
    db.collection('post').findOne({_id: parseInt(req.params.id)}, function(에러, 결과){
        res.render('edit.ejs', { post: 결과})
    })
    
});

app.put('/edit', function(req, res){
    db.collection('post').updateOne({_id: parseInt(req.body.id)},{$set: {제목: req.body.title, 날짜: req.body.date}},function(에러, 결과){
        console.log("수정완료")
        res.redirect('/list')
    })
})

//3개의 라이브러리 첨부
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

//app.use(미들웨어) --> 난 미들웨어를 쓰겠습니다. 라는 뜻  
// 미들웨어는 요청과 응답 사이 중간에서 뭔가 실행되는 코드
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session()); 

app.get('/login', function(req, res){
    res.render('login.ejs')
});


//local이라는 방식으로 회원인지 인증을 시켜줌. 
//근데 회원 인증 실패하면 /fail 으로 이동
//회원 인증 성공시 메인으로 이동 
app.post('/login', passport.authenticate('local', {
    failureRedirect: '/fail'
}), function(req, res){
    res.redirect('/')
});


app.get('/mypage', isLogin,function(req, res){
    console.log(req.user);
    res.render('mypage.ejs', {사용자 : req.user})
});


  //가입
  app.post('/register', function(req,res){
    db.collection('login').insertOne({id: req.body.id, pw:req.body.pw} ,function(에러, 결과){
      res.redirect('/')
    })
  })  

//미들웨어
//req.user 가 있으면 next()
function isLogin(req, res, next){
    if(req.user){
        next()
    }
    else {
        res.render('login.ejs')
    }
}

passport.use(new LocalStrategy({
    usernameField: 'id',
    passwordField: 'pw',
    session: true,
    passReqToCallback: false,
  }, function (입력한아이디, 입력한비번, done) {
    //console.log(입력한아이디, 입력한비번);

    //디비에 입력한 아이디가 login 컬렉션에 있는지 찾기 (디비와 비교)
    db.collection('login').findOne({ id: 입력한아이디 }, function (에러, 결과) {
      if (에러) return done(에러)
  
      if (!결과) return done(null, false, { message: '존재하지않는 아이디요' })
      if (입력한비번 == 결과.pw) {
        return done(null, 결과)
      } else {
        return done(null, false, { message: '비번틀렸어요' })
      }
    })
  }));
  
  //세션을 저장시키는 코드(로그인에 성공했을 때 발동)
  passport.serializeUser(function (user, done) {
    done(null, user.id)
  });
  
  //이 세션 데이터를 가진 사람을 디비에서 찾아주세요(마이페이지 접속시 발동)
  passport.deserializeUser(function (아이디, done) {
    db.collection('login').findOne({id: 아이디}, function(에러, 결과){
        done(null, 결과)
    })
  }); 



  //작성
app.post('/add', function (req, res) {
  console.log(req.user._id)
  res.redirect('/write')
  db.collection('counter').findOne({ name: '게시물갯수' }, function (에러, 결과) {
    var 총게시물갯수 = 결과.totalPost;
    var post = { _id: 총게시물갯수 + 1, 작성자: req.user._id , 제목: req.body.title, 날짜: req.body.date }
    db.collection('post').insertOne( post , function (에러, 결과) {
      db.collection('counter').updateOne({ name: '게시물갯수' }, { $inc: { totalPost: 1 } }, function (에러, 결과) {
        if (에러) { return console.log(에러) }
      })
    });
  });
});

  //삭제
  app.delete('/delete', function (req, res) {
    req.body._id = parseInt(req.body._id);
    //요청.body에 담겨온 게시물번호를 가진 글을 db에서 찾아서 삭제해주세요
    db.collection('post').deleteOne({_id : req.body._id, 작성자 : req.user._id }, function (에러, 결과) {
      console.log('삭제완료');
      console.log('에러',에러)
      res.status(200).send({ message: '성공했습니다' });
    })
});

  //mongoDB에서 text index 만들어두면 빠른 검색과 or 검색 가능하다
  app.get('/search', (req, res)=>{

    var 검색조건 = [
      {
        $search: {
          index: 'titleSearch',
          text: {
            query: req.query.value,
            path: '제목'  // 제목날짜 둘다 찾고 싶으면 ['제목', '날짜']
          }
        }
      },
      {$sort : { _id : 1 } } //_id 순서대로 정렬

    ] 
    console.log(req.query);
    db.collection('post').aggregate(검색조건).toArray((에러, 결과)=>{
      console.log(결과)
      res.render('search.ejs', {posts : 결과})
    })
  })



  app.use('/', require('./routes/loginRoutes.js'))