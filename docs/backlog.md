# Content question backlog

Remaps the 32 existing blog posts from marketing-style titles to the verbatim question they
should answer, per `references/content.md` §4-1. **Evidence is honest, not invented**: there's
no GSC/Search Console access from this session, so "Evidence" says so instead of a fabricated
impression count — wire up real GSC data before trusting the priority order below.

| Post (slug) | Current title style | Candidate question | Type | Status |
|---|---|---|---|---|
| agentic-ai | "Everything you need to know about Agentic AI" | what is agentic ai | glossary | ✅ FAQ added |
| dagster-vs-airflow-data-orchestration | "Dagster vs Airflow: The future for smarter, scalable workflows" | dagster vs airflow, what's the difference | comparison | ✅ FAQ added |
| a-comparison-of-apache-iceberg-and-delta-lake | "A Comparison of Apache Iceberg and Delta Lake" | apache iceberg vs delta lake | comparison | backlog |
| airflow-to-dagster-migration | "..." | how to migrate from airflow to dagster | question | backlog |
| unlocking-data-orchestration-with-dagster | "..." | what is dagster | glossary | backlog |
| the-five-key-takeaways-you-should-know-about-the-eu-ai-act | "..." | what is the eu ai act | glossary | backlog |
| double-materiality-assessment | "..." | what is double materiality assessment | glossary | backlog |
| embracing-esg-csrd | "..." | what is csrd reporting | glossary | backlog |
| building-a-robust-csrd-reporting-strategy-a-path-to-successful-compliance | "..." | how to build a csrd reporting strategy | question | backlog |
| esg-reporting-data-deadlines | "..." | when are the csrd/esg reporting deadlines | data | backlog |
| jump-start-your-data-lake-with-our-meta-data-driven-blueprint | "..." | what is a metadata-driven data lake blueprint | question | backlog |
| the-necessity-and-benefits-of-extensive-logging-and-auditing-in-data-integration | "..." | why is logging and auditing needed in data integration | question | backlog |
| requirements-analysis-no-sexy-buzzword-but-nevertheless-indispensable | "..." | why is requirements analysis important in data projects | question | backlog |
| continuous-data-support | "..." | what is continuous data support | glossary | backlog |
| genarative-ai-and-power-bi | "..." | how does generative ai work with power bi | question | backlog |
| enhanced-sales-insights-leveraging-power-bi-reporting | "..." | how to get better sales insights with power bi | question | backlog |
| power-bi-whitepaper | "..." | power bi whitepaper download | data | backlog |
| data-warehouse-to-lakehouse-whitepaper | "..." | data warehouse to lakehouse migration whitepaper | data | backlog |
| modern-data-platform-whitepaper | "..." | what is a modern data platform | glossary | backlog |
| data-intelligence-platform-databricks | "..." | what is databricks data intelligence platform | glossary | backlog |
| transforming-business-machine-learning-applications | "..." | how are businesses using machine learning applications | question | backlog |
| ai-project-roadmap | "..." | how to build an ai project roadmap | question | backlog |
| our-ai-and-ml-services-more-info | "..." | acumen ai and ml services | question | backlog |
| ai-legal-assistant-animo-law | "..." | what is animo ai legal assistant | glossary | backlog |
| animo-ai-powered-legal-assistant | "..." | how does animo's ai legal assistant work | question | backlog (near-duplicate of ai-legal-assistant-animo-law — flag for merge review) |
| agentic-ai-from-experiments-to-work-that-runs-itself | "..." | how to move agentic ai from experiments to production | question | backlog |
| data-agents-insights-action | "..." | what are data agents | glossary | backlog |
| kaneka-powerbi-sap-datasphere | "..." | kaneka power bi sap datasphere case study | buildlog | backlog |
| future-ready-data-strategy-microsoft-fabric | "..." | what is microsoft fabric data strategy | glossary | backlog |
| routing-optimization-essers-acumen | "..." | essers routing optimization case study | buildlog | backlog |
| bionerga-future-ready-data-platform | "..." | bionerga data platform case study | buildlog | backlog |
| de-riziv-controleshoft-is-ingezet | "..." | riziv controleshift case study | buildlog | backlog |

## Notes

- **Two near-duplicate posts flagged**: `ai-legal-assistant-animo-law` and
  `animo-ai-powered-legal-assistant` look like the same topic published twice. Per
  `references/content.md` §5, duplicates on the same question should be 301-merged to the
  stronger one rather than left to split rankings — worth a manual read-through to confirm
  before merging.
- **Candidate questions above are inferred from slugs/topic, not verified against real search
  data.** Before writing to any of these, follow §4-1's actual priority order: GSC/Bing
  Webmaster Tools queries with impressions and no dedicated page first.
- Case-study posts (kaneka, essers, bionerga, riziv) are `buildlog` type by nature — they don't
  need a question reframe, but do benefit from FAQPage schema on the "what problem did this
  solve / what tech was used" angle if search data supports it.
