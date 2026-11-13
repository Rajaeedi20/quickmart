# QuickMart

## CI/CD

The GitHub Actions workflow at `.github/workflows/ci-cd.yml` runs frontend
lint/build checks and tests each Spring Boot service on pull requests to `main`
and pushes to `main` or version tags (`v*`). Backend tests run with MySQL and
Kafka services.

After all checks pass on a push to `main` or a version tag, the workflow builds
and publishes the three service images to GitHub Container Registry (GHCR):

- `ghcr.io/rajaeedi20/quickmart-user-service`
- `ghcr.io/rajaeedi20/quickmart-product-service`
- `ghcr.io/rajaeedi20/quickmart-payment-service`

Pushes to `main` publish `main`, the commit SHA, and `latest` tags. Version tags
such as `v1.2.3` publish the version and commit SHA tags. Publishing uses the
workflow's `GITHUB_TOKEN`; no registry secret is required. Images are private
by default unless their GHCR package visibility is changed. This pipeline
publishes container images; deploying them to a hosting provider requires that
provider's credentials and deployment configuration.
