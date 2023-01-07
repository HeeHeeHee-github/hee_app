// var router = require('express').Router();

// router.get('/sports', function(요청, 응답){
//     응답.send('스포츠 게시판');
//  });
 
//  router.get('/game', function(요청, 응답){
//     응답.send('게임 게시판');
//  }); 

//  module.exports = router;



var router = require('express').Router();

router.use(isLogin);

function isLogin(req, res, next) {
  if (req.user) { next() }
  else { res.render('login.ejs') }
}

router.get('/write', function(req, res){
   res.render('write.ejs')
});

router.get('/list', function(req, res){
   req.app.db.collection('post').find().toArray(function(에러, 결과){
     console.log(결과)
     res.render('list.ejs', { posts : 결과 })
   })
 })



 router.get('/detail/:id', function(req, res){
   req.app.db.collection('post').findOne({_id: parseInt(req.params.id)}, function(에러, 결과){
       console.log(결과)
       res.render('detail.ejs', {data: 결과})
   })
   

})


module.exports = router;