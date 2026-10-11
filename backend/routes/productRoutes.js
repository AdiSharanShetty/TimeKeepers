const express=require('express');
const db=require('../db');
const router=express.Router();
const multer = require("multer");
const path = require("path");
const { mapProduct } = require('../lib/serializers');

const PRODUCT_SELECT = 'id, pname, description, image, price, pricetype, `date`, status, userid, categoryid, featured';

// Escape LIKE wildcards so user input like "%" or "_" is matched literally.
const escapeLike = (text) => String(text).replace(/[\\%_]/g, (ch) => `\\${ch}`);

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

router.post('/product', upload.single('image'), (req, res) => {
  const { pname, description, status, image, price, pricetype, date, userid, categoryid, featured } = req.body;
  const imagePath = req.file ? `uploads/${req.file.filename}` : image || null;
  const featuredValue = featured === '1' || featured === 1 || featured === true ? 1 : 0;

  if (!pname || !description || !status || !price || !pricetype || !date || !userid || !categoryid) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO product (pname, description, image, price, pricetype, \`date\`, status, userid, categoryid, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [pname, description, imagePath, price, pricetype, date, status, userid, categoryid, featuredValue], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    res.json({ message: 'Product added successfully', productId: result.insertId });
  });
});

router.put('/product/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { pname, description, image, price, pricetype, date, status, userid, categoryid, featured } = req.body;
    const imagePath = req.file ? `uploads/${req.file.filename}` : image || null;
    const featuredValue = featured === '1' || featured === 1 || featured === true ? 1 : 0;
    if (!pname || !description || !status || !price || !pricetype || !date || !userid || !categoryid) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const sql = `UPDATE product SET pname = ?, description = ?, status = ?, image = ?, price = ?, pricetype = ?, \`date\` = ?, userid = ?, categoryid = ?, featured = ? WHERE id = ?`;
    db.query(sql, [pname, description, status, imagePath, price, pricetype, date, userid, categoryid, featuredValue, id], (err, result) => {
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
router.get('/product/fetch-product',(req,res)=>{
    const sql='select id,pname,description,image,price,pricetype,date,status,userid,categoryid,featured from product';
    db.query(sql,(err,results)=>{
        if(err) return res.status(500).send(err);
        res.json(results);
    });
});
router.get('/product/:id',(req,res)=>{
    const { id } = req.params;
    const sql='select id,pname,description,image,price,pricetype,`date`,status,userid,categoryid,featured from product where id=?';
    db.query(sql,[id],(err,results)=>{
        if(err) return res.status(500).send(err);
        if(results.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(results[0]);
    });
});
//delete
router.delete('/product/delete-product/:id',(req,res)=>{
    const{id}=req.params;
    const sql= 'delete from product where id=?';
    db.query(sql,[id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send('Product deleted successfully');
    });
});

//update
router.put('/product/update-product/:id',(req,res)=>{
    const{id}=req.params;
    const{pname,description,image,price,pricetype,date,status,userid,categoryid,featured}=req.body;
    const sql='update product set pname=?,description=?,image=?,price=?,pricetype=?,date=?,status=?,userid=?,categoryid=?,featured=? where id=?';
    db.query(sql,[pname,description,image,price,pricetype,date,status,userid,categoryid,featured,id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send("Product updated successfully");
    });
});
// ===== Contract endpoints (Section 5): /api/products* =====

// GET /api/products -> all products
router.get('/products', (req, res) => {
    db.query(`SELECT ${PRODUCT_SELECT} FROM product ORDER BY id ASC`, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows.map(mapProduct));
    });
});

// GET /api/products/search?q= -> case-insensitive match on name/description.
// Empty q returns ALL products (documented in Section 5). Must be declared
// before '/products/:id' so "search" is not treated as an id.
router.get('/products/search', (req, res) => {
    const raw = (req.query.q == null ? '' : String(req.query.q)).trim();
    if (raw === '') {
        return db.query(`SELECT ${PRODUCT_SELECT} FROM product ORDER BY id ASC`, (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            const results = rows.map(mapProduct);
            return res.json({ results, count: results.length });
        });
    }
    const like = `%${escapeLike(raw)}%`;
    const sql = `SELECT ${PRODUCT_SELECT} FROM product WHERE pname LIKE ? OR description LIKE ? ORDER BY id ASC`;
    db.query(sql, [like, like], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const results = rows.map(mapProduct);
        res.json({ results, count: results.length });
    });
});

// GET /api/products/:id -> single product
router.get('/products/:id', (req, res) => {
    const { id } = req.params;
    db.query(`SELECT ${PRODUCT_SELECT} FROM product WHERE id = ?`, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
        res.json(mapProduct(rows[0]));
    });
});

module.exports=router;