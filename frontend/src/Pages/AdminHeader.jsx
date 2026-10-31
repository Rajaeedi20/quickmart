import { useEffect, useState } from 'react'
import {
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Package,
  Users,
  Warehouse,
  X,
} from 'lucide-react'
import quickMartLogo from '../assets/QuickMart_Logo.png'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'customers', label: 'Customers', icon: Users },
]

const AdminHeader = ({
  currentUser,
  activeSection,
  onNavigate,
  onLogout,
  isOpen,
  onClose,
}) => {
  const [error, setError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    if (!error) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => setError(''), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [error])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError('')

    try {
      await onLogout()
    } catch {
      setError('Could not log out. Please try again.')
      setIsLoggingOut(false)
    }
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="qm-admin-sidebar-backdrop"
          aria-label="Close admin menu"
          onClick={onClose}
        />
      )}
      <aside className={`qm-admin-sidebar${isOpen ? ' is-open' : ''}`}>
        <div className="qm-admin-brand">
          <img
            className="qm-admin-brand-logo"
            src={quickMartLogo}
            alt="QuickMart logo"
          />
          <button
            type="button"
            className="qm-admin-sidebar-close"
            aria-label="Close admin menu"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="qm-admin-nav-label">WORKSPACE</div>
        <nav className="qm-admin-nav" aria-label="Admin navigation">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`qm-admin-nav-item${activeSection === id ? ' is-active' : ''}`}
              aria-current={activeSection === id ? 'page' : undefined}
              onClick={() => {
                onNavigate(id)
                onClose()
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === 'products' && <ChartNoAxesCombined size={15} className="qm-admin-nav-trailing" />}
            </button>
          ))}
        </nav>

        <div className="qm-admin-sidebar-spacer" />
        <div className="qm-admin-sidebar-promo">
          <div className="qm-admin-promo-icon">
            <Package size={28} />
          </div>
          <strong>Fresh stock,</strong>
          <span>better business.</span>
        </div>

        <div className="qm-admin-sidebar-account">
          <div className="qm-admin-account-avatar">
            {(currentUser.name || 'A').slice(0, 1).toUpperCase()}
          </div>
          <div className="qm-admin-account-copy">
            <strong>{currentUser.name}</strong>
            <span>Administrator</span>
          </div>
          <button
            type="button"
            className="qm-admin-logout"
            aria-label="Log out"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={17} />
          </button>
        </div>
        {error && (
          <div className="qm-admin-sidebar-error" role="alert">
            {error}
          </div>
        )}
      </aside>
    </>
  )
}

export default AdminHeader
