// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Button,
//   TextField,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   IconButton,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   Typography,
// } from '@mui/material';
// import { Delete, Edit } from '@mui/icons-material';
// import axios from 'axios';
// import AdminNavbar from '../../Component/AdminNavbar';
// import { useDropzone } from 'react-dropzone';

// const FeaturedWatches = () => {
//   const [watches, setWatches] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [currentWatch, setCurrentFeaturedWatch] = useState({ id: '', pname: '', image: '', price: '', pricetype: '', categoryid: '' });
//   const [isEditing, setIsEditing] = useState(false);
//   const [errors, setErrors] = useState({});

//   // Fetch products
//   const fetchProducts = async () => {
//     try {
//       const response = await axios.get('http://localhost:5000/api/product/fetch-product');
//       setWatches(response.data);
//     } catch (error) {
//       console.error('Error fetching products:', error);
//     }
//   };

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const validateFields = () => {
//     let newErrors = {};
//     const namePattern = /^[a-zA-Z0-9 ]+$/;
//     const hexColorPattern = /^#([0-9A-F]{3}){1,2}$/i;

//     if (!currentWatch.pname.trim()) {
//       newErrors.pname = 'Product Name is required';
//     } else if (!namePattern.test(currentWatch.pname)) {
//       newErrors.pname = 'Name can only contain alphanumeric characters and spaces';
//     }

//     if (!currentWatch.description.trim()) {
//       newErrors.description = 'Description is required';
//     }

//     if (!['active', 'inactive'].includes(currentWatch.status.toLowerCase())) {
//       newErrors.status = 'Status must be either "active" or "inactive"';
//     }

//     if (!isEditing && !currentWatch.image) {
//       newErrors.image = 'Image is required for new products';
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleOpen = (product = { id: '', pname: '', image: '', price: '', pricetype: '', categoryid: '' }) => {
//     setCurrentFeaturedWatch(product);
//     setIsEditing(Boolean(product.id));
//     setErrors({});
//     setOpen(true);
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setCurrentFeaturedWatch({ id: '', pname: '', image: '', price: '', pricetype: '', categoryid: '' });
//     setErrors({});
//   };

//   const handleSave = async () => {
//     if (!validateFields()) return;

//     const formData = new FormData();
//     formData.append('pname', currentWatch.pname);
//     if (currentWatch.image instanceof File) {
//       formData.append('image', currentWatch.image);
//     } else if (currentWatch.image) {
//       formData.append('image', currentWatch.image);
//     }
//     formData.append('price', currentWatch.price);
//     formData.append('pricetype', currentWatch.pricetype);
//     formData.append('categoryid', currentWatch.categoryid);

//     try {
//       if (isEditing) {
//         await axios.put(`http://localhost:5000/api/product/${currentWatch.id}`, formData);
//       } else {
//         await axios.post('http://localhost:5000/api/product', formData);
//       }
//       fetchProducts();
//       handleClose();
//     } catch (error) {
//       console.error('Error saving product:', error);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm('Are you sure you want to delete this product?')) {
//       try {
//         await axios.delete(`http://localhost:5000/api/FeaturedWatch/delete-FeaturedWatch/${id}`);
//         fetchProducts();
//       } catch (error) {
//         console.error('Error deleting product:', error);
//       }
//     }
//   };

//   const onDrop = (acceptedFiles) => {
//     setCurrentFeaturedWatch((prev) => ({
//       ...prev,
//       image: acceptedFiles[0],
//     }));
//   };

//   const { getRootProps, getInputProps } = useDropzone({
//     onDrop,
//     accept: 'image/*',
//   });

//   return (
//     <>
//     <div style={{ backgroundColor: '#f7f9f6', height: '100vh' }}>
//       <AdminNavbar />
//       <div style={{ marginLeft: '270px', padding: '20px', width: '80%' , backgroundColor: '#f7f9f6', height: '100vh' }}>
//         <Box p={3}>
//           <Typography variant="h4" gutterBottom>
//             Manage Featured Watches
//           </Typography>
//           <Button variant="contained" color="primary" onClick={() => handleOpen()} style={{ marginBottom: '20px', backgroundColor: '#006400' }}>
//             Add Product
//           </Button>
//           <TableContainer component={Paper}>
//             <div style={{marginTop:'10px'}}/>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>ID</TableCell>
//                   <TableCell>Product Name</TableCell>
//                   <TableCell>Image</TableCell>
//                   <TableCell>Price</TableCell>
//                   <TableCell>Price Type</TableCell>
//                   <TableCell>Category ID</TableCell>
//                   <TableCell align="right">Actions</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {watches.map((product) => (
//                   <TableRow key={product.id}>
//                     <TableCell>{product.id}</TableCell>
//                     <TableCell>{product.pname}</TableCell>
//                     <TableCell>{product.image && (
//                       <img 
//                         src={`http://localhost:5000/${product.image}`}
//                           alt={product.pname}
//                           style={{ width: '60px', height: '60px', objectFit: 'cover' }}
//                       />
//                     )}
//                     </TableCell>
//                     <TableCell>{product.price}</TableCell>
//                     <TableCell>{product.pricetype}</TableCell>
//                     <TableCell>{product.categoryid}</TableCell>
//                     <TableCell align="right">
//                       <IconButton color="primary" onClick={() => handleOpen(product)}>
//                         <Edit />
//                       </IconButton>
//                       <IconButton color="secondary" onClick={() => handleDelete(product.id)}>
//                         <Delete />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>

//           <Dialog open={open} onClose={handleClose}>
//             <DialogTitle>{isEditing ? 'Edit product' : 'Add Product'}</DialogTitle>
//             <DialogContent>
//               <TextField
//                 autoFocus
//                 margin="dense"
//                 label="Name"
//                 fullWidth
//                 value={currentWatch.pname}
//                 onChange={(e) => setCurrentFeaturedWatch({ ...currentWatch, fname: e.target.value })}
//                 error={!!errors.fname}
//                 helperText={errors.fname}
//               />
//               <div {...getRootProps()} style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', cursor: 'pointer', borderRadius: '4px', marginTop: '20px' }}>
//                 <input {...getInputProps()} />
//                 <Typography>
//                   {currentWatch.image ? currentWatch.image.name : 'Drop image here or click to upload'}
//                 </Typography>
//                 {errors.image && <Typography color="error">{errors.image}</Typography>}
//               </div>
//               <TextField
//                 margin="dense"
//                 label="price"
//                 fullWidth
//                 value={currentWatch.price}
//                 onChange={(e) => setCurrentFeaturedWatch({ ...currentWatch, price: e.target.value })}
//                 error={!!errors.price}
//                 helperText={errors.price}
//               />
//               <TextField
//               type='text'
//                 margin="dense"
//                 label="pricetype"
//                 fullWidth
//                 value={currentWatch.pricetype}
//                 onChange={(e) => setCurrentFeaturedWatch({ ...currentWatch, pricetype: e.target.value })}
//                 error={!!errors.pricetype}
//                 helperText={errors.pricetype}
//               />
//               <TextField
//               type='text'
//                 margin="dense"
//                 label="categoryid"
//                 fullWidth
//                 value={currentWatch.categoryid}
//                 onChange={(e) => setCurrentFeaturedWatch({ ...currentWatch, categoryid: e.target.value })}
//                 error={!!errors.categoryid}
//                 helperText={errors.categoryid}
//               />
//             </DialogContent>
//             <DialogActions>
//               <Button onClick={handleClose}>Cancel</Button>
//               <Button onClick={handleSave} variant="contained" color="primary">
//                 {isEditing ? 'Update' : 'Add'}
//               </Button>
//             </DialogActions>
//           </Dialog>
//         </Box>
//       </div>
//     </div>
//     </>
//   );
// };

// export default FeaturedWatches;