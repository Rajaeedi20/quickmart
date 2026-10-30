
import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  MapPin,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import quickMartLogo from '../assets/QuickMart_Logo.png'

const userServiceUrl =
  (import.meta.env.VITE_USER_SERVICE_URL || '').replace(/\/+$/, '')

const Header = ({
  currentUser,
  cartItems,
  onLoginSuccess,
  onLogout,
  onRemoveFromCart,
  onProceedToCheckout,
}) => {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flashMessage, setFlashMessage] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCart, setShowCart] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')

  useEffect(() => {
    if (!flashMessage) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setFlashMessage('')
    }, 4000)

    return () => window.clearTimeout(timeoutId)
  }, [flashMessage])

  const openModal = (loginMode = false) => {
    setIsLogin(loginMode)
    setShowModal(true)
    setError('')
  }

  const closeModal = () => {
    setShowModal(false)
    setError('')
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
    })
    setIsSubmitting(false)
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const name = formData.name.trim()
    const mobile = formData.mobile.trim()
    const email = formData.email.trim()

    if (!isLogin && !name) {
      setError('Please enter your full name.')
      return
    }

    if (!isLogin && !/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit Indian mobile number.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }

    if (formData.password.length < 8 || formData.password.length > 72) {
      setError('Password must contain between 8 and 72 characters.')
      return
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Password and Confirm Password do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await axios.post(
        `${userServiceUrl}/api/auth/${isLogin ? 'login' : 'register'}`,
        isLogin
          ? { email, password: formData.password }
          : { name, mobile, email, password: formData.password }
      )

      if (isLogin) {
        onLoginSuccess(response.data)
      }

      setFlashMessage(
        response.data?.message ||
          (isLogin ? 'Login successful.' : 'Registration successful.')
      )
      closeModal()
    } catch (requestError) {
      if (axios.isAxiosError(requestError)) {
        const response = requestError.response
        const responseData = response?.data
        const validationMessage = Array.isArray(responseData?.errors)
          ? responseData.errors
              .map((item) => item.defaultMessage || item.message)
              .filter(Boolean)
              .join(' ')
          : ''
        const serverMessage =
          typeof responseData === 'string'
            ? responseData
            : responseData?.detail ||
              responseData?.message ||
              responseData?.title ||
              validationMessage

        if (response?.status === 409 && !isLogin) {
          setError(
            serverMessage?.toLowerCase().includes('mobile')
              ? 'This mobile number is already registered.'
              : 'This email is already registered. Please log in instead.'
          )
        } else {
          setError(
            serverMessage ||
              (response?.status === 401
                ? 'Invalid email or password.'
                : response?.status === 502
                  ? 'The user service could not be reached. Check its startup logs; if MySQL reports "Access denied" or "using password: NO", set MYSQL_PASSWORD and restart the service.'
                : response?.status === 403
                  ? 'The user service rejected this request. Check its security and CORS configuration.'
                  : response
                    ? `The user service returned HTTP ${response.status}. Please check the server logs.`
                    : 'Cannot connect to the user service. Please make sure it is running.')
          )
        }
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  )
  const cartTotal = cartItems.reduce(
    (total, item) => total + Number(item.price) * item.quantity,
    0
  )

  return (
    <>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top w-100">
        <div className="container-fluid w-100">
          {/* Logo */}
          <a className="navbar-brand p-0 me-lg-4" href="/">
            <img
              src={quickMartLogo}
              alt="QuickMart Logo"
              style={{
                width: '220px',
                height: '55px',
                objectFit: 'contain',
              }}
            />
          </a>

          {/* Delivery Location */}
          <button
            type="button"
            className="btn btn-light d-flex align-items-center gap-2 border-0"
          >
            <MapPin
              size={23}
              className="text-success flex-shrink-0"
            />

            <span className="d-flex flex-column align-items-start">
              <small className="text-secondary">Deliver to</small>
              <span className="fw-semibold small">
                Select location
              </span>
            </span>
          </button>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler ms-auto"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#quickMartNavbar"
            aria-controls="quickMartNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          {/* Navbar Content */}
          <div
            className="collapse navbar-collapse"
            id="quickMartNavbar"
          >
            {/* Search */}
            <form
              className="d-flex flex-grow-1 mx-lg-4 my-3 my-lg-0"
              role="search"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <Search size={19} />
                </span>

                <input
                  type="search"
                  className="form-control bg-light border-start-0 shadow-none"
                  placeholder="Search milk, fruits, vegetables..."
                  aria-label="Search products"
                />
              </div>
            </form>

            {/* Register and Cart */}
            <div className="d-flex align-items-center gap-2 pb-2 pb-lg-0">

  {/* Cart First */}
  <button
    type="button"
    className="btn btn-success d-flex align-items-center gap-2"
    aria-label="Shopping cart"
    onClick={() => setShowCart(true)}
  >
    <ShoppingCart size={19} />
    <span className="badge bg-white text-success rounded-pill">
      {cartCount}
    </span>
  </button>

  {/* Username Dropdown / Register */}
  {currentUser ? (
    <div className="dropdown">
      <button
        type="button"
        className="btn btn-outline-success d-flex align-items-center gap-2"
        onClick={() => setShowUserMenu((prev) => !prev)}
        aria-expanded={showUserMenu}
      >
        <User size={19} />
        {currentUser.name}
        <span>▾</span>
      </button>

      {showUserMenu && (
        <div
          className="dropdown-menu show position-absolute end-0 mt-2 shadow"
          style={{ minWidth: "160px" }}
        >
          <button
            type="button"
            className="dropdown-item"
            onClick={() => setShowUserMenu(false)}
          >
            My Profile
          </button>

          <hr className="dropdown-divider" />

          <button
            type="button"
            className="dropdown-item text-danger"
            onClick={() => {
              onLogout();
              setShowUserMenu(false);
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  ) : (
    <button
      type="button"
      className="btn btn-outline-success d-flex align-items-center gap-2"
      onClick={() => openModal(false)}
    >
      <User size={19} />
      Register
    </button>
  )}

</div>


          </div>
        </div>
      </nav>

      {/* Register / Login Modal */}
      {showModal && (
        <div
          className="qm-modal-backdrop"
        >
          <div
            className="qm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qm-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="qm-modal-header">
              <div>
                <h4 id="qm-modal-title" className="mb-1">
                  {isLogin ? 'Welcome Back!' : 'Create Account'}
                </h4>

                <p className="text-muted mb-0">
                  {isLogin
                    ? 'Login to your QuickMart account'
                    : 'Join QuickMart for easy grocery shopping'}
                </p>
              </div>

              <button
                type="button"
                className="qm-close-btn"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="qm-modal-body">
                {!isLogin && (
                  <div className="mb-3">
                    <label
                      htmlFor="qm-name"
                      className="form-label"
                    >
                      Full Name
                    </label>

                    <input
                      id="qm-name"
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                    />
                  </div>
                )}

                {!isLogin && (
                  <div className="mb-3">
                    <label
                      htmlFor="qm-mobile"
                      className="form-label"
                    >
                      Mobile Number
                    </label>

                    <input
                      id="qm-mobile"
                      type="tel"
                      name="mobile"
                      className="form-control"
                      placeholder="Enter 10-digit mobile number"
                      value={formData.mobile}
                      onChange={handleChange}
                      autoComplete="tel"
                      inputMode="numeric"
                      maxLength={10}
                      pattern="[6-9][0-9]{9}"
                      title="Enter a valid 10-digit Indian mobile number"
                      required
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label
                    htmlFor="qm-email"
                    className="form-label"
                  >
                    Email Address
                    </label>

                    <input
                      id="qm-email"
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      maxLength={150}
                      required
                    />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="qm-password"
                    className="form-label"
                  >
                    Password
                  </label>

                  <input
                    id="qm-password"
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="8 to 72 characters"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete={
                      isLogin ? 'current-password' : 'new-password'
                    }
                    minLength={8}
                    required
                  />
                </div>

                {!isLogin && (
                  <div className="mb-3">
                    <label
                      htmlFor="qm-confirm-password"
                      className="form-label"
                    >
                      Confirm Password
                    </label>

                    <input
                      id="qm-confirm-password"
                      type="password"
                      name="confirmPassword"
                      className="form-control"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger py-2" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-success w-100 py-2 fw-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? 'Please wait...'
                    : isLogin
                      ? 'Login'
                      : 'Create Account'}
                </button>

                <p className="text-center mt-3 mb-0">
                  {isLogin
                    ? "Don't have an account? "
                    : 'Already have an account? '}

                  <button
                    type="button"
                    className="qm-text-btn"
                    onClick={() => {
                      setIsLogin((previous) => !previous)
                      setError('')
                    }}
                  >
                    {isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCart && (
        <div className="qm-modal-backdrop" onClick={() => setShowCart(false)}>
          <section
            className="qm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qm-cart-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="qm-modal-header">
              <div>
                <h4 id="qm-cart-title" className="mb-1">Your Cart</h4>
                <p className="text-muted mb-0">
                  {currentUser ? `Cart for ${currentUser.name}` : 'Sign in to view your cart'}
                </p>
              </div>
              <button
                type="button"
                className="qm-close-btn"
                onClick={() => setShowCart(false)}
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>
            <div className="qm-modal-body">
              {!currentUser ? (
                <p className="mb-0">Please log in to add and view your cart items.</p>
              ) : cartItems.length === 0 ? (
                <p className="mb-0">Your cart is empty.</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {cartItems.map((item) => (
                    <div
                      className="d-flex align-items-center gap-3"
                      key={item.id}
                    >
                      <img
                        src={item.thumbnail}
                        alt=""
                        width="56"
                        height="56"
                        className="rounded object-fit-contain"
                      />
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{item.title}</div>
                        <small className="text-muted">
                          ${Number(item.price).toFixed(2)} × {item.quantity}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onRemoveFromCart(item.id)}
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {currentUser && cartItems.length > 0 && (
                <div className="border-top mt-4 pt-3">
                  <div className="d-flex justify-content-between fw-bold mb-3">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-success w-100"
                    onClick={() => {
                      onProceedToCheckout(cartItems)
                      setShowCart(false)
                      navigate('/checkout')
                    }}
                  >
                    Proceed to pay
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
      {flashMessage && (
        <div
          className="qm-flash-message alert alert-success"
          role="status"
          aria-live="polite"
        >
          <span>{flashMessage}</span>
          <button
            type="button"
            className="qm-flash-close"
            onClick={() => setFlashMessage('')}
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  )
}

export default Header;
