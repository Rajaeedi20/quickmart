#!/bin/sh
set -eu

mysql --protocol=socket -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
GRANT ALL PRIVILEGES ON quickmart_product.* TO '$MYSQL_USER'@'%';
GRANT ALL PRIVILEGES ON quickmart_payments.* TO '$MYSQL_USER'@'%';
SQL
