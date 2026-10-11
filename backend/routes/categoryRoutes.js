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
        cb(null, Date.now() + "-" + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// route
router.post('/category', upload.single('image'), (req, res) => {
  const { name, description, status, color } = req.body;
  let imagePath = null;

  if (req.file) {
    imagePath = req.file.path; 
  }

  if (!name || !description || !status || !color) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const sql = `INSERT INTO category (name, description, status, image, color) VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [name, description, status, imagePath, color], (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    res.json({ message: 'Category added successfully', categoryId: result.insertId });
  });
});

router.put('/category/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    const { name, description, status,image,color } = req.body;
    let imagePath = null;
    if (req.file) {
        imagePath = req.file.path;
    }
    if (!name || !description || !status || !color) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const sql = `UPDATE category SET name = ?, description = ?, status = ?, image = ?, color = ? WHERE id = ?`;
    db.query(sql, [name, description, status, imagePath, color, id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error', details: err });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ message: 'Category updated successfully' });
    });
});

//Category
// router.post('/category/add',(req,res)=>{  
//     const {name,description,status,date,image,color}= req.body;
//     const sql='insert into category(name,description,status,date,image,color) values(?,?,?,?,?,?)';
//     db.query(sql,[name,description,status,date,image,color],(err,result)=>{
//         if (err) return res.status(500).send(err);
//         res.send('Category added successfully');
//     });
// });
//fetch
router.get('/category/fetch',(req,res)=>{
    const sql='select id,name,description,status,date,image,color from category';
    db.query(sql,(err,results)=>{
        if(err) return res.status(500).send(err);
            res.json(results);
    });
});
//delete
router.delete('/category/delete/:id',(req,res)=>{
    const{id}=req.params;
    const sql= 'delete from category where id=?';
    db.query(sql,[id],(err)=>{
        if(err) return res.status(500).send(err);
        res.send('Category deleted successfully');
    });
});
//update
// router.put('/category/update/:id',(req,res)=>{
//     const{id}=req.params;
//     const{name,description,status,date,image,color}=req.body;
//     const sql='update category set name=?,description=?,status=?,date=?,image=?,color=? where id=?';
//     db.query(sql,[name,description,status,date,image,color,id],(err)=>{
//         if(err) return res.status(500).send(err);
//         res.send("Category updated successfully");
//     });
// });
module.exports=router;