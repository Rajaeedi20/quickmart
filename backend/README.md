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

Payment completion events are written to the payment-service outbox in the
same transaction as the payment record. The outbox publisher sends them to the
`payment.completed` Kafka topic. user-service consumes each event and records a
notification linked to its local user row; duplicate event IDs are ignored.

## Run the services with Docker Compose

From the `backend` directory, build the three service images and start all
services and infrastructure:

```powershell
docker compose up --build -d
```

Compose starts MySQL, creates all three databases, then starts the services
after MySQL and Kafka are healthy. Hibernate creates/updates tables only in
each service's own database. MySQL is exposed on host port `3307` so it will
not conflict with a locally installed MySQL on port `3306`; services in Compose
connect to MySQL on its internal port `3306`. The MySQL data is kept in the
`mysql-data` Docker volume. Set `MYSQL_ROOT_PASSWORD` before starting Compose
to use a custom password; the Compose fallback is for local development only.
For example:

```powershell
$env:MYSQL_ROOT_PASSWORD = "your-local-mysql-password"
docker compose up --build -d
```

The APIs are available on ports 8081 (product), 8082 (user), and 8083
(payment); Kafka remains available to host applications on `localhost:9092`.
To inspect startup errors, use
`docker compose logs -f user-service product-service payment-service`. Stop
the containers without deleting data with `docker compose down`.

To run a service directly with Maven instead, start MySQL first and set
`MYSQL_USERNAME` and `MYSQL_PASSWORD` to match the local MySQL account. Kafka
consumption is disabled by default for direct runs, so user registration can
work without Kafka; start Kafka and set `KAFKA_LISTENER_AUTO_STARTUP=true` if
you also want user-service to consume payment notifications. Run each service
in a separate PowerShell window from its own directory. For example, from the
`backend` directory:

```powershell
$env:MYSQL_USERNAME = "root"
$env:MYSQL_PASSWORD = Read-Host "MySQL password"
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
starting Maven. A Vite HTTP 502 means the frontend proxy could not reach a
running service; it is not a request-validation error. If using the Compose
MySQL container for direct Maven runs, start it with
`docker compose up -d mysql`, set the service's database URL to
`jdbc:mysql://localhost:3307/<service-database>?createDatabaseIfNotExist=true`,
and set `MYSQL_PASSWORD` to the same value as `MYSQL_ROOT_PASSWORD` used by
Compose.
