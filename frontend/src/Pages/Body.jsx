import { useEffect, useState } from "react";
import {
  ArrowRight,
  Milk,
  Apple,
  Croissant,
  Coffee,
  Drumstick,
  Leaf,
  ShoppingBasket,
} from "lucide-react";

const Body = ({ currentUser, onAddToCart }) => {
  const categories = [
    { name: "Fruits", icon: Apple, color: "bg-success-subtle" },
    { name: "Vegetables", icon: Leaf, color: "bg-warning-subtle" },
    { name: "Dairy", icon: Milk, color: "bg-info-subtle" },
    { name: "Bakery", icon: Croissant, color: "bg-danger-subtle" },
    { name: "Beverages", icon: Coffee, color: "bg-primary-subtle" },
    { name: "Meat", icon: Drumstick, color: "bg-warning-subtle" },
  ];

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "https://dummyjson.com/products/category/groceries?limit=20",
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch grocery products");
        }

        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, []);

  return (
    <main className="container-fluid px-3 px-lg-5 py-4">
      {/* Welcome Banner */}
      <section className="rounded-4 bg-success text-white p-4 p-lg-5 mb-5">
        <div className="row align-items-center">
          <div className="col-lg-7">
            <span className="badge bg-warning text-dark mb-3">
              FRESHNESS AT YOUR DOORSTEP
            </span>

            <h1 className="display-5 fw-bold">Groceries made easy!</h1>

            <p className="lead">
              Fresh fruits, vegetables and daily essentials delivered straight
              to your home.
            </p>

            <button
              type="button"
              className="btn btn-light btn-lg text-success fw-semibold"
              onClick={() =>
                document.getElementById("popular-products")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
            >
              Shop Now <ArrowRight size={19} className="ms-2" />
            </button>
          </div>

          <div className="col-lg-5 text-center mt-4 mt-lg-0">
            <span
              style={{ fontSize: "110px" }}
              role="img"
              aria-label="Groceries"
            >
              🛒🥦🍎
            </span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold h3 mb-0">Shop by Category</h2>
          <span className="text-success fw-semibold">Explore fresh picks</span>
        </div>

        <div className="row g-3">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <div className="col-6 col-sm-4 col-lg-2" key={category.name}>
                <button
                  type="button"
                  className="card category-card border-0 shadow-sm h-100 w-100 text-center p-3 bg-white"
                  onClick={() =>
                    document
                      .getElementById("popular-products")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  <div
                    className={`${category.color} category-icon rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3`}
                    style={{ width: 70, height: 70 }}
                  >
                    <Icon size={30} />
                  </div>

                  <span className="fw-semibold text-dark">{category.name}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Popular Products */}

      <section className="container py-5" id="popular-products">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Popular Products</h2>
          <button className="btn btn-outline-success">View All</button>
        </div>

        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading grocery products...</p>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && (
          <div className="row g-4">
            {products.map((product) => (
              <div className="col-6 col-md-4 col-lg-3" key={product.id}>
                <div className="card h-100 border-0 shadow-sm product-card">
                  <div className="p-3 text-center">
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="img-fluid"
                      style={{
                        height: 160,
                        width: "100%",
                        objectFit: "contain",
                      }}
                      loading="lazy"
                    />
                  </div>

                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-semibold">{product.title}</h6>



                    <div className="mt-auto">
                      <p className="text-success fw-bold fs-5">
                        ${Number(product.price).toFixed(2)}
                      </p>

                      <button
                        type="button"
                        className="btn btn-success w-100"
                        onClick={() => {
                          if (!currentUser) {
                            setCartMessage("Please log in before adding items to your cart.");
                            return;
                          }

                          onAddToCart(product);
                          setCartMessage(`${product.title} added to your cart.`);
                        }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {cartMessage && (
          <div className="alert alert-info mt-3" role="status">
            {cartMessage}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="text-center text-muted">No grocery products found.</p>
        )}
      </section>

{/* Special Offers Section */}
<section className="container pb-5" id="special-offers">
  <div className="d-flex justify-content-between align-items-center mb-4">
    <div>
      <h2 className="fw-bold mb-1">Special Offers</h2>
      <p className="text-muted mb-0">
        Great deals on your daily groceries!
      </p>
    </div>

    <span className="badge bg-success fs-6">Hot Deals</span>
  </div>

  <div className="row g-4">
    <div className="col-12 col-md-6">
      <div className="offer-card offer-fruits p-4 p-md-5 rounded-4 h-100">
        <span className="badge bg-warning text-dark mb-3">
          FRESH DEAL
        </span>

        <h3 className="fw-bold">Fresh Fruits</h3>
        <h4 className="fw-bold text-success">Up to 30% OFF</h4>

        <p className="text-muted">
          Fresh and juicy fruits for your family.
        </p>

        <button
          className="btn btn-success"
          onClick={() =>
            document.getElementById("popular-products")?.scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          Shop Now
        </button>
      </div>
    </div>

    <div className="col-12 col-md-6">
      <div className="offer-card offer-daily p-4 p-md-5 rounded-4 h-100">
        <span className="badge bg-danger mb-3">DAILY ESSENTIALS</span>

        <h3 className="fw-bold">Daily Essentials</h3>
        <h4 className="fw-bold text-success">Save More Today</h4>

        <p className="text-muted">
          Stock up on everyday grocery essentials.
        </p>

        <button
          className="btn btn-success"
          onClick={() =>
            document.getElementById("popular-products")?.scrollIntoView({
              behavior: "smooth",
            })
          }
        >
          Explore Products
        </button>
      </div>
    </div>
  </div>
</section>


{/* Why Choose QuickMart Section */}
<section className="container py-5" id="why-quickmart">
  <div className="text-center mb-5">
    <h2 className="fw-bold">Why Choose QuickMart?</h2>
    <p className="text-muted">
      Making your grocery shopping simple and convenient.
    </p>
  </div>

  <div className="row g-4 text-center">
    <div className="col-6 col-lg-3">
      <div className="feature-card p-4 h-100">
        <div className="feature-icon mx-auto mb-3">
          <i className="bi bi-truck"></i>
        </div>
        <h5 className="fw-bold">Fast Delivery</h5>
        <p className="text-muted mb-0">
          Get your groceries delivered to your doorstep.
        </p>
      </div>
    </div>

    <div className="col-6 col-lg-3">
      <div className="feature-card p-4 h-100">
        <div className="feature-icon mx-auto mb-3">
          <i className="bi bi-leaf"></i>
        </div>
        <h5 className="fw-bold">Fresh Products</h5>
        <p className="text-muted mb-0">
          Shop for fresh fruits and everyday essentials.
        </p>
      </div>
    </div>

    <div className="col-6 col-lg-3">
      <div className="feature-card p-4 h-100">
        <div className="feature-icon mx-auto mb-3">
          <i className="bi bi-shield-check"></i>
        </div>
        <h5 className="fw-bold">Secure Payment</h5>
        <p className="text-muted mb-0">
          Enjoy a convenient and secure checkout experience.
        </p>
      </div>
    </div>

    <div className="col-6 col-lg-3">
      <div className="feature-card p-4 h-100">
        <div className="feature-icon mx-auto mb-3">
          <i className="bi bi-headset"></i>
        </div>
        <h5 className="fw-bold">Customer Support</h5>
        <p className="text-muted mb-0">
          Get help whenever you need assistance.
        </p>
      </div>
    </div>
  </div>
</section>

{/* Customer Reviews Section */}
<section className="container py-5" id="customer-reviews">
  <div className="text-center mb-5">
    <h2 className="fw-bold">What Our Customers Say</h2>
    <p className="text-muted">
      See why customers love shopping with QuickMart.
    </p>
  </div>

  <div className="row g-4">
    <div className="col-12 col-md-4">
      <div className="review-card p-4 h-100">
        <div className="text-warning mb-3">
          ★★★★★
        </div>

        <p className="text-muted">
          "Fresh groceries and a smooth shopping experience.
          Finding my daily essentials is so easy!"
        </p>

        <div className="d-flex align-items-center gap-3 mt-4">
          <div className="review-avatar">R</div>
          <div>
            <h6 className="fw-bold mb-1">Rahul</h6>
            <small className="text-muted">Happy Customer</small>
          </div>
        </div>
      </div>
    </div>

    <div className="col-12 col-md-4">
      <div className="review-card p-4 h-100">
        <div className="text-warning mb-3">
          ★★★★★
        </div>

        <p className="text-muted">
          "The website is easy to use, and I can browse
          grocery products without any hassle."
        </p>

        <div className="d-flex align-items-center gap-3 mt-4">
          <div className="review-avatar">P</div>
          <div>
            <h6 className="fw-bold mb-1">Priya</h6>
            <small className="text-muted">Happy Customer</small>
          </div>
        </div>
      </div>
    </div>

    <div className="col-12 col-md-4">
      <div className="review-card p-4 h-100">
        <div className="text-warning mb-3">
          ★★★★★
        </div>

        <p className="text-muted">
          "I love the simple design and product categories.
          Shopping for everyday essentials feels convenient."
        </p>

        <div className="d-flex align-items-center gap-3 mt-4">
          <div className="review-avatar">A</div>
          <div>
            <h6 className="fw-bold mb-1">Ananya</h6>
            <small className="text-muted">Happy Customer</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


    </main>
  );
};

export default Body;
