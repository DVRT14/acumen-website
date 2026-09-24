# Forms that need a new backend

Every Elementor Pro form on this site currently POSTs to `/wp-admin/admin-ajax.php`, which no longer exists in this static export. Elementor Pro's own client-side error handling already shows visitors a generic failure message, so nothing silently "succeeds" — but nothing works either. Wire up a replacement (Formspree, Netlify Forms, a small serverless function, etc.) and update the form's action/JS config before shipping.

Pages with a form (34), each marked with a TODO comment in its HTML:

- knowledge/a-comparison-of-apache-iceberg-and-delta-lake/index.html
- knowledge/agentic-ai-from-experiments-to-work-that-runs-itself/index.html
- knowledge/ai-legal-assistant-animo-law/index.html
- knowledge/ai-project-roadmap/index.html
- knowledge/airflow-to-dagster-migration/index.html
- knowledge/animo-ai-powered-legal-assistant/index.html
- knowledge/bionerga-future-ready-data-platform/index.html
- knowledge/building-a-robust-csrd-reporting-strategy-a-path-to-successful-compliance/index.html
- contact/index.html
- knowledge/continuous-data-support/index.html
- knowledge/dagster-vs-airflow-data-orchestration/index.html
- knowledge/data-intelligence-platform-databricks/index.html
- knowledge/data-warehouse-to-lakehouse-whitepaper/index.html
- knowledge/de-riziv-controleshoft-is-ingezet/index.html
- knowledge/double-materiality-assessment/index.html
- knowledge/embracing-esg-csrd/index.html
- knowledge/enhanced-sales-insights-leveraging-power-bi-reporting/index.html
- knowledge/esg-reporting-data-deadlines/index.html
- knowledge/future-ready-data-strategy-microsoft-fabric/index.html
- knowledge/genarative-ai-and-power-bi/index.html
- knowledge/jump-start-your-data-lake-with-our-meta-data-driven-blueprint/index.html
- knowledge/kaneka-powerbi-sap-datasphere/index.html
- knowledge/modern-data-platform-whitepaper/index.html
- knowledge/our-ai-and-ml-services-more-info/index.html
- knowledge/power-bi-whitepaper/index.html
- knowledge/requirements-analysis-no-sexy-buzzword-but-nevertheless-indispensable/index.html
- knowledge/routing-optimization-essers-acumen/index.html
- knowledge/the-five-key-takeaways-you-should-know-about-the-eu-ai-act/index.html
- knowledge/the-necessity-and-benefits-of-extensive-logging-and-auditing-in-data-integration/index.html
- knowledge/transforming-business-machine-learning-applications/index.html
- knowledge/unlocking-data-orchestration-with-dagster/index.html
- careers/vacature-ai-engineer/index.html
- careers/vacature-analytics-engineer/index.html
- white-paper-download-page/index.html
