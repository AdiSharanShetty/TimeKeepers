import Register from './Register'
import Login from './Login'
import AdminDash from './pages/admin/AdminDash'
import {BrowserRouter,Routes,Route} from 'react-router-dom';
import ManageUsers from './pages/admin/ManageUsers';
import ManageCategory from './pages/admin/ManageCategory';
import ManageProduct from './pages/admin/ManageProduct';
import ManageOrders from './pages/admin/ManageOrders';
import ManageOrderTransactions from './pages/admin/ManageOrderTransactions';
import UserDash from './pages/user/UserDash';
import Home from './pages/user/Home';
import BuyNowPage from './pages/user/BuyNowPage';
import CartPage from './pages/user/CartPage';
import WatchDetails from './pages/user/WatchDetails';
import MyOrdersPage from './pages/user/MyOrdersPage';
import FeaturedWatches from './pages/admin/FeaturedWatches';
import ManageCartDetails from './pages/admin/ManageCartDetails';
import AdminTheme from './pages/admin/AdminTheme';


function App() {
  return(
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/Register" element={<Register/>}/>
      {/* Admin routes are wrapped in AdminTheme: visual-only dark/gold MUI theme
          (see pages/admin/AdminTheme.js). Routes, guards, and data are unchanged. */}
      <Route path="/AdminDash" element={<AdminTheme><AdminDash/></AdminTheme>}/>
      <Route path="/Manage-Users" element={<AdminTheme><ManageUsers/></AdminTheme>}/>
      <Route path="/Manage-Category" element={<AdminTheme><ManageCategory/></AdminTheme>}/>
      <Route path="/Manage-Product" element={<AdminTheme><ManageProduct/></AdminTheme>}/>
      <Route path="/Manage-Orders" element={<AdminTheme><ManageOrders/></AdminTheme>}/>
      <Route path="/Manage-OrderTransactions" element={<AdminTheme><ManageOrderTransactions/></AdminTheme>}/>
      <Route path="/Manage-Cart-Details" element={<AdminTheme><ManageCartDetails/></AdminTheme>}/>
      <Route path="/Featured-Watches" element={<AdminTheme><FeaturedWatches/></AdminTheme>}/>
      <Route path="/Manage-FeaturedWatches" element={<AdminTheme><FeaturedWatches/></AdminTheme>}/>
      <Route path="/UserDash" element={<UserDash/>}/>
      <Route path='/Home' element={<Home/>}/>
      <Route path='/buy-now' element={<BuyNowPage/>}/>
      <Route path='/cart' element={<CartPage/>}/>
      <Route path='/orders' element={<MyOrdersPage/>}/>
      <Route path='/watch/:id' element={<WatchDetails/>}/>
    </Routes>
    </BrowserRouter>
    </>
  );
}
export default App;
