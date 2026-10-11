import React from "react";
import { NavLink } from 'react-router-dom';
import LogoutButton from "./LogoutButton";

// VISUAL ONLY: same links/layout as before, restyled via .adm-* classes from
// AdminTheme.css (dark gold sidebar). NavLink adds an "active" class on the
// current route for the gold highlight; navigation behavior is unchanged.
const AdminNavbar=()=>{
    const linkClass=({isActive})=>isActive?'adm-nav-link adm-nav-link--active':'adm-nav-link';
    return(
        <div className='adm-side'>
        <nav className='adm-nav'>
            <NavLink to='/AdminDash' className={linkClass}>Dashboard</NavLink>
            <NavLink to='/Manage-Users' className={linkClass}>Manage Users</NavLink>
            <NavLink to='/Manage-Category' className={linkClass}>Manage Categories</NavLink>
            <NavLink to='/Manage-Product' className={linkClass}>Manage Products</NavLink>
            <NavLink to='/Manage-Orders' className={linkClass}>Manage Orders</NavLink>
            <NavLink to='/Manage-Cart-Details' className={linkClass}>Cart Details</NavLink>
            {/* <NavLink to='/Featured-Watches' className={linkClass}>Featured Watches</NavLink> */}
            <div className='adm-nav-logout'>
                <LogoutButton/>
            </div>
        </nav>
        </div>
    );
};
export default AdminNavbar;