import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChartNoAxesCombined,
  CircleAlert,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBasket,
  Sparkles,
  Tag,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import AdminHeader from './AdminHeader'
import './AdminDashboard.css'

const requestCustomers = async () => {
  const response = await axios.get('/api/admin/customers', {
    withCredentials: true,
  })

  if (!Array.isArray(response.data)) {
    throw new Error('The user service returned an invalid customer list.')
  }

  return response.data
}

const requestAdminPaymentReports = async () => {
  const response = await axios.get('/api/admin/payment-reports', {
    withCredentials: true,
  })

  if (!Array.isArray(response.data)) {
    throw new Error('The user service returned an invalid payment report.')
  }

  return response.data
}

const getRequestError = (requestError, fallback) => {
  if (axios.isAxiosError(requestError)) {
    const data = requestError.response?.data
    return requestError.response?.status === 401 || requestError.response?.status === 403
      ? 'Your admin session is no longer active. Please log in again.'
      : (typeof data === 'string' ? data : data?.detail || data?.message) ||
          requestError.message ||
          fallback
  }

  return requestError instanceof Error ? requestError.message : fallback
}

const formatDate = (value) => {
  if (!value) {
    return 'Not recorded'
  }

  const localDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value)
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  const date = localDateTime && !hasTimezone
    ? new Date(
        Number(localDateTime[1]),
        Number(localDateTime[2]) - 1,
        Number(localDateTime[3]),
        Number(localDateTime[4]),
        Number(localDateTime[5]),
        Number(localDateTime[6] || 0)
      )
    : new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Not recorded'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

const currency = (value) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const emptyProduct = {
  name: '',
  categoryId: '',
  price: '',
  quantity: '',
  description: '',
  imageUrl: '',
}

const getStoredNotificationState = (storageKey) => {
  try {
    const storedState = JSON.parse(localStorage.getItem(storageKey) || '{}')
    return {
      read: new Set(Array.isArray(storedState.read) ? storedState.read.map(String) : []),
      dismissed: new Set(
        Array.isArray(storedState.dismissed) ? storedState.dismissed.map(String) : []
      ),
    }
  } catch (storageError) {
    console.error('Could not load saved admin notifications.', storageError)
    return { read: new Set(), dismissed: new Set() }
  }
}

const saveNotificationState = (storageKey, notificationState) => {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        read: [...notificationState.read],
        dismissed: [...notificationState.dismissed],
      })
    )
  } catch (storageError) {
    console.error('Could not save admin notification history.', storageError)
  }
}

const AdminDashboard = ({ currentUser, onLogout }) => {
  const notificationStorageKey =
    `quickmartAdminNotifications_${encodeURIComponent((currentUser.email || currentUser.name).toLowerCase())}`
  const [activeSection, setActiveSection] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [customers, setCustomers] = useState([])
  const [paymentReports, setPaymentReports] = useState([])
  const [search, setSearch] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notificationState, setNotificationState] = useState(() =>
    getStoredNotificationState(notificationStorageKey)
  )
  const [refreshKey, setRefreshKey] = useState(0)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [productForm, setProductForm] = useState(emptyProduct)
  const [successMessage, setSuccessMessage] = useState('')
  const [flashError, setFlashError] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!successMessage && !flashError) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('')
      setFlashError('')
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [successMessage, flashError])

  useEffect(() => {
    let active = true

    const fetchDashboardData = async () => {
      setIsLoading(true)
      setErrors({})

      const results = await Promise.allSettled([
        axios.get('/api/products'),
        axios.get('/api/categories'),
        requestCustomers(),
        requestAdminPaymentReports(),
      ])
      if (!active) {
        return
      }

      const nextErrors = {}
      const [productsResult, categoriesResult, customersResult, paymentReportsResult] = results

      const adminSessionExpired = [customersResult, paymentReportsResult].some(
        (result) =>
          result.status === 'rejected' &&
          axios.isAxiosError(result.reason) &&
          [401, 403].includes(result.reason.response?.status)
      )

      if (adminSessionExpired) {
        await onLogout()
        return
      }

      if (productsResult.status === 'fulfilled' && Array.isArray(productsResult.value.data)) {
        setProducts(productsResult.value.data)
      } else {
        nextErrors.products = getRequestError(
          productsResult.status === 'rejected' ? productsResult.reason : null,
          'Could not load products. Check that the product service is running.'
        )
      }

      if (categoriesResult.status === 'fulfilled' && Array.isArray(categoriesResult.value.data)) {
        setCategories(categoriesResult.value.data)
      } else {
        nextErrors.categories = getRequestError(
          categoriesResult.status === 'rejected' ? categoriesResult.reason : null,
          'Could not load categories. Check that the product service is running.'
        )
      }

      if (customersResult.status === 'fulfilled') {
        setCustomers(customersResult.value)
      } else {
        nextErrors.customers = getRequestError(
          customersResult.reason,
          'Could not load customers. Check that the user service is running.'
        )
      }

      if (paymentReportsResult.status === 'fulfilled') {
        setPaymentReports(paymentReportsResult.value)
      } else {
        nextErrors.paymentReports = getRequestError(
          paymentReportsResult.reason,
          'Could not load customer payment reports.'
        )
      }

      setErrors(nextErrors)
      setIsLoading(false)
    }

    fetchDashboardData()
    return () => {
      active = false
    }
  }, [refreshKey, onLogout])

  const lowStockProducts = useMemo(
    () => products.filter((product) => Number(product.quantity) <= 5),
    [products]
  )
  const unreadNotificationCount = lowStockProducts.filter(
    (product) => !notificationState.read.has(String(product.id))
  ).length
  const visibleNotificationProducts = lowStockProducts.filter(
    (product) => !notificationState.dismissed.has(String(product.id))
  )

  const markNotificationsRead = (productIds) => {
    const nextState = {
      read: new Set(notificationState.read),
      dismissed: new Set(notificationState.dismissed),
    }
    productIds.forEach((productId) => nextState.read.add(String(productId)))
    setNotificationState(nextState)
    saveNotificationState(notificationStorageKey, nextState)
  }

  const dismissNotification = (productId) => {
    const nextState = {
      read: new Set(notificationState.read),
      dismissed: new Set(notificationState.dismissed),
    }
    nextState.read.add(String(productId))
    nextState.dismissed.add(String(productId))
    setNotificationState(nextState)
    saveNotificationState(notificationStorageKey, nextState)
  }

  const latestProducts = useMemo(
    () =>
      [...products]
        .sort((first, second) =>
          new Date(second.createdAt || 0) - new Date(first.createdAt || 0)
        )
        .slice(0, 4),
    [products]
  )

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return products
    }

    return products.filter((product) =>
      [
        product.id,
        product.name,
        product.categoryName || product.category,
        product.description,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))
    )
  }, [products, search])

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return customers
    }

    return customers.filter((customer) =>
      [customer.userId, customer.name, customer.email, customer.mobile]
        .some((value) => String(value ?? '').toLowerCase().includes(query))
    )
  }, [customers, search])

  const filteredPaymentReports = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return paymentReports
    }

    return paymentReports.filter((report) =>
      [
        report.customerName,
        report.customerEmail,
        report.orderNumber,
        report.reference,
        report.itemsSummary,
      ].some((value) => String(value ?? '').toLowerCase().includes(query))
    )
  }, [paymentReports, search])

  const searchResults = useMemo(
    () => ({
      products: filteredProducts.slice(0, 4),
      customers: filteredCustomers.slice(0, 4),
      total: filteredProducts.length + filteredCustomers.length,
    }),
    [filteredCustomers, filteredProducts]
  )

  const categoryStock = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          productCount: products.filter(
            (product) => Number(product.categoryId) === Number(category.id)
          ).length,
          stockCount: products
            .filter((product) => Number(product.categoryId) === Number(category.id))
            .reduce((total, product) => total + Number(product.quantity || 0), 0),
        }))
        .sort((first, second) => second.stockCount - first.stockCount)
        .slice(0, 6),
    [categories, products]
  )

  const handleCreateCategory = async (event) => {
    event.preventDefault()
    setErrors({})
    setSuccessMessage('')
    setFlashError('')
    setIsSaving(true)

    try {
      const response = await axios.post('/api/categories', {
        categoryName: categoryName.trim(),
      })
      setCategories((previous) =>
        [...previous, response.data].sort((first, second) =>
          first.categoryName.localeCompare(second.categoryName)
        )
      )
      setCategoryName('')
      setShowCategoryForm(false)
      setSuccessMessage('Category added successfully.')
    } catch (requestError) {
      setFlashError(getRequestError(requestError, 'Could not add this category.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateProduct = async (event) => {
    event.preventDefault()
    if (isUploadingImage) {
      return
    }

    setErrors({})
    setSuccessMessage('')
    setFlashError('')
    setIsSaving(true)

    try {
      const submittedName = productForm.name.trim().toLocaleLowerCase()
      const existingProduct = products.find(
        (product) =>
          Number(product.categoryId) === Number(productForm.categoryId) &&
          String(product.name || '').trim().toLocaleLowerCase() === submittedName
      )
      const response = await axios.post('/api/products', {
        ...productForm,
        categoryId: Number(productForm.categoryId),
        price: Number(productForm.price),
        quantity: Number(productForm.quantity),
      })
      setProducts((previous) => {
        const alreadyListed = previous.some((product) => product.id === response.data.id)
        return alreadyListed
          ? previous.map((product) => product.id === response.data.id ? response.data : product)
          : [response.data, ...previous]
      })
      setProductForm(emptyProduct)
      setShowProductForm(false)
      setSuccessMessage(
        existingProduct
          ? 'Existing product stock replenished. Its current price and details were kept.'
          : 'Product added successfully.'
      )
    } catch (requestError) {
      setFlashError(getRequestError(requestError, 'Could not add this product.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadProductImage = async (event) => {
    const image = event.target.files?.[0]
    event.target.value = ''

    if (!image) {
      return
    }

    setErrors({})
    setSuccessMessage('')
    setFlashError('')

    if (image.size > 5 * 1024 * 1024) {
      setFlashError('Images must be 5 MB or smaller.')
      return
    }

    const formData = new FormData()
    formData.append('image', image)
    setIsUploadingImage(true)

    try {
      const response = await axios.post('/api/products/images', formData)
      if (typeof response.data?.imageUrl !== 'string' || !response.data.imageUrl) {
        throw new Error('The product service did not return an image URL.')
      }

      setProductForm((previous) => ({
        ...previous,
        imageUrl: response.data.imageUrl,
      }))
    } catch (requestError) {
      setFlashError(getRequestError(requestError, 'Could not upload this image.'))
    } finally {
      setIsUploadingImage(false)
    }
  }

  const sectionTitles = {
    dashboard: ['Dashboard', `Welcome back, ${currentUser.name}!`],
    products: ['Products', 'Manage your product catalogue and categories.'],
    inventory: ['Inventory', 'Keep an eye on products that need a restock.'],
    customers: ['Customers', 'View your registered QuickMart customers.'],
  }
  const [pageTitle, pageSubtitle] = sectionTitles[activeSection]
  const today = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="qm-admin-shell">
      <AdminHeader
        currentUser={currentUser}
        activeSection={activeSection}
        onNavigate={(section) => {
          setActiveSection(section)
          setSearch('')
        }}
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="qm-admin-main">
        <header className="qm-admin-topbar">
          <button
            type="button"
            className="qm-admin-icon-button qm-admin-menu-button"
            aria-label="Open admin menu"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="qm-admin-search-area">
            <label className="qm-admin-global-search">
              <Search size={19} />
              <input
                type="search"
                value={search}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setIsSearchOpen(true)
                }}
                placeholder="Search products, customers..."
                aria-label="Search dashboard"
                aria-expanded={Boolean(search.trim() && isSearchOpen)}
                aria-controls="qm-admin-search-results"
              />
            </label>
            {search.trim() && isSearchOpen && (
              <div className="qm-admin-search-results" id="qm-admin-search-results">
                {searchResults.total ? (
                  <>
                    {searchResults.products.length > 0 && (
                      <div className="qm-admin-search-group">
                        <span>Products</span>
                        {searchResults.products.map((product) => (
                          <button
                            type="button"
                            key={product.id}
                            onClick={() => {
                              setActiveSection('products')
                              setIsSearchOpen(false)
                            }}
                          >
                            <Package size={16} />
                            <span>
                              <strong>{product.name}</strong>
                              <small>{product.categoryName || product.category || 'Product'}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.customers.length > 0 && (
                      <div className="qm-admin-search-group">
                        <span>Customers</span>
                        {searchResults.customers.map((customer) => (
                          <button
                            type="button"
                            key={customer.userId}
                            onClick={() => {
                              setActiveSection('customers')
                              setIsSearchOpen(false)
                            }}
                          >
                            <Users size={16} />
                            <span>
                              <strong>{customer.name}</strong>
                              <small>{customer.email}</small>
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {(filteredProducts.length > 4 || filteredCustomers.length > 4) && (
                      <small className="qm-admin-search-hint">
                        Showing the first 4 results per group. Press a result to view all matches.
                      </small>
                    )}
                  </>
                ) : (
                  <p className="qm-admin-search-empty">No matching products or customers.</p>
                )}
              </div>
            )}
          </div>
          <div className="qm-admin-topbar-actions">
            <button
              type="button"
              className="qm-admin-icon-button"
              aria-label="Refresh dashboard data"
              title="Refresh dashboard data"
              onClick={() => setRefreshKey((previous) => previous + 1)}
              disabled={isLoading}
            >
              <RefreshCw size={18} className={isLoading ? 'qm-admin-refreshing' : ''} />
            </button>
            <div className="qm-admin-notification-wrap">
              <button
                type="button"
                className="qm-admin-icon-button qm-admin-notification"
                aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread low-stock alerts` : ''}`}
                title="Notifications"
                aria-expanded={isNotificationOpen}
                onClick={() => {
                  const opening = !isNotificationOpen
                  if (opening) {
                    markNotificationsRead(lowStockProducts.map((product) => product.id))
                  }
                  setIsNotificationOpen(opening)
                }}
              >
                <Bell size={20} />
                {unreadNotificationCount > 0 && (
                  <span>{Math.min(unreadNotificationCount, 9)}</span>
                )}
              </button>
              {isNotificationOpen && (
                <div className="qm-admin-notification-panel">
                  <div className="qm-admin-notification-heading">
                    <strong>Low-stock alerts</strong>
                  </div>
                  {visibleNotificationProducts.length ? (
                    <div className="qm-admin-notification-list">
                      {visibleNotificationProducts.map((product) => (
                        <button
                          type="button"
                          key={product.id}
                          onClick={() => {
                            dismissNotification(product.id)
                            setActiveSection('inventory')
                            setSearch(product.name)
                            setIsNotificationOpen(false)
                          }}
                        >
                          <span className="qm-admin-notification-alert"><CircleAlert size={16} /></span>
                          <span>
                            <strong>{product.name}</strong>
                            <small>{Number(product.quantity)} left in stock</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="qm-admin-notification-empty">
                      No new low-stock alerts.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="qm-admin-topbar-divider" />
            <div className="qm-admin-profile">
              <span className="qm-admin-profile-avatar">
                {(currentUser.name || 'A').slice(0, 1).toUpperCase()}
              </span>
              <span>
                <strong>{currentUser.name}</strong>
                <small>Administrator</small>
              </span>
            </div>
          </div>
        </header>

        <main className="qm-admin-content">
          <div className="qm-admin-page-heading">
            <div>
              <span className="qm-admin-eyebrow">QUICKMART ADMINISTRATION</span>
              <h1>{pageTitle}</h1>
              <p>{pageSubtitle}</p>
            </div>
            <div className="qm-admin-date">
              <CalendarDays size={17} />
              <span>{today}</span>
            </div>
          </div>

          {successMessage && (
            <div className="qm-admin-alert qm-admin-alert-success" role="status">
              <Check size={17} />
              {successMessage}
              <button
                type="button"
                aria-label="Dismiss message"
                onClick={() => setSuccessMessage('')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {flashError && (
            <div className="qm-admin-alert qm-admin-alert-error" role="alert">
              <CircleAlert size={17} />
              <span>{flashError}</span>
            </div>
          )}
          {Object.entries(errors).map(([key, message]) => (
            <div className="qm-admin-alert qm-admin-alert-error" role="alert" key={key}>
              <CircleAlert size={17} />
              <span>{message}</span>
            </div>
          ))}

          {activeSection === 'dashboard' && (
            <>
              <section className="qm-admin-stat-grid" aria-label="Store overview">
                <StatCard
                  label="Total products"
                  value={products.length}
                  note={`${categories.length} product categories`}
                  tone="blue"
                  icon={Package}
                  trend={<ArrowUpRight size={16} />}
                />
                <StatCard
                  label="Categories"
                  value={categories.length}
                  note="In your catalogue"
                  tone="green"
                  icon={ShoppingBasket}
                  trend={<ArrowUpRight size={16} />}
                />
                <StatCard
                  label="Low stock items"
                  value={lowStockProducts.length}
                  note="5 units or fewer"
                  tone="orange"
                  icon={Warehouse}
                  trend={lowStockProducts.length ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                />
                <StatCard
                  label="Total customers"
                  value={customers.length}
                  note="Registered accounts"
                  tone="purple"
                  icon={Users}
                  trend={<ArrowUpRight size={16} />}
                />
              </section>

              <section className="qm-admin-overview-grid">
                <div className="qm-admin-panel qm-admin-inventory-panel">
                  <PanelHeading
                    icon={ChartNoAxesCombined}
                    title="Inventory overview"
                    action="View inventory"
                    onAction={() => setActiveSection('inventory')}
                  />
                  {categoryStock.length ? (
                    <div className="qm-admin-stock-chart">
                      {categoryStock.map((category, index) => {
                        const maximum = Math.max(
                          ...categoryStock.map((item) => item.stockCount),
                          1
                        )
                        return (
                          <div className="qm-admin-stock-row" key={category.id}>
                            <span title={category.categoryName}>
                              {category.categoryName}
                            </span>
                            <div className="qm-admin-stock-track">
                              <div
                                className={`qm-admin-stock-bar qm-admin-stock-bar-${index % 4}`}
                                style={{
                                  width: `${Math.max(3, (category.stockCount / maximum) * 100)}%`,
                                }}
                              />
                            </div>
                            <strong>{category.stockCount}</strong>
                          </div>
                        )
                      })}
                      <div className="qm-admin-chart-caption">
                        <span><i className="qm-admin-chart-dot qm-admin-chart-dot-blue" />Units in stock</span>
                        <span><i className="qm-admin-chart-dot qm-admin-chart-dot-green" />Products</span>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={LayoutDashboard}
                      title="Your inventory will appear here"
                      detail="Add a category and products to see your stock overview."
                    />
                  )}
                </div>

                <div className="qm-admin-panel qm-admin-activity-panel">
                  <PanelHeading
                    icon={Sparkles}
                    title="Recent products"
                    action="View all"
                    onAction={() => setActiveSection('products')}
                  />
                  {latestProducts.length ? (
                    <div className="qm-admin-activity-list">
                      {latestProducts.map((product) => (
                        <div className="qm-admin-activity-item" key={product.id}>
                          <span className="qm-admin-activity-icon">
                            <Package size={19} />
                          </span>
                          <span className="qm-admin-activity-copy">
                            <strong>{product.name}</strong>
                            <small>
                              {product.categoryName || product.category} · {formatDate(product.createdAt)}
                            </small>
                          </span>
                          <span className="qm-admin-activity-stock">
                            {product.quantity} left
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={Package}
                      title="No products yet"
                      detail="Add your first product to get started."
                      action={() => setActiveSection('products')}
                    />
                  )}
                </div>
              </section>
            </>
          )}

          {activeSection === 'products' && (
            <section className="qm-admin-panel qm-admin-management-panel">
              <PanelHeading
                icon={Package}
                title="Product catalogue"
                action={
                  <div className="qm-admin-heading-actions">
                    <button
                      type="button"
                      className="qm-admin-secondary-button"
                      onClick={() => {
                        setShowCategoryForm((visible) => !visible)
                        setShowProductForm(false)
                      }}
                    >
                      <Tag size={16} />
                      Add category
                    </button>
                    <button
                      type="button"
                      className="qm-admin-primary-button"
                      onClick={() => {
                        setShowProductForm((visible) => !visible)
                        setShowCategoryForm(false)
                      }}
                      disabled={!categories.length}
                      title={!categories.length ? 'Add a category first' : undefined}
                    >
                      <Plus size={17} />
                      Add product
                    </button>
                  </div>
                }
              />

              {showCategoryForm && (
                <form className="qm-admin-inline-form qm-admin-category-form" onSubmit={handleCreateCategory}>
                  <div className="qm-admin-form-intro">
                    <span className="qm-admin-form-icon"><Tag size={19} /></span>
                    <span>
                      <strong>Create a category</strong>
                      <small>Categories help organize your products.</small>
                    </span>
                  </div>
                  <label className="qm-admin-field">
                    <span>Category name</span>
                    <input
                      type="text"
                      maxLength={100}
                      value={categoryName}
                      onChange={(event) => setCategoryName(event.target.value)}
                      placeholder="e.g. Fresh vegetables"
                      required
                    />
                  </label>
                  <button type="submit" className="qm-admin-primary-button" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save category'}
                  </button>
                </form>
              )}

              {showProductForm && (
                <form className="qm-admin-inline-form qm-admin-product-form" onSubmit={handleCreateProduct}>
                  <div className="qm-admin-form-intro">
                    <span className="qm-admin-form-icon"><Package size={19} /></span>
                    <span>
                      <strong>Add a product</strong>
                      <small>Enter the product details to add it to your catalogue.</small>
                    </span>
                  </div>
                  <div className="qm-admin-form-grid">
                    <label className="qm-admin-field">
                      <span>Product name</span>
                      <input
                        type="text"
                        maxLength={255}
                        value={productForm.name}
                        onChange={(event) =>
                          setProductForm((previous) => ({ ...previous, name: event.target.value }))
                        }
                        placeholder="e.g. Organic apples"
                        required
                      />
                    </label>
                    <label className="qm-admin-field">
                      <span>Category</span>
                      <select
                        value={productForm.categoryId}
                        onChange={(event) =>
                          setProductForm((previous) => ({ ...previous, categoryId: event.target.value }))
                        }
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.categoryName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="qm-admin-field">
                      <span>Price (₹)</span>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={productForm.price}
                        onChange={(event) =>
                          setProductForm((previous) => ({ ...previous, price: event.target.value }))
                        }
                        placeholder="0.00"
                        required
                      />
                    </label>
                    <label className="qm-admin-field">
                      <span>Quantity</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={productForm.quantity}
                        onChange={(event) =>
                          setProductForm((previous) => ({ ...previous, quantity: event.target.value }))
                        }
                        placeholder="0"
                        required
                      />
                    </label>
                    <div className="qm-admin-field qm-admin-field-wide">
                      <span>Product image <small>(optional, PNG/JPEG/GIF/WebP up to 5 MB)</small></span>
                      <label className="qm-admin-upload-control">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/gif,image/webp"
                          onChange={handleUploadProductImage}
                          disabled={isUploadingImage || isSaving}
                          aria-label="Upload product image"
                        />
                        <span className="qm-admin-upload-button">
                          <Plus size={16} />
                          {isUploadingImage ? 'Uploading image...' : 'Choose image'}
                        </span>
                        <span className="qm-admin-upload-hint">
                          {productForm.imageUrl
                            ? 'Image uploaded. It will be saved with this product.'
                            : 'Select a product photo from your device.'}
                        </span>
                      </label>
                      {productForm.imageUrl && (
                        <div className="qm-admin-upload-preview">
                          <img src={productForm.imageUrl} alt="Product image preview" />
                          <button
                            type="button"
                            className="qm-admin-cancel-button"
                            onClick={() =>
                              setProductForm((previous) => ({
                                ...previous,
                                imageUrl: '',
                              }))
                            }
                            disabled={isUploadingImage || isSaving}
                          >
                            <X size={15} />
                            Remove image
                          </button>
                        </div>
                      )}
                    </div>
                    <label className="qm-admin-field qm-admin-field-wide">
                      <span>Description <small>(optional)</small></span>
                      <textarea
                        rows="3"
                        value={productForm.description}
                        onChange={(event) =>
                          setProductForm((previous) => ({ ...previous, description: event.target.value }))
                        }
                        placeholder="A short description of this product"
                      />
                    </label>
                  </div>
                  <div className="qm-admin-form-actions">
                    <button
                      type="button"
                      className="qm-admin-cancel-button"
                      onClick={() => setShowProductForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="qm-admin-primary-button" disabled={isSaving || isUploadingImage || !categories.length}>
                      {isUploadingImage ? 'Uploading image...' : isSaving ? 'Saving...' : 'Save product'}
                    </button>
                  </div>
                </form>
              )}

              <div className="qm-admin-category-strip">
                <div className="qm-admin-section-subheading">
                  <h3>Categories</h3>
                  <span>{categories.length} total</span>
                </div>
                {categories.length ? (
                  <div className="qm-admin-category-chips">
                    {categories.map((category) => (
                      <span className="qm-admin-category-chip" key={category.id}>
                        <Tag size={14} />
                        {category.categoryName}
                        <small>{products.filter((product) => Number(product.categoryId) === Number(category.id)).length}</small>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="qm-admin-muted">No categories yet. Add one before creating a product.</p>
                )}
              </div>

              <div className="qm-admin-table-wrap qm-admin-category-table-wrap">
                <table className="qm-admin-table">
                  <thead>
                    <tr><th>Category ID</th><th>Category name</th><th>Created</th></tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="3" className="qm-admin-table-message">Loading categories...</td></tr>
                    ) : categories.length ? (
                      categories.map((category) => (
                        <tr key={category.id}>
                          <td>{category.id}</td>
                          <td><div className="qm-admin-table-primary">{category.categoryName}</div></td>
                          <td>{formatDate(category.createdAt)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="3" className="qm-admin-table-message">No categories have been created yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="qm-admin-section-subheading qm-admin-products-subheading">
                <h3>Products</h3>
                <span>{filteredProducts.length} shown</span>
              </div>
              <ProductsTable
                products={filteredProducts}
                isLoading={isLoading}
                emptyMessage={products.length ? 'No products match your search.' : 'No products yet. Add your first product.'}
              />
            </section>
          )}

          {activeSection === 'inventory' && (
            <section className="qm-admin-panel qm-admin-management-panel">
              <PanelHeading
                icon={Warehouse}
                title="Inventory"
                action={
                  <span className="qm-admin-low-stock-badge">
                    <CircleAlert size={15} />
                    {lowStockProducts.length} low stock
                  </span>
                }
              />
              <div className="qm-admin-inventory-summary">
                <div><span>Total units in stock</span><strong>{products.reduce((total, product) => total + Number(product.quantity || 0), 0)}</strong></div>
                <div><span>Products to restock</span><strong>{lowStockProducts.length}</strong></div>
              </div>
              <ProductsTable
                products={[...filteredProducts].sort((first, second) => Number(first.quantity) - Number(second.quantity))}
                isLoading={isLoading}
                emptyMessage={products.length ? 'No products match your search.' : 'No products have been added yet.'}
                showStockStatus
              />
            </section>
          )}

          {activeSection === 'customers' && (
            <>
              <section className="qm-admin-panel qm-admin-management-panel">
                <PanelHeading
                  icon={Users}
                  title="Customer accounts"
                  action={<span className="qm-admin-count-pill">{customers.length} customers</span>}
                />
                {errors.customers ? (
                  <div className="qm-admin-table-message">{errors.customers}</div>
                ) : (
                  <div className="qm-admin-table-wrap">
                    <table className="qm-admin-table">
                      <thead>
                        <tr><th>Customer</th><th>Email</th><th>Mobile</th><th>Registered</th></tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr><td colSpan="4" className="qm-admin-table-message">Loading customers...</td></tr>
                        ) : filteredCustomers.length ? (
                          filteredCustomers.map((customer) => (
                            <tr key={customer.userId}>
                              <td>
                                <div className="qm-admin-table-primary">{customer.name}</div>
                                <small className="qm-admin-table-secondary">ID: {customer.userId}</small>
                              </td>
                              <td>{customer.email}</td>
                              <td>{customer.mobile}</td>
                              <td>{formatDate(customer.registeredAt)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="qm-admin-table-message">
                            {customers.length ? 'No customers match your search.' : 'No customers have registered yet.'}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="qm-admin-panel qm-admin-management-panel qm-admin-customer-report">
                <PanelHeading
                  icon={ShoppingBasket}
                  title="Customer purchase report"
                  action={<span className="qm-admin-count-pill">{paymentReports.length} payments</span>}
                />
                {errors.paymentReports ? (
                  <div className="qm-admin-table-message">{errors.paymentReports}</div>
                ) : (
                  <div className="qm-admin-table-wrap">
                    <table className="qm-admin-table">
                      <thead>
                        <tr>
                          <th>Customer</th>
                          <th>Order</th>
                          <th>Items</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Paid at</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoading ? (
                          <tr><td colSpan="6" className="qm-admin-table-message">Loading payment reports...</td></tr>
                        ) : filteredPaymentReports.length ? (
                          filteredPaymentReports.map((report) => (
                              <tr key={report.paymentId}>
                                <td>
                                  <div className="qm-admin-table-primary">{report.customerName}</div>
                                  <small className="qm-admin-table-secondary">{report.customerEmail}</small>
                                </td>
                                <td>{report.orderNumber || report.reference}</td>
                                <td>{report.itemsSummary || 'Order details unavailable'}</td>
                                <td>{currency(report.total)}</td>
                                <td>{report.status === 'DEMO_COMPLETED' ? 'Paid (demo)' : report.status}</td>
                                <td>{formatDate(report.completedAt)}</td>
                              </tr>
                            ))
                        ) : (
                          <tr><td colSpan="6" className="qm-admin-table-message">
                            {paymentReports.length ? 'No payment reports match your search.' : 'No completed payments have been recorded yet.'}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          <footer className="qm-admin-footer">
            <span>QuickMart Admin</span>
            <span>Manage your store with confidence.</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

const StatCard = ({ label, value, note, tone, icon: Icon, trend }) => (
  <article className={`qm-admin-stat-card qm-admin-tone-${tone}`}>
    <div className="qm-admin-stat-top">
      <span className="qm-admin-stat-icon"><Icon size={23} /></span>
      <span className="qm-admin-stat-trend">{trend}</span>
    </div>
    <span className="qm-admin-stat-label">{label}</span>
    <strong className="qm-admin-stat-value">{value}</strong>
    <span className="qm-admin-stat-note">{note}</span>
  </article>
)

const PanelHeading = ({ icon: Icon, title, action, onAction }) => (
  <div className="qm-admin-panel-heading">
    <h2><Icon size={19} />{title}</h2>
    {typeof action === 'string' ? (
      <button type="button" className="qm-admin-panel-link" onClick={onAction}>
        {action}<ArrowRight size={15} />
      </button>
    ) : action}
  </div>
)

const EmptyState = ({ icon: Icon, title, detail, action }) => (
  <div className="qm-admin-empty-state">
    <span><Icon size={23} /></span>
    <strong>{title}</strong>
    <p>{detail}</p>
    {action && (
      <button type="button" className="qm-admin-panel-link" onClick={action}>
        Add a product<ArrowRight size={15} />
      </button>
    )}
  </div>
)

const ProductsTable = ({ products, isLoading, emptyMessage, showStockStatus = false }) => (
  <div className="qm-admin-table-wrap">
    <table className="qm-admin-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Description</th>
          <th>Price</th>
          <th>Quantity</th>
          {showStockStatus && <th>Stock status</th>}
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {isLoading ? (
          <tr><td colSpan={showStockStatus ? 7 : 6} className="qm-admin-table-message">Loading products...</td></tr>
        ) : products.length ? (
          products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="qm-admin-product-cell">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" loading="lazy" />
                  ) : (
                    <span className="qm-admin-product-placeholder"><Package size={18} /></span>
                  )}
                  <span>
                    <strong>{product.name}</strong>
                    <small>ID: {product.id}</small>
                  </span>
                </div>
              </td>
              <td>
                <div>{product.categoryName || product.category}</div>
                <small className="qm-admin-table-secondary">ID: {product.categoryId}</small>
              </td>
              <td className="qm-admin-description-cell">{product.description || '-'}</td>
              <td>{currency(product.price)}</td>
              <td>{product.quantity}</td>
              {showStockStatus && (
                <td>
                  <span className={`qm-admin-stock-status${Number(product.quantity) <= 5 ? ' is-low' : ''}`}>
                    {Number(product.quantity) <= 5 ? 'Restock soon' : 'In stock'}
                  </span>
                </td>
              )}
              <td>{formatDate(product.createdAt)}</td>
            </tr>
          ))
        ) : (
          <tr><td colSpan={showStockStatus ? 7 : 6} className="qm-admin-table-message">{emptyMessage}</td></tr>
        )}
      </tbody>
    </table>
  </div>
)

export default AdminDashboard
