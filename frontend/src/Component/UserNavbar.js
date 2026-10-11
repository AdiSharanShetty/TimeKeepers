import React from "react";
import {Link} from 'react-router-dom';
import LogoutButton from "./LogoutButton";

const UserNavbar=()=>{
    return(
        <div style={{ position: 'fixed', top: 0, left: 0, width: '250px' }}>
        <nav style={{
            display:'flex',
            flexDirection:'column',
            gap:'20px',
            padding:'20px',
            background:'#f0f0f0',
            height:'100vh',
            width:'100%',
            overflowY:'auto',
            textAlign:'center'
        }}>
            <Link to='/UserDash' style={linkStyle}>Dashboard</Link>
            <LogoutButton/>
        </nav>
        </div>
    );
};
const linkStyle={
    color:'#333',
    textDecoration:'none',
    fontSize:'18px',
    padding:'10px 0',
    borderBottom:'1px solid #ddd',
    textAlign:'center'
};
export default UserNavbar;