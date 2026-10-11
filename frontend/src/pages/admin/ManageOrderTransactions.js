import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';
import AdminNavbar from '../../Component/AdminNavbar';

const ManageOrderTransactions = () => {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState({order_id:'',user_id:'',product_id:'',description:'Pending',price:'' });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch Orders
  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/transaction/fetch');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching order transactions:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const validateFields = () => {
    let newErrors = {};

    if (!String(currentTransaction.user_id || '').trim()) {
      newErrors.user_id = 'User ID is required';
    }

    if (!String(currentTransaction.product_id || '').trim()) {
      newErrors.product_id = 'Product ID is required';
    }

    if (!String(currentTransaction.description || '').trim()) {
      newErrors.description = 'Description is required';
    }

    if (!String(currentTransaction.price || '').trim()) {
      newErrors.price = 'Price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpen = (transaction = { user_id: '', product_id: '', description: 'Pending', price: '' }) => {
    setCurrentTransaction(transaction);
    setIsEditing(Boolean(transaction.order_id));
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentTransaction({ user_id: '', product_id: '', description: 'Pending', price: '' });
    setErrors({});
  };

  const handleDelete = async (orderId) => {
    try {
      await axios.delete(`http://localhost:5000/api/Transaction/delete-order/${orderId}`);
      fetchTransactions();
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    const formData = new FormData();
    formData.append('ID', currentTransaction.id)
    formData.append('Order ID', currentTransaction.order_id);
    formData.append('User ID', currentTransaction.user_id);
    formData.append('Product ID',currentTransaction.product_id);
    formData.append('Description',currentTransaction.description);
    formData.append('Price', currentTransaction.price);

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/Transaction/${currentTransaction.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/Transaction', formData);
      }
      fetchTransactions();
      handleClose();
    } catch (error) {
      console.error('Error saving order transactions:', error);
    };
  }
  return (
      <>
      <div className='adm-page'>
        <AdminNavbar />
        <div className='adm-content'>
          <Box p={3}>
            <Typography variant="h4" gutterBottom className="adm-heading">
              Manage Order Transactions
            </Typography>
            <TableContainer component={Paper}>
              <div style={{marginTop:'10px'}}/>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Order ID</TableCell>
                    <TableCell>User ID</TableCell>
                    <TableCell>Product ID</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((Transaction) => (
                    <TableRow key={Transaction.id}>
                      <TableCell>{Transaction.id}</TableCell>
                      <TableCell>{Transaction.order_id}</TableCell>
                      <TableCell>{Transaction.user_id}</TableCell>
                      <TableCell>{Transaction.product_id}</TableCell>
                      <TableCell>{Transaction.description}</TableCell>
                      <TableCell>{Transaction.price}</TableCell>
                      <TableCell align="right">
                        <IconButton color='primary' onClick={()=> handleOpen(Transaction)}>
                          <Edit/>
                        </IconButton>
                        <IconButton color="secondary" onClick={() => handleDelete(Transaction.order_id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>{isEditing ? 'Edit Order' : 'Add Order'}</DialogTitle>
              <DialogContent>
                <TextField
                    margin="dense"
                    label="Description"
                    fullWidth
                    value={currentTransaction.description}
                    onChange={(e) => setCurrentTransaction({ ...currentTransaction, description: e.target.value })}
                    error={!!errors.description}
                    helperText={errors.description}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                  {isEditing ? 'Update' : 'Add'}
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </div>
      </div>
      </>
    );
}
 
export default ManageOrderTransactions;