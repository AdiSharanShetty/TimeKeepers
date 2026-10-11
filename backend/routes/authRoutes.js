const express=require('express');
const db=require('../db');
const router=express.Router();

//Register
router.post('/register',(req,res)=>{
    const {name,email,password,role}=req.body;
    const sql='INSERT INTO users (name,email,password,role) VALUES(?,?,?,?)';
    db.query(sql,[name,email,password,role],(err,result)=>{
        if (err) return res.status(500).send(err);
        res.send('Registration successful');
    });
});

//Login
router.post('/login',(req,res)=>{
    const{email,password}=req.body;
    const sql='SELECT * FROM users WHERE email=? AND password=?';
    db.query(sql,[email,password],(err,result)=>{
        if (err) return res.status(500).send(err);
        if (result.length>0){
            res.json({success:true,role:result[0].role,id:result[0].id,name:result[0].name});
        }else{
            res.status(401).send('invalid credentials');   
        }
    });
});
//Get users
router.get('/users',(req,res)=>{
    const sql='select id, name ,email,role,created_at from users';
    db.query(sql,(err,results)=>{
        if(err) return res.status(500).send(err);
        res.json(results);
    });
});

//Delete users
router.delete('/users/:id',(req,res)=>{
    const{id}=req.params;
    const sql= 'delete from users where id=?';
    db.query(sql,[id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send('User deleted successfully');
    });
});

//Update users
router.put('/users/:id',(req,res)=>{
    const{id}=req.params;
    const{name,email,role}=req.body;
    const sql='update users set name=?,email=?,role=? where id=?';
    db.query(sql,[name,email,role,id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send("user updated successfully");
    });
});
module.exports=router;