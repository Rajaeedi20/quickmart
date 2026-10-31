# Backend services

Each service owns a separate MySQL database. Hibernate creates or updates only
the tables for that service in its configured database:

| Service | Default database | Port |
| --- | --- | --- |
| product-service | `quickmart_product` | 8081 |
| user-service | `quickmart_db` | 8082 |
| payment-service | `quickmart_payments` | 8083 |

Their entity tables are not shared between services. Database URLs can be
overridden with `PRODUCT_DB_URL`, `USER_DB_URL`, and `PAYMENT_DB_URL`.

The product service stores category records in `product_categories`
(`id`, `category_name`, `created_at`) and products in `products` with a
`category_id` foreign key, description, image URL, name, price, quantity, and
creation time. The admin dashboard can add categories and products; it loads
them through `GET /api/categories` and `GET /api/products`, and saves them
through the corresponding `POST` endpoints. Existing products with a text
category are assigned to a matching category when the product service starts.

Payment completion events are written to the payment-service outbox in the
same transaction as the payment record. The outbox publisher sends them to the
`payment.completed` Kafka topic. payment-service validates product prices and
available quantities against product-service, then saves the order, order
items, and successful demo payment in `quickmart_payments`. product-service
consumes each event and deducts stock once per event; user-service records the
customer, order, and purchased items for the admin purchase report. Duplicate
event IDs are ignored by both consumers.

## Run the services with Docker Compose

From the `backend` directory, create a local `.env` file using `.env.example`,
set unique values for `MYSQL_PASSWORD`, `QUICKMART_ADMIN_EMAIL`, and
`QUICKMART_ADMIN_PASSWORD`, then build the service images and start all
services and infrastructure:

```powershell
Copy-Item .env.example .env
# Edit .env and replace the example credentials before starting services.
docker compose up --build -d
```

The admin account is configured only through these environment variables; it
cannot be created through customer registration. Sign in through the app's
**Admin login** link. The admin dashboard lists customer name, email, mobile
number, account ID, and registration date. Existing accounts created before
registration dates were recorded display “Not recorded.” Passwords and password
hashes are never included in the dashboard response.

Compose MySQL is used by user-service. product-service and payment-service
connect to the MySQL server used by MySQL Workbench on the host at
`host.docker.internal:3306` by default, so `quickmart_product` and
`quickmart_payments` are shared with Workbench. Set `PRODUCT_DB_URL`,
`PAYMENT_DB_URL`, `MYSQL_USER`, and `MYSQL_PASSWORD` in `.env` to match that
MySQL connection. The application user must have permission to read and update
`quickmart_product`, and to create/alter and write the `quickmart_payments`
tables. Existing category, order, and payment tables are preserved. To use the
Compose MySQL server for products instead, set
`PRODUCT_DB_URL=jdbc:mysql://mysql:3306/quickmart_product?createDatabaseIfNotExist=true`.
For payments in Compose MySQL, set
`PAYMENT_DB_URL=jdbc:mysql://mysql:3306/quickmart_payments?createDatabaseIfNotExist=true`.
Product images can be uploaded from the admin product form. Image files are
validated as PNG, JPEG, GIF, or WebP (up to 5 MB), saved in the persistent
`product-images` Docker volume, and served from `/uploads/products/...`; the
returned image path is saved in `products.image_url`.
Hibernate creates/updates tables only in each service's configured database.
The host ports default to `3307` (Compose MySQL), `9092` (Kafka), `8081` (product),
`8082` (user), and `8083` (payment); override them in `.env` with
`MYSQL_EXTERNAL_PORT`, `KAFKA_EXTERNAL_PORT`, `PRODUCT_SERVICE_PORT`,
`USER_SERVICE_PORT`, and `PAYMENT_SERVICE_PORT` if those ports are already in
use. User and payment services in Compose connect to their MySQL container on
its internal port `3306`. The Compose MySQL data is kept in the `mysql-data`
Docker volume. Set `MYSQL_ROOT_PASSWORD`
before starting Compose to use a custom password; the Compose fallback is for
local development only. For example:

```powershell
$env:MYSQL_ROOT_PASSWORD = "your-local-mysql-password"
docker compose up --build -d
```

Admin login and payment requests accept the frontend origin configured by
`APP_FRONTEND_URL` in `.env` (default `http://localhost:5173`). If opening the
app from another device or through a LAN address, set it to the exact frontend
URL, such as `http://<your-computer-ip>:5173`, then recreate user-service and
payment-service with `docker compose up -d --force-recreate user-service
payment-service`.

The APIs use the configured host ports; Kafka remains available to host
applications on the configured external port.
To inspect startup errors, use
`docker compose logs -f user-service product-service payment-service`. Stop
the containers without deleting data with `docker compose down`.

To run a service directly with Maven instead, start MySQL first and set
`MYSQL_USERNAME` and `MYSQL_PASSWORD` to match the local MySQL account. For
user-service admin login, also set `QUICKMART_ADMIN_EMAIL` and
`QUICKMART_ADMIN_PASSWORD` in that PowerShell window; admin login stays
disabled when either is missing. Kafka consumption is disabled by default for
direct runs, so user registration can work without Kafka; start Kafka and set
`KAFKA_LISTENER_AUTO_STARTUP=true` if you also want user-service to consume
payment notifications. Run each service in a separate PowerShell window from
its own directory. For example, from the `backend` directory:

```powershell
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = Read-Host "MySQL password"
$env:QUICKMART_ADMIN_EMAIL = "admin@example.com"
$env:QUICKMART_ADMIN_PASSWORD = Read-Host "Admin password"
Set-Location user-service
.\mvnw.cmd spring-boot:run
```

For payment-service, use the same credentials in a separate window:

```powershell
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = Read-Host "MySQL password"
Set-Location payment-service
.\mvnw.cmd spring-boot:run
```

If startup logs show `Access denied for user 'root'@'localhost' (using
password: NO)`, `MYSQL_PASSWORD` was not set in that PowerShell window. Enter
the password for the MySQL server listening on `localhost:3306` before
starting Maven. payment-service also needs `PRODUCT_SERVICE_URL` pointing to a
running product-service and Kafka available for payment completion events. A
Vite HTTP 502 means the frontend proxy could not reach a
running service; it is not a request-validation error. If using the Compose
MySQL container for direct Maven runs, start it with
`docker compose up -d mysql`, set the service's database URL to
`jdbc:mysql://localhost:3307/<service-database>?createDatabaseIfNotExist=true`,
and set `MYSQL_PASSWORD` to the same value as `MYSQL_ROOT_PASSWORD` used by
Compose.
