
import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import quickMartLogo from '../assets/QuickMart_Logo.png'

const Header = ({
  currentUser,
  cartItems,
  onLoginSuccess,
  onAdminLoginSuccess,
  onLogout,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onProceedToCheckout,
  onFlashMessage,
  searchQuery,
  onSearchChange,
}) => {
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [isLogin, setIsLogin] = useState(false)
  const [isAdminLogin, setIsAdminLogin] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCart, setShowCart] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [deliveryLocations, setDeliveryLocations] = useState({})
  const [locationDraft, setLocationDraft] = useState({ address: '', pincode: '' })

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')

  const locationStorageKey = currentUser?.userId
    ? `quickmartDeliveryLocation_${currentUser.userId}`
    : 'quickmartDeliveryLocation_guest'
  const deliveryLocation = useMemo(() => {
    if (Object.hasOwn(deliveryLocations, locationStorageKey)) {
      return deliveryLocations[locationStorageKey]
    }

    try {
      return JSON.parse(localStorage.getItem(locationStorageKey) || 'null')
    } catch (storageError) {
      console.error('Could not load the saved delivery location.', storageError)
      return null
    }
  }, [deliveryLocations, locationStorageKey])

  useEffect(() => {
    if (!error) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setError(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [error])

  const openModal = (loginMode = false) => {
    setIsLogin(loginMode)
    setIsAdminLogin(false)
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
        `/api/${isAdminLogin ? 'admin/login' : `auth/${isLogin ? 'login' : 'register'}`}`,
        isLogin
          ? { email, password: formData.password }
          : { name, mobile, email, password: formData.password },
        { withCredentials: true }
      )

      if (isAdminLogin) {
        onAdminLoginSuccess(response.data)
        navigate('/admin')
      } else if (isLogin) {
        onLoginSuccess(response.data)
        navigate('/')
      }

      onFlashMessage(
        response.data?.message ||
          (isLogin ? 'Login successful.' : 'Registration successful.'),
        'success'
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
  const saveDeliveryLocation = (event) => {
    event.preventDefault()
    const nextLocation = {
      address: locationDraft.address.trim(),
      pincode: locationDraft.pincode.trim(),
    }
    if (!nextLocation.address || !/^\d{6}$/.test(nextLocation.pincode)) {
      onFlashMessage('Enter your delivery area and a valid 6-digit PIN code.', 'danger')
      return
    }

    const storageKey = currentUser?.userId
      ? `quickmartDeliveryLocation_${currentUser.userId}`
      : 'quickmartDeliveryLocation_guest'
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextLocation))
      setDeliveryLocations((previous) => ({
        ...previous,
        [storageKey]: nextLocation,
      }))
      setShowLocationModal(false)
      onFlashMessage('Delivery location saved.', 'success')
    } catch (storageError) {
      console.error('Could not save the delivery location.', storageError)
      onFlashMessage('Could not save your delivery location on this device.', 'danger')
    }
  }

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
            onClick={() => {
              setLocationDraft({
                address: deliveryLocation?.address || '',
                pincode: deliveryLocation?.pincode || '',
              })
              setShowLocationModal(true)
            }}
          >
            <MapPin
              size={23}
              className="text-success flex-shrink-0"
            />

            <span className="d-flex flex-column align-items-start">
              <small className="text-secondary">Deliver to</small>
              <span className="fw-semibold small">
                {deliveryLocation
                  ? `${deliveryLocation.address}, ${deliveryLocation.pincode}`
                  : 'Select location'}
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
                  value={searchQuery || ''}
                  onChange={(event) => onSearchChange(event.target.value)}
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
            onClick={() => {
              if (currentUser.role === 'ADMIN') {
                navigate('/admin')
              } else {
                navigate('/profile')
              }
              setShowUserMenu(false)
            }}
          >
            {currentUser.role === 'ADMIN' ? 'Admin dashboard' : 'My Profile'}
          </button>

          <hr className="dropdown-divider" />

          <button
            type="button"
            className="dropdown-item text-danger"
            onClick={async () => {
              try {
                await onLogout()
                setShowUserMenu(false)
              } catch {
                onFlashMessage('Could not log out. Please try again.', 'danger')
              }
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

      {showLocationModal && (
        <div
          className="qm-modal-backdrop"
          onClick={() => setShowLocationModal(false)}
        >
          <section
            className="qm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qm-location-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="qm-modal-header">
              <div>
                <h4 id="qm-location-title" className="mb-1">Delivery location</h4>
                <p className="text-muted mb-0">Choose where you want your order delivered.</p>
              </div>
              <button
                type="button"
                className="qm-close-btn"
                onClick={() => setShowLocationModal(false)}
                aria-label="Close location form"
              >
                <X size={22} />
              </button>
            </div>
            <form onSubmit={saveDeliveryLocation}>
              <div className="qm-modal-body">
                <label htmlFor="qm-delivery-address" className="form-label">Area / city</label>
                <input
                  id="qm-delivery-address"
                  className="form-control mb-3"
                  value={locationDraft.address}
                  onChange={(event) =>
                    setLocationDraft((previous) => ({
                      ...previous,
                      address: event.target.value,
                    }))
                  }
                  placeholder="e.g. Madhapur, Hyderabad"
                  maxLength={120}
                  required
                />
                <label htmlFor="qm-delivery-pincode" className="form-label">PIN code</label>
                <input
                  id="qm-delivery-pincode"
                  className="form-control mb-3"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={locationDraft.pincode}
                  onChange={(event) =>
                    setLocationDraft((previous) => ({
                      ...previous,
                      pincode: event.target.value.replace(/\D/g, '').slice(0, 6),
                    }))
                  }
                  placeholder="6-digit PIN code"
                  required
                />
                <button type="submit" className="btn btn-success w-100">
                  Save delivery location
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

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
                  {isAdminLogin
                    ? 'Admin Login'
                    : isLogin ? 'Welcome Back!' : 'Create Account'}
                </h4>

                <p className="text-muted mb-0">
                  {isAdminLogin
                    ? 'Sign in to manage QuickMart customers'
                    : isLogin
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
                  {isAdminLogin
                    ? 'Admin login'
                    : isLogin
                    ? "Don't have an account? "
                    : 'Already have an account? '}

                  <button
                    type="button"
                    className="qm-text-btn"
                    onClick={() => {
                      if (isAdminLogin) {
                        setIsAdminLogin(false)
                        setIsLogin(true)
                      } else {
                        setIsLogin((previous) => !previous)
                      }
                      setError('')
                    }}
                  >
                    {isAdminLogin ? 'Customer login' : isLogin ? 'Register' : 'Login'}
                  </button>
                </p>
                {!isAdminLogin && isLogin && (
                  <p className="text-center mt-2 mb-0">
                    <button
                      type="button"
                      className="qm-text-btn"
                      onClick={() => {
                        setIsAdminLogin(true)
                        setIsLogin(true)
                        setError('')
                      }}
                    >
                      Admin login
                    </button>
                  </p>
                )}
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
                          ₹{Number(item.price).toFixed(2)} × {item.quantity}
                        </small>
                        {Number.isFinite(Number(item.availableQuantity)) && (
                          <small className="d-block text-muted">
                            {item.availableQuantity} available
                          </small>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => onUpdateCartQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease ${item.title} quantity`}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="fw-semibold" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => onUpdateCartQuantity(item.id, 1)}
                          disabled={
                            Number.isFinite(Number(item.availableQuantity)) &&
                            item.quantity >= Number(item.availableQuantity)
                          }
                          aria-label={`Increase ${item.title} quantity`}
                        >
                          <Plus size={16} />
                        </button>
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
                    <span>₹{cartTotal.toFixed(2)}</span>
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
    </>
  )
}

export default Header;
