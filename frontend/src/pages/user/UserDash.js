import React from "react";
import AdminNavbar from '../../Component/UserNavbar';

const UserDash=()=>{
    return(
        <div style={{display:'flex'}}>
            <AdminNavbar/>
            <div style={{marginLeft:'650px',padding:'20px',width:'100%'}}>
                <h1>Welcome to TimeKeepers</h1>
            </div>
        </div>
    );
};
export default UserDash;