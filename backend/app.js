const express = require('express');
const bodyParser= require('body-parser');
const dotenv=require('dotenv')
const authRoutes=require('./routes/authRoutes');
const categoryRoutes=require('./routes/categoryRoutes');
const productRoutes=require('./routes/productRoutes');
const orderRoutes=require('./routes/orderRoutes');
const transactionRoutes=require('./routes/transactionRoutes');
const featuredwatchRoute=require('./routes/featuredwatchRoute');
const cartItemRoutes=require('./routes/cartItemRoutes');
const cartRoutes=require('./routes/cartRoutes');
const adminRoutes=require('./routes/adminRoutes');
const { ensureCartSchema } = require('./lib/cartSchema');
const path=require('path');
const cors=require('cors');
dotenv.config();
const app=express();
app.use(cors());
app.use('/uploads',express.static(path.join(__dirname,'uploads')));
app.use(bodyParser.json());
// Lightweight dev request log so /api call outcomes (esp. cart/orders) are
// visible in server.log while diagnosing the cart/order flow.
app.use((req, res, next) => {
  res.on('finish', () => {
    if (req.originalUrl.startsWith('/api')) {
      console.log(`[req] ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
    }
  });
  next();
});
app.use('/api/auth',authRoutes);
app.use('/api',categoryRoutes);
app.use('/api',productRoutes);
app.use("/uploads", express.static("uploads"));
app.use('/api', orderRoutes);
app.use('/api',transactionRoutes);
app.use('/api', cartItemRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
// app.use('/api',featuredwatchRoute)
const PORT = process.env.PORT || 5000;
// Repair the cart_items schema on boot so cart adds don't fail with a 500
// (id must be AUTO_INCREMENT and the unique key must be (user_id, product_id)).
ensureCartSchema().catch((err) => console.error('[cart-schema] startup repair failed:', err.message));
app.listen(PORT,() =>{
    console.log('Server running on http://localhost:${PORT}');
});
