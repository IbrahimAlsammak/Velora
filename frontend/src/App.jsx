import { Outlet, Route, Routes } from 'react-router-dom'
import AddedToBag from './components/AddedToBag.jsx'
import Footer from './components/Footer.jsx'
import AdminLayout from './components/admin/AdminLayout.jsx'
import RequireAdmin from './components/admin/RequireAdmin.jsx'
import Navbar from './components/Navbar.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import AdminLogin from './pages/admin/AdminLogin.jsx'
import Categories from './pages/admin/Categories.jsx'
import Customers from './pages/admin/Customers.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import Delivery from './pages/admin/Delivery.jsx'
import MyAccount from './pages/admin/MyAccount.jsx'
import AdminOrderDetail from './pages/admin/OrderDetail.jsx'
import AdminOrders from './pages/admin/Orders.jsx'
import AdminProductForm from './pages/admin/ProductForm.jsx'
import AdminProducts from './pages/admin/Products.jsx'
import Reports from './pages/admin/Reports.jsx'
import AccountLayout from './pages/account/AccountLayout.jsx'
import MyOrders from './pages/account/MyOrders.jsx'
import Overview from './pages/account/Overview.jsx'
import PasswordSecurity from './pages/account/PasswordSecurity.jsx'
import PersonalInfo from './pages/account/PersonalInfo.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Contact from './pages/Contact.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import NotFound from './pages/NotFound.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import ProductPage from './pages/ProductPage.jsx'
import Register from './pages/Register.jsx'
import Shop from './pages/Shop.jsx'

/** The "map" of the website: which page shows at which address. */
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ----- The shop (customers) ----- */}
        <Route element={<ShopLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:orderNumber" element={<OrderConfirmation />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          {/* My account: one page per section */}
          <Route path="/account" element={<AccountLayout />}>
            <Route index element={<Overview />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="details" element={<PersonalInfo />} />
            <Route path="password" element={<PasswordSecurity />} />
          </Route>
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ----- The admin panel (you) ----- */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:orderNumber" element={<AdminOrderDetail />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id" element={<AdminProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="customers" element={<Customers />} />
          <Route path="delivery" element={<Delivery />} />
          <Route path="account" element={<MyAccount />} />
        </Route>
      </Routes>
    </>
  )
}

/** Top bar + page + footer, used by all shop pages. */
function ShopLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AddedToBag />
    </div>
  )
}
