const mysql=require('mysql2');
const dotenv=require('dotenv');
dotenv.config();

// Defaults match a stock XAMPP install (root, no password, port 3306) plus the
// demo database name, so a fresh clone runs with NO .env file at all.
// Any value set in backend/.env (see .env.example) overrides these.
const db=mysql.createConnection({
    host:process.env.DB_HOST || 'localhost',
    user:process.env.DB_USER || 'root',
    password:process.env.DB_PASSWORD || '',
    port:process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    database:process.env.DB_NAME || 'ecom',
});

db.connect((err) =>{
    if (err) throw err;
    console.log("Connected to MySQL")
});
module.exports=db;