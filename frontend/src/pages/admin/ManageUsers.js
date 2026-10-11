import { useState,useEffect } from "react";
import {DataGrid} from '@mui/x-data-grid';
import { IconButton,Button,Dialog,DialogContent,DialogTitle,TextField,DialogActions, } from "@mui/material";
import {Edit,Delete} from '@mui/icons-material';
import axios from 'axios';
import AdminNavbar from "../../Component/AdminNavbar";

const ManageUsers=()=>{
    const[users,setUsers]=useState([]);
    const[open,setOpen]=useState(false);
    const[formData,setFormData]=useState({name:'',email:'',password:'',role:'user'}); //exchange attributes with attributes in category
    const[isEditing,setIsEditing]=useState(false);
    const[editUserId,setEditUserId]=useState(null);
    const[error,setError]=useState(null);

    useEffect(()=>{
        fetchUsers();
    },[]);
    const fetchUsers=async()=>{
        try{
            const response=await axios.get('http://localhost:5000/api/auth/users');
            const mappedUsers=response.data
                .filter(user=>user.id!==undefined&&user.id!==null)
                .map(user=>({
                    id:user.id,
                    name:user.name,
                    email:user.email,
                    role:user.role,
                    created_at:user.created_at,
            }));
            setUsers(mappedUsers);
            setError(null)
        }catch(error){
            const errorMessage=error.response?.data||error.message;
            setError(`Failed to fetch users: ${typeof errorMessage==='string'?errorMessage:JSON.stringify(errorMessage)}`);
        }
    };
    const handleOpen=()=>{
        setIsEditing(false);
        setFormData({name:'',email:'',password:'',role:'user'});
        setOpen(true);
    };

    const handleClose=()=> setOpen(false);
    const handleChange=(e)=>{
        const{name,value}=e.target;
        setFormData(prev=>({...prev,[name]:value})); //
    };

    const handleSubmit=async()=>{
        try{
            if(isEditing){
                const updateData={name:formData.name,email:formData.email,role:formData.role};
                await axios.put(`http://localhost:5000/api/auth/users/${editUserId}`,formData);
            }else{
                await axios.post('http://localhost:5000/api/auth/register',formData);
            }
            fetchUsers();
            handleClose();
        }catch(error){
            const errorMessage=error.response?.data || error.message;
            setError("failed to save user:${typeof errorMessage==='string'?errorMessage:JSON.stringify(errorMessage)}");
        }
    };
    const handleEdit=(id)=>{
        const user=users.find(user=>user.id===id);
        setFormData({name:user.name,email:user.email,password:'',role:user.role});
        setEditUserId(id);
        setIsEditing(true);
        setOpen(true);
    };
    const handleDelete=async(id)=>{
        try{
            await axios.delete(`http://localhost:5000/api/auth/users/${id}`);
            fetchUsers();
        }catch(error){
            const errorMessage=error.response?.data || error.message;
            setError(`Failed to delete user:${typeof errorMessage==='string'?errorMessage:JSON.stringify(errorMessage)}`);
        }
    };
    const columns=[
        {field:'id',headerName:'ID',width:90},
        {field:'name',headerName:'Name',width:200},
        {field:'email',headerName:'Email',width:200},
        {field:'role',headerName:'Role',width:120},
        {field:'created_at',headerName:'Created at',width:180},
        {
            field:'Actions',
            headerName:'Actions',
            width:150,
            renderCell:(params)=>(
                <>
                    <IconButton onClick={()=>handleEdit(params.row.id)}color='primary'>
                        <Edit/>
                    </IconButton>
                    <IconButton onClick={()=> handleDelete(params.row.id)}color='secondary'>
                        <Delete/>
                    </IconButton>
                </>
            ),
        },
    ];
    return(
        <div className='adm-page'>
            {/*Sidebar*/}
            <AdminNavbar/>

            {/*Main content*/}
            <div className='adm-content'>
                <h2>Manage Users</h2>
                {error && <p className='adm-error'>{error}</p>}
                <Button variant="contained" color='primary' onClick={handleOpen} style={{marginBottom:'10px'}}>
                    Add User
                </Button>
                <div className='adm-grid'>
                    <DataGrid
                    rows={users}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5,10,20]}
                    checkboxSelection
                    />
                </div>

                {/* add/edit dialog*/}
                <Dialog open={open} onClose={handleClose}>
                    <DialogTitle>{isEditing ?'Edit User':'Add User'}</DialogTitle>
                    <DialogContent>
                        <TextField
                        margin='dense'
                        label='Name'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        />
                        <TextField
                        margin='dense'
                        label='Email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                        required
                        />
                        {!isEditing?(
                            <TextField
                            margin='dense'
                            label='Password'
                            name='password'
                            type='password'
                            value={formData.password}
                            onChange={handleChange}
                            fullWidth
                            required
                            />
                        
                        ):null}
                        <TextField
                        margin='dense'
                        label='Role'
                        name='role'
                        value={formData.role}
                        onChange={handleChange}
                        fullWidth
                        required
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color='secondary'>Cancel</Button>
                        <Button onClick={handleSubmit} color='primary'>{isEditing?"Update":"Add"}</Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    );
};
export default ManageUsers;