const express=require('express');
const db=require('../db');
const router=express.Router();

router.get('/Transaction/fetch',(req,res)=>{
    const sql='select id,order_id,user_id,product_id,description,price from order_transactions';
    db.query(sql,(err,results)=>{
        if(err) return res.status(500).send(err);
            res.json(results);
    });
});

router.delete('/Transaction/delete-Transaction/:id',(req,res)=>{
    const{id}=req.params;
    const sql= 'delete from order_transactions where id=?';
    db.query(sql,[id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send('Order Transaction deleted successfully');
    });
});

router.put('/Transaction/:id',(req,res)=>{
    const{id}=req.params;
    const{order_id,user_id,product_id,description,price}=req.body;
    const sql='update order_transactions set description=?, where order_id=?';
    db.query(sql,[user_id,product_id,description,price,order_id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send("Order Transaction saved successfully");
    });
});

module.exports=router;