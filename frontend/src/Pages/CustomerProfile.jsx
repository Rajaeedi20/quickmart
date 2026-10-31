import { useEffect, useState } from 'react'
import axios from 'axios'
import { Clock3, PackageCheck, ShoppingBag } from 'lucide-react'

const formatPaidAt = (value) => {
  if (!value) {
    return 'Time not recorded'
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Time not recorded'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}

const formatCurrency = (value) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)

const CustomerProfile = ({ currentUser }) => {
  const [purchases, setPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    const loadPurchaseHistory = async () => {
      try {
        setIsLoading(true)
        setError('')
        const response = await axios.get('/api/auth/purchase-history', {
          withCredentials: true,
          signal: controller.signal,
        })
        if (!Array.isArray(response.data)) {
          throw new Error('The purchase history service returned an invalid response.')
        }
        setPurchases(response.data)
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(
            axios.isAxiosError(requestError) && [401, 403].includes(requestError.response?.status)
              ? 'Your customer session expired. Please log in again to view your purchases.'
              : requestError.response?.data?.detail ||
                  requestError.response?.data?.message ||
                  requestError.message ||
                  'Could not load your purchase history.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadPurchaseHistory()
    return () => controller.abort()
  }, [])

  return (
    <main className="container py-4 py-lg-5">
      <section className="rounded-4 bg-success text-white p-4 p-lg-5 mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-circle bg-white text-success p-3">
            <ShoppingBag size={28} />
          </div>
          <div>
            <p className="mb-1 opacity-75">My QuickMart</p>
            <h1 className="h2 fw-bold mb-1">Hi, {currentUser.name}</h1>
            <p className="mb-0">{currentUser.email}</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-4 shadow-sm p-3 p-md-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="h4 fw-bold mb-1">My purchases</h2>
            <p className="text-muted mb-0">Your paid orders and purchase dates.</p>
          </div>
          <span className="badge rounded-pill bg-success-subtle text-success fs-6">
            {purchases.length} {purchases.length === 1 ? 'order' : 'orders'}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center text-muted py-5" role="status">
            Loading your purchase history...
          </div>
        ) : error ? (
          <div className="alert alert-danger mb-0" role="alert">{error}</div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-5">
            <ShoppingBag size={42} className="text-success mb-3" />
            <h3 className="h5 fw-semibold">No purchases yet</h3>
            <p className="text-muted mb-0">Your completed orders will appear here.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {purchases.map((purchase) => (
              <article
                key={purchase.paymentId}
                className="border rounded-4 p-3 p-md-4"
              >
                <div className="d-flex flex-wrap justify-content-between gap-3">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <PackageCheck size={19} className="text-success" />
                      <strong>{purchase.orderNumber || `Order #${purchase.orderId}`}</strong>
                    </div>
                    <p className="text-muted mb-2">
                      {purchase.itemsSummary || 'Order items'}
                    </p>
                    <span className="d-inline-flex align-items-center gap-1 small text-muted">
                      <Clock3 size={15} />
                      Paid at {formatPaidAt(purchase.paidAt)}
                    </span>
                  </div>
                  <div className="text-md-end">
                    <strong className="fs-5">{formatCurrency(purchase.total)}</strong>
                    <div>
                      <span className="badge bg-success-subtle text-success mt-2">
                        {purchase.status}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default CustomerProfile
