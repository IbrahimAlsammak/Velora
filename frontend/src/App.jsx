import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { getStoreStatus } from './api/catalog.js'
import AddedToBag from './components/AddedToBag.jsx'
import Footer from './components/Footer.jsx'
import MaintenancePage from './components/MaintenancePage.jsx'
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
import { useAuth } from './context/useAuth.js'
import useLoad from './hooks/useLoad.js'

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

/**
 * Top bar + page + footer, used by all shop pages.
 * While the shop is under maintenance, customers see the "back soon" page instead.
 * You (admin) still see the shop, with a reminder bar on top.
 */
function ShopLayout() {
  const { pathname } = useLocation()
  const { isAdmin } = useAuth()
  // Check again on every page change, so customers notice quickly when you close/open the shop
  const { data: status, error, reload } = useLoad(getStoreStatus, [pathname])

  if (!status && !error) return null // first check still running (a split second)
  if (status?.maintenance && !isAdmin) return <MaintenancePage onCheckAgain={reload} />

  return (
    <div className="min-h-screen flex flex-col">
      {status?.maintenance && (
        <div className="bg-red-700 px-4 py-2 text-center text-sm text-white">
          ⚠️ Maintenance mode is ON - customers see the &quot;back soon&quot; page. Only you can see the shop.{' '}
          <Link to="/admin" className="font-medium underline">Open it in the admin panel</Link>
        </div>
      )}
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AddedToBag />
    </div>
  )
}
