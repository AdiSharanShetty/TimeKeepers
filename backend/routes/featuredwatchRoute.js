const express=require('express');
const db=require('../db');
const router=express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

router.post('/product', upload.single('image'), (req, res) => {
  const { pname, image, price, pricetype, categoryid } = req.body;
  let imagePath = null;

  if (req.file) {
    imagePath = req.file.path; 
  }

  if (!pname || !price || !pricetype || !categoryid) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO product (pname, image, price, pricetype, categoryid) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [pname, imagePath, price, pricetype, categoryid], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    res.json({ message: 'Product added successfully', productId: result.insertId });
  });
});

router.put('/FeaturedWatch/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { pname, description, image, price, pricetype, date, status, userid, categoryid } = req.body;
    let imagePath = null;
    if (req.file) {
        imagePath = req.file.path;
    }
    if (!pname || !description || !status || !price || !pricetype || !date || !userid || !categoryid) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const sql = `UPDATE product SET pname = ?, description = ?, status = ?, image = ?, price = ?, pricetype = ?, date = ?, userid = ?, categoryid = ? WHERE id = ?`;
    db.query(sql, [pname, description, status, imagePath, price, pricetype, date, userid, categoryid, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    });
});
//posting
//router.post('/product/add', upload.single('image'), (req, res) => {
 ////   const { pname, description, price, pricetype, date, status, userid, categoryid } = req.body;
 //   const image = req.file ? req.file.path : null;
 //   const sql = 'insert into product (pname,description,image,price,pricetype,date,status,userid,categoryid) values(?,?,?,?,?,?,?,?,?)';
 //   db.query(sql, [pname, description, image, price, pricetype, date, status, userid, categoryid], (err, result) => {
 //       if (err) return res.status(500).send(err);
 //       res.send('Product added successfully');
 //   });
//});

//fetch
router.get('/FeaturedWatch/fetch-product',(req,res)=>{
    const sql='select id,pname,image,price,pricetype,categoryid from product';
    db.query(sql,(err,results)=>{
        if(err) return res.status(500).send(err);
        res.json(results);
    });
});

//delete
router.delete('/FeaturedWatch/delete-product/:id',(req,res)=>{
    const{id}=req.params;
    const sql= 'delete from product where id=?';
    db.query(sql,[id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send('Product deleted successfully');
    });
});

//update
router.put('/FeaturedWatch/update-product/:id',(req,res)=>{
    const{id}=req.params;
    const{pname,image,price,pricetype,categoryid}=req.body;
    const sql='update product set pname=?,image=?,price=?,pricetype=?,categoryid=? where id=?';
    db.query(sql,[pname,image,price,pricetype,status,categoryid,id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send("Product updated successfully");
    });
});
module.exports=router;