import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
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
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';
import AdminNavbar from '../../Component/AdminNavbar';
import { useDropzone } from 'react-dropzone';

const normalizeFeaturedValue = (value) => {
  if (value === 1 || value === '1' || value === true) {
    return '1';
  }
  return '0';
};

const ManageProduct = () => {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ id: '', pname: '', description: '', status: 'active', image: '', price: '', pricetype: '', date: '', userid: '', categoryid: '', featured: '0' });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/product/fetch-product');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const validateFields = () => {
    let newErrors = {};
    const namePattern = /^[a-zA-Z0-9 ]+$/;
    const hexColorPattern = /^#([0-9A-F]{3}){1,2}$/i;

    if (!currentProduct.pname.trim()) {
      newErrors.pname = 'Product Name is required';
    } else if (!namePattern.test(currentProduct.pname)) {
      newErrors.pname = 'Name can only contain alphanumeric characters and spaces';
    }

    if (!currentProduct.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!['active', 'inactive'].includes(currentProduct.status.toLowerCase())) {
      newErrors.status = 'Status must be either "active" or "inactive"';
    }

    if (!isEditing && !currentProduct.image) {
      newErrors.image = 'Image is required for new products';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpen = (product = { id: '', pname: '', description: '', status: 'active', image: '', price: '', pricetype: '', date: '', userid: '', categoryid: '', featured:'0' }) => {
    setCurrentProduct({ ...product, featured: normalizeFeaturedValue(product.featured) });
    setIsEditing(Boolean(product.id));
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentProduct({ id: '', pname: '', description: '', status: 'active', image: '', price: '', pricetype: '', date: '', userid: '', categoryid: '', featured: '0' });
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    const formData = new FormData();
    formData.append('pname', currentProduct.pname);
    formData.append('description', currentProduct.description);
    if (currentProduct.image instanceof File) {
      formData.append('image', currentProduct.image);
    } else if (currentProduct.image) {
      formData.append('image', currentProduct.image);
    }
    formData.append('price', currentProduct.price);
    formData.append('pricetype', currentProduct.pricetype);
    formData.append('date', currentProduct.date);
    formData.append('status', currentProduct.status);
    formData.append('userid', currentProduct.userid);
    formData.append('categoryid', currentProduct.categoryid);
    formData.append('featured', normalizeFeaturedValue(currentProduct.featured));

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/product/${currentProduct.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/product', formData);
      }
      fetchProducts();
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`http://localhost:5000/api/product/delete-product/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const onDrop = (acceptedFiles) => {
    setCurrentProduct((prev) => ({
      ...prev,
      image: acceptedFiles[0],
    }));
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: 'image/*',
  });

  return (
    <>
    <div className='adm-page'>
      <AdminNavbar />
      <div className='adm-content'>
        <Box p={3}>
          <Typography variant="h4" gutterBottom className="adm-heading">
            Manage Products
          </Typography>
          <Button variant="contained" color="primary" onClick={() => handleOpen()} style={{ marginBottom: '16px' }}>
            Add Product
          </Button>
          <TableContainer component={Paper}>
            <div style={{marginTop:'10px'}}/>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell>Description</TableCell>
                  {/* <TableCell>Status</TableCell> */}
                  <TableCell>Image</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Price Type</TableCell>
                  <TableCell>Category ID</TableCell>
                  <TableCell>Featured</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.id}</TableCell>
                    <TableCell>{product.pname}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.image && (
                      <img 
                        src={`http://localhost:5000/${product.image}`}
                          alt={product.pname}
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                      />
                    )}
                    </TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>{product.pricetype}</TableCell>
                    <TableCell>{product.categoryid}</TableCell>
                    <TableCell>{product.featured === 1 || product.featured === '1' ? '1' : '0'}</TableCell>
                    <TableCell>{product.status}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpen(product)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => handleDelete(product.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{isEditing ? 'Edit product' : 'Add Product'}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Product Name"
                fullWidth
                value={currentProduct.pname}
                onChange={(e) => setCurrentProduct({ ...currentProduct, pname: e.target.value })}
                error={!!errors.pname}
                helperText={errors.pname}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                value={currentProduct.description}
                onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                error={!!errors.description}
                helperText={errors.description}
              />
              <div {...getRootProps()} className="adm-dropzone">
                <input {...getInputProps()} />
                <Typography>
                  {currentProduct.image ? currentProduct.image.name : 'Drop image here or click to upload'}
                </Typography>
                {errors.image && <Typography color="error">{errors.image}</Typography>}
              </div>
              <TextField
                margin="dense"
                label="price"
                fullWidth
                value={currentProduct.price}
                onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                error={!!errors.price}
                helperText={errors.price}
              />
              <TextField
                type='text'
                margin="dense"
                label="pricetype"
                fullWidth
                value={currentProduct.pricetype}
                onChange={(e) => setCurrentProduct({ ...currentProduct, pricetype: e.target.value })}
                error={!!errors.pricetype}
                helperText={errors.pricetype}
              />
              <TextField
                type='text'
                margin="dense"
                label="categoryid"
                fullWidth
                value={currentProduct.categoryid}
                onChange={(e) => setCurrentProduct({ ...currentProduct, categoryid: e.target.value })}
                error={!!errors.categoryid}
                helperText={errors.categoryid}
              />
              <TextField
                select
                margin="dense"
                label="Featured"
                fullWidth
                value={currentProduct.featured}
                onChange={(e) => setCurrentProduct({ ...currentProduct, featured: e.target.value })}
                error={!!errors.featured}
                helperText={errors.featured}
              >
                <MenuItem value= "0" >0 - Non-featured</MenuItem>
                <MenuItem value= "1" >1 - Featured</MenuItem>
              </TextField>
              <TextField
                margin="dense"
                label="status"
                fullWidth
                value={currentProduct.status}
                onChange={(e) => setCurrentProduct({ ...currentProduct, status: e.target.value })}
                error={!!errors.status}
                helperText={errors.status}
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
};

export default ManageProduct;