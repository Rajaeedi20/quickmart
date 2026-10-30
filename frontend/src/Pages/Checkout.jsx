import axios from 'axios'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const Checkout = ({ currentUser, cartItems, onPaymentComplete }) => {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [payment, setPayment] = useState(null)
  const paymentServiceUrl =
    (import.meta.env.VITE_PAYMENT_SERVICE_URL || '').replace(/\/+$/, '')

  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  const handleDemoPayment = async () => {
    setIsSubmitting(true)
    setError('')

    try {
      const response = await axios.post(`${paymentServiceUrl}/api/payments/demo`, {
        userId: currentUser.userId,
        items: cartItems.map((item) => ({
          productId: item.id,
          title: item.title,
          quantity: item.quantity,
          unitPrice: item.price,
        })),
      })

      setPayment(response.data)
      onPaymentComplete()
    } catch (requestError) {
      const response = requestError.response
      setError(
        response?.data?.detail ||
          response?.data?.message ||
          (response
            ? `Payment service returned HTTP ${response.status}. Please try again.`
            : 'Cannot connect to the payment service. Start payment-service and check its MySQL credentials if it fails to start.')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (payment) {
    return (
      <main className="container py-5">
        <section className="mx-auto text-center p-4 p-md-5 bg-white rounded-4 shadow-sm" style={{ maxWidth: 640 }}>
          <CheckCircle size={64} className="text-success mb-3" />
          <h1 className="h2 fw-bold">Demo payment recorded</h1>
          <p className="text-muted">
            {payment.message || 'No real payment was charged.'}
          </p>
          <p className="small text-muted">
            Reference: {payment.reference}
          </p>
          <p className="fw-semibold">Total: ${Number(payment.total).toFixed(2)}</p>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => navigate('/')}
          >
            Continue shopping
          </button>
        </section>
      </main>
    )
  }

  if (!currentUser) {
    return (
      <main className="container py-5">
        <div className="alert alert-warning" role="alert">
          Please log in before proceeding to checkout.
        </div>
        <button
          type="button"
          className="btn btn-outline-success"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} className="me-2" />
          Back to shopping
        </button>
      </main>
    )
  }

  return (
    <main className="container py-5">
      <button
        type="button"
        className="btn btn-link text-success text-decoration-none px-0 mb-3"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={18} className="me-2" />
        Continue shopping
      </button>

      <h1 className="h2 fw-bold mb-4">Checkout</h1>

      {cartItems.length === 0 ? (
        <section className="bg-white rounded-4 shadow-sm p-4">
          <p className="mb-3">Your cart is empty.</p>
          <button
            type="button"
            className="btn btn-success"
            onClick={() => navigate('/')}
          >
            Browse products
          </button>
        </section>
      ) : (
        <div className="row g-4">
          <section className="col-lg-8">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h2 className="h5 fw-bold mb-4">Items for {currentUser.name}</h2>
              <div className="d-flex flex-column gap-3">
                {cartItems.map((item) => (
                  <div
                    className="d-flex align-items-center gap-3 border-bottom pb-3"
                    key={item.id}
                  >
                    <img
                      src={item.thumbnail}
                      alt=""
                      width="72"
                      height="72"
                      className="rounded object-fit-contain"
                    />
                    <div className="flex-grow-1">
                      <h3 className="h6 fw-semibold mb-1">{item.title}</h3>
                      <span className="text-muted">Quantity: {item.quantity}</span>
                    </div>
                    <span className="fw-semibold">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="col-lg-4">
            <div className="bg-white rounded-4 shadow-sm p-4">
              <h2 className="h5 fw-bold mb-3">Order summary</h2>
              <div className="d-flex justify-content-between mb-2">
                <span>Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between border-top pt-3 mb-3 fw-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="alert alert-info small" role="note">
                Demo gateway: the payment service records a simulated payment.
                No real payment details are collected and no charge is made.
              </div>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <button
                type="button"
                className="btn btn-success w-100"
                onClick={handleDemoPayment}
                disabled={isSubmitting || cartItems.length === 0}
              >
                <CreditCard size={18} className="me-2" />
                {isSubmitting
                  ? 'Processing demo payment...'
                  : `Pay $${total.toFixed(2)} with demo gateway`}
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}

export default Checkout
