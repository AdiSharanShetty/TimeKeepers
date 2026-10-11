import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import AdminNavbar from '../../Component/AdminNavbar';

const ManageCartDetails = () => {
  const [cartItems, setCartItems] = useState([]);

  const fetchCartItems = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/cart-items');
      setCartItems(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  useEffect(() => {
    fetchCartItems();
    const interval = setInterval(fetchCartItems, 5000); // poll every 5s so new adds show up automatically
    return () => clearInterval(interval);
  }, []);

  return (
    <div className='adm-page'>
      <AdminNavbar />
      <div className='adm-content'>
        <Box p={3}>
          <Typography variant="h4" gutterBottom className="adm-heading">
            Cart Items
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>User ID</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.user_id}</TableCell>
                    <TableCell>{row.product_name || (row.product_id != null ? `#${row.product_id}` : 'No products')}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{row.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </div>
    </div>
  );
};

export default ManageCartDetails;