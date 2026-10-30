
import { useEffect, useState } from 'react'
import './App.css'
import ScrollProgress from './Pages/ScrollProgress'
import Header from './Pages/Header'
import Body from './Pages/Body'
import Footer from './Pages/Footer'
import Checkout from './Pages/Checkout'
import { Route, Routes } from 'react-router-dom'

const getStoredUser = () => {
  try {
    const user = JSON.parse(sessionStorage.getItem('quickmartUser') || 'null')
    return user?.userId ? user : null
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
  const [currentUser, setCurrentUser] = useState(getStoredUser)
  const [cartItems, setCartItems] = useState(() =>
    getStoredCart(getStoredUser()?.userId)
  )
  const [checkoutItems, setCheckoutItems] = useState([])

  useEffect(() => {
    if (currentUser) {
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
    }

    sessionStorage.setItem('quickmartUser', JSON.stringify(signedInUser))
    setCurrentUser(signedInUser)
    setCartItems(getStoredCart(signedInUser.userId))
    setCheckoutItems([])
  }

  const handleLogout = () => {
    sessionStorage.removeItem('quickmartUser')
    setCurrentUser(null)
    setCartItems([])
    setCheckoutItems([])
  }

  const handleAddToCart = (product) => {
    if (!currentUser) {
      return false
    }

    setCartItems((previousItems) => {
      const existingItem = previousItems.find((item) => item.id === product.id)
      return existingItem
        ? previousItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...previousItems, { ...product, quantity: 1 }]
    })

    return true
  }

  const handleRemoveFromCart = (productId) => {
    if (!currentUser) {
      return
    }

    setCartItems((previousItems) => {
      return previousItems.filter((item) => item.id !== productId)
    })
  }

  const handlePaymentComplete = () => {
    if (!currentUser) {
      return
    }

    localStorage.setItem(`quickmartCart_${currentUser.userId}`, '[]')
    setCartItems([])
    setCheckoutItems([])
  }

  return (
    <>
      <ScrollProgress />
      <Header
        currentUser={currentUser}
        cartItems={cartItems}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        onRemoveFromCart={handleRemoveFromCart}
        onProceedToCheckout={(items) => setCheckoutItems(items)}
      />
      <Routes>
        <Route
          path="/"
          element={<Body currentUser={currentUser} onAddToCart={handleAddToCart} />}
        />
        <Route
          path="/checkout"
          element={
            <Checkout
              currentUser={currentUser}
              cartItems={checkoutItems.length ? checkoutItems : cartItems}
              onPaymentComplete={handlePaymentComplete}
            />
          }
        />
        <Route
          path="*"
          element={<Body currentUser={currentUser} onAddToCart={handleAddToCart} />}
        />
      </Routes>
      <Footer />
    </>
  )
}

export default App
