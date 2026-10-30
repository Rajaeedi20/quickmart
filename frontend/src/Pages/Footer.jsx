import { ShoppingBasket, MapPin, Phone, Mail, Clock } from "lucide-react";
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaXTwitter,
} from 'react-icons/fa6'
function Footer() {
  return (
    <footer className="quickmart-footer mt-5">
      <div className="container py-5">
        <div className="row g-4">
          {/* Brand Section */}
          <div className="col-12 col-md-6 col-lg-4">
            <a
              href="/"
              className="footer-brand d-inline-flex align-items-center gap-2 text-decoration-none mb-3"
            >
              <ShoppingBasket size={32} />
              <span className="fw-bold fs-3">QuickMart</span>
            </a>

            <p className="footer-description">
              Your everyday grocery shopping made simple. Find fresh produce and
              daily essentials in one place.
            </p>

            {/* Social Links */}
            <div className="d-flex gap-3 mt-4">
  {/* Instagram */}
  <a
    href="https://www.instagram.com/"
    className="social-link"
    aria-label="Instagram"
    target="_blank"
    rel="noreferrer"
  >
    <FaInstagram size={20} />
  </a>

  {/* Facebook */}
  <a
    href="https://www.facebook.com/"
    className="social-link"
    aria-label="Facebook"
    target="_blank"
    rel="noreferrer"
  >
    <FaFacebookF size={20} />
  </a>

  {/* YouTube */}
  <a
    href="https://www.youtube.com/"
    className="social-link"
    aria-label="YouTube"
    target="_blank"
    rel="noreferrer"
  >
    <FaYoutube size={20} />
  </a>

  {/* X */}
  <a
    href="https://x.com/"
    className="social-link"
    aria-label="X"
    target="_blank"
    rel="noreferrer"
  >
    <FaXTwitter size={18} />
  </a>
</div>
          </div>

          {/* Quick Links */}
          <div className="col-6 col-md-6 col-lg-2">
            <h5 className="footer-heading">Quick Links</h5>

            <ul className="footer-links">
              <li>
                <a href="/">Home</a>
              </li>
              <li>
                <a href="#popular-products">Popular Products</a>
              </li>
              <li>
                <a href="#special-offers">Special Offers</a>
              </li>
              <li>
                <a href="#why-quickmart">Why QuickMart</a>
              </li>
              <li>
                <a href="#customer-reviews">Customer Reviews</a>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div className="col-6 col-md-6 col-lg-2">
            <h5 className="footer-heading">Categories</h5>

            <ul className="footer-links">
              <li>
                <a href="#popular-products">Fruits</a>
              </li>
              <li>
                <a href="#popular-products">Vegetables</a>
              </li>
              <li>
                <a href="#popular-products">Dairy Products</a>
              </li>
              <li>
                <a href="#popular-products">Bakery</a>
              </li>
              <li>
                <a href="#popular-products">Beverages</a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-12 col-md-6 col-lg-4">
            <h5 className="footer-heading">Contact Us</h5>

            <div className="footer-contact">
              <MapPin size={18} />
              <span>Your delivery location, India</span>
            </div>

            <div className="footer-contact">
              <Phone size={18} />
              <a href="tel:+910000000000">+91 8765790900</a>
            </div>

            <div className="footer-contact">
              <Mail size={18} />
              <a href="mailto:support@quickmart.example">
                support@quickmart.com
              </a>
            </div>

            <div className="footer-contact">
              <Clock size={18} />
              <span>Customer support: 9 AM – 6 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container py-3 d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <p className="mb-0">
            © {new Date().getFullYear()} QuickMart. All rights reserved.
          </p>

          <div className="d-flex gap-3">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms &amp; Conditions</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
