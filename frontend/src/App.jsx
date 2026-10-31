
import { useCallback, useEffect, useState } from 'react'
import './App.css'
import ScrollProgress from './Pages/ScrollProgress'
import Header from './Pages/Header'
import Body from './Pages/Body'
import Footer from './Pages/Footer'
import Checkout from './Pages/Checkout'
import AdminDashboard from './Pages/AdminDashboard'
import CustomerProfile from './Pages/CustomerProfile'
import axios from 'axios'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

const getStoredUser = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem('quickmartUser') || 'null')
    return user?.role === 'ADMIN'
      ? user?.email && user?.name ? user : null
      : user?.userId ? user : null
  } catch {
    return null
  }
}

const getStoredCart = (userId) => {
  if (!userId) {
    return []
  }

  try {
    const cart = JSON.parse(localStorage.getItem(`quickmartCart_${userId}`) || '[]')
    return Array.isArray(cart) ? cart : []
  } catch {
    return []
  }
}

function App() {
  const location = useLocation()
  const [currentUser, setCurrentUser] = useState(getStoredUser)
  const [cartItems, setCartItems] = useState(() =>
    getStoredCart(getStoredUser()?.userId)
  )
  const [checkoutItems, setCheckoutItems] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [flashMessage, setFlashMessage] = useState(null)

  useEffect(() => {
    if (!flashMessage) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setFlashMessage(null), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [flashMessage])

  const showFlashMessage = useCallback((message, type = 'success') => {
    setFlashMessage({ message, type })
  }, [])

  useEffect(() => {
    if (currentUser?.userId) {
      localStorage.setItem(
        `quickmartCart_${currentUser.userId}`,
        JSON.stringify(cartItems)
      )
    }
  }, [cartItems, currentUser])

  const handleLoginSuccess = (user) => {
    if (!user?.userId || !user?.name) {
      return
    }

    const signedInUser = {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: 'CUSTOMER',
    }

    sessionStorage.setItem('quickmartUser', JSON.stringify(signedInUser))
    setCurrentUser(signedInUser)
    setCartItems(getStoredCart(signedInUser.userId))
    setCheckoutItems([])
  }

  const handleAdminLoginSuccess = (admin) => {
    if (!admin?.name || !admin?.email || admin?.role !== 'ADMIN') {
      return
    }

    const signedInAdmin = {
      name: admin.name,
      email: admin.email,
      role: 'ADMIN',
    }

    sessionStorage.setItem('quickmartUser', JSON.stringify(signedInAdmin))
    setCurrentUser(signedInAdmin)
    setCartItems([])
    setCheckoutItems([])
  }

  const handleLogout = useCallback(async () => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'CUSTOMER') {
      try {
        await axios.post(
          currentUser.role === 'ADMIN' ? '/api/admin/logout' : '/api/auth/logout',
          {},
          { withCredentials: true }
        )
      } catch (error) {
        if (
          !axios.isAxiosError(error) ||
          ![401, 403].includes(error.response?.status)
        ) {
          throw error
        }
      }
    }

    sessionStorage.removeItem('quickmartUser')
    setCurrentUser(null)
    setCartItems([])
    setCheckoutItems([])
  }, [currentUser])

  const handleAddToCart = (product) => {
    if (!currentUser) {
      return false
    }

    const availableQuantity = Number(product.availableQuantity ?? product.quantity)
    const existingItem = cartItems.find((item) => item.id === product.id)
    if (
      Number.isFinite(availableQuantity) &&
      (availableQuantity <= 0 ||
        (existingItem?.quantity || 0) >= availableQuantity)
    ) {
      return false
    }

    setCartItems((previousItems) => {
      return existingItem
        ? previousItems.map((item) =>
            item.id === product.id
              ? { ...item, availableQuantity, quantity: item.quantity + 1 }
              : item
          )
        : [...previousItems, { ...product, availableQuantity, quantity: 1 }]
    })

    return true
  }

  const handleUpdateCartQuantity = (productId, change) => {
    const updateQuantity = (items) =>
      items.flatMap((item) => {
        if (item.id !== productId) {
          return [item]
        }

        const quantity = item.quantity + change
        const availableQuantity = Number(item.availableQuantity)
        if (
          quantity < 1 ||
          (change > 0 &&
            Number.isFinite(availableQuantity) &&
            quantity > availableQuantity)
        ) {
          return [item]
        }

        return [{ ...item, quantity }]
      })

    setCartItems(updateQuantity)
    setCheckoutItems(updateQuantity)
  }

  const handleRemoveFromCart = (productId) => {
    if (!currentUser) {
      return
    }

    const removeItem = (items) => items.filter((item) => item.id !== productId)
    setCartItems(removeItem)
    setCheckoutItems(removeItem)
  }

  const handlePaymentComplete = () => {
    if (!currentUser) {
      return
    }

    localStorage.setItem(`quickmartCart_${currentUser.userId}`, '[]')
    setCartItems([])
    setCheckoutItems([])
  }

  const isAdminDashboard =
    location.pathname === '/admin' && currentUser?.role === 'ADMIN'

  return (
    <>
      {!isAdminDashboard && (
        <>
          <ScrollProgress />
          <Header
            currentUser={currentUser}
            cartItems={cartItems}
            onLoginSuccess={handleLoginSuccess}
            onAdminLoginSuccess={handleAdminLoginSuccess}
            onLogout={handleLogout}
            onRemoveFromCart={handleRemoveFromCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onProceedToCheckout={(items) => setCheckoutItems(items)}
            onFlashMessage={showFlashMessage}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </>
      )}
      <Routes>
        <Route
          path="/"
          element={
            currentUser?.role === 'ADMIN'
              ? <Navigate to="/admin" replace />
              : <Body currentUser={currentUser} onAddToCart={handleAddToCart} searchQuery={searchQuery} />
          }
        />
        <Route
          path="/checkout"
          element={
            currentUser?.role === 'ADMIN'
              ? <Navigate to="/admin" replace />
              : <Checkout
                  currentUser={currentUser}
                  cartItems={checkoutItems.length ? checkoutItems : cartItems}
                  onPaymentComplete={handlePaymentComplete}
                />
          }
        />
        <Route
          path="/admin"
          element={
            currentUser?.role === 'ADMIN'
              ? <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="/profile"
          element={
            currentUser?.role === 'CUSTOMER'
              ? <CustomerProfile currentUser={currentUser} />
              : <Navigate to="/" replace />
          }
        />
        <Route
          path="*"
          element={
            currentUser?.role === 'ADMIN'
              ? <Navigate to="/admin" replace />
              : <Body currentUser={currentUser} onAddToCart={handleAddToCart} searchQuery={searchQuery} />
          }
        />
      </Routes>
      {!isAdminDashboard && <Footer />}
      {flashMessage && (
        <div
          className={`qm-flash-message alert alert-${flashMessage.type}`}
          role="status"
          aria-live="polite"
        >
          <span>{flashMessage.message}</span>
          <button
            type="button"
            className="qm-flash-close"
            onClick={() => setFlashMessage(null)}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}

export default App
