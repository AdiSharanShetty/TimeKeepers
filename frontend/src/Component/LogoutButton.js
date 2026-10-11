import react from 'react';
import { useNavigate } from 'react-router-dom';
import {Button} from '@mui/material';

const LogoutButton=()=>{
    const navigate=useNavigate();

    const handleLogout=()=>{
        localStorage.removeItem('id');
        navigate('/');
    };
    return(
        <Button variant='contained' color='primary' onClick={handleLogout}>
        Logout
        </Button>
    );
};
export default LogoutButton;