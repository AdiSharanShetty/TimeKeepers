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
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import axios from 'axios';
import AdminNavbar from '../../Component/AdminNavbar';
import { useDropzone } from 'react-dropzone';

const ManageCategory = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ id: '', name: '', description: '', status: 'active', image: '', color: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/category/fetch');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const validateFields = () => {
    let newErrors = {};
    const namePattern = /^[a-zA-Z0-9 ]+$/;
    const hexColorPattern = /^#([0-9A-F]{3}){1,2}$/i;

    if (!currentCategory.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!namePattern.test(currentCategory.name)) {
      newErrors.name = 'Name can only contain alphanumeric characters and spaces';
    }

    if (!currentCategory.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!['active', 'inactive'].includes(currentCategory.status.toLowerCase())) {
      newErrors.status = 'Status must be either "active" or "inactive"';
    }

    if (!hexColorPattern.test(currentCategory.color)) {
      newErrors.color = 'Enter a valid hex color code (e.g., #FF5733)';
    }

    if (!isEditing && !currentCategory.image) {
      newErrors.image = 'Image is required for new categories';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpen = (category = { id: '', name: '', description: '', status: 'active', image: '', color: '#ffffff' }) => {
    setCurrentCategory(category);
    setIsEditing(Boolean(category.id));
    setErrors({});
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentCategory({ id: '', name: '', description: '', status: 'active', image: '', color: '#ffffff' });
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateFields()) return;

    const formData = new FormData();
    formData.append('name', currentCategory.name);
    formData.append('description', currentCategory.description);
    formData.append('status', currentCategory.status);
    formData.append('color', currentCategory.color);
    if (currentCategory.image && currentCategory.image instanceof File) {
      formData.append('image', currentCategory.image);
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/category/${currentCategory.id}`, formData);
      } else {
        await axios.post('http://localhost:5000/api/category', formData);
      }
      fetchCategories();
      handleClose();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await axios.delete(`http://localhost:5000/api/category/delete/${id}`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const onDrop = (acceptedFiles) => {
    setCurrentCategory((prev) => ({
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
            Manage Categories
          </Typography>
          <Button variant="contained" color="primary" onClick={() => handleOpen()} style={{ marginBottom: '16px' }}>
            Add Category
          </Button>
          <TableContainer component={Paper}>
            <div style={{marginTop:'10px'}}/>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  {/* <TableCell>Status</TableCell> */}
                  <TableCell>Image</TableCell>
                  {/* <TableCell>Color</TableCell> */}
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.id}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.description}</TableCell>
                    {/* <TableCell>{category.status}</TableCell> */}
                    <TableCell>
                      {category.image && (
                        <img
                          src={`http://localhost:5000/${category.image}`}
                          alt={category.name}
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                      )}
                    </TableCell>
                    {/* <TableCell>{category.color}</TableCell> */}
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpen(category)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="secondary" onClick={() => handleDelete(category.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{isEditing ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Name"
                fullWidth
                value={currentCategory.name}
                onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
                error={!!errors.name}
                helperText={errors.name}
              />
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                value={currentCategory.description}
                onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
                error={!!errors.description}
                helperText={errors.description}
              />
              <TextField
                margin="dense"
                label="Status"
                fullWidth
                value={currentCategory.status}
                onChange={(e) => setCurrentCategory({ ...currentCategory, status: e.target.value })}
                error={!!errors.status}
                helperText={errors.status}
              />
              <TextField
              type='text'
                margin="dense"
                label="Color"
                fullWidth
                value={currentCategory.color}
                onChange={(e) => setCurrentCategory({ ...currentCategory, color: e.target.value })}
                error={!!errors.color}
                helperText={errors.color}
              />
              <div {...getRootProps()} className="adm-dropzone">
                <input {...getInputProps()} />
                <Typography>
                  {currentCategory.image ? currentCategory.image.name : 'Drop image here or click to upload'}
                </Typography>
                {errors.image && <Typography color="error">{errors.image}</Typography>}
              </div>
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

export default ManageCategory;