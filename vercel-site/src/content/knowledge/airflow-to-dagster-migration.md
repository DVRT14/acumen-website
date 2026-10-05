---
type: "blog"
title: "How to easily migrate from Airflow to Dagster"
seoTitle: "Airflow to Dagster: Unlock the future of data orchestration"
description: "Discover how to easily migrate from Airflow to Dagster with this step-by-step approach. Reduce costs, minimize risks, and unlock immediate business value for your data platform."
excerpt: "Thinking about upgrading your data platform? Learn how migrating from Airflow to Dagster with Airlift ensures a smooth, cost-effective transition\\u2014delivering immediate value while future-proofing your data operations."
date: 2025-01-23T08:05:19.000Z
updated: 2025-01-23T08:03:54.000Z
author: "joris"
tags: ["Dagster","Data engineering"]
takeaways:
  - "Airlift, a Dagster Labs toolkit, splits the move from Airflow to Dagster into three incremental steps: Peer, Observe and Migrate."
  - "In the Peer step, a single function call displays all your Airflow tasks and DAGs in the Dagster UI."
  - "In the Observe step, Dagster listens to Airflow runs and adds lineage, data quality and alerting while tasks still run in Airflow."
  - "Tasks then move to Dagster one at a time, with per-task rollback and clear progress tracking instead of a big bang migration."
image:
  width: 1816
  height: 1126
  src: "/wp-content/uploads/2025/01/DSCF6831-scaled-e1737554254247.webp"
  alt: ""
  srcset: "/wp-content/uploads/2025/01/DSCF6831-scaled-e1737554254247.webp 1816w, /wp-content/uploads/2025/01/DSCF6831-scaled-e1737554254247-300x186.webp 300w, /wp-content/uploads/2025/01/DSCF6831-scaled-e1737554254247-1024x635.webp 1024w, /wp-content/uploads/2025/01/DSCF6831-scaled-e1737554254247-768x476.webp 768w, /wp-content/uploads/2025/01/DSCF6831-scaled-e1737554254247-1536x952.webp 1536w"
ogImage: "/wp-content/uploads/2025/01/DSCF6831-scaled-e1737554254247.jpg"
cta:
  title: "Need our Dagster guidance?"
  text: "Reach out to explore how we can support you with Dagster."
---

In our previous two blog posts, we explored [the strengths of Dagster](/knowledge/unlocking-data-orchestration-with-dagster/) and [compared it with Airflow](/knowledge/dagster-vs-airflow-data-orchestration/). To recap: Dagster is an asset-oriented orchestrator that excels in monitoring data pipelines, providing a complete cockpit view of your data platform, and structuring data assets into an intuitive data catalog.

Today, we focus on how we and Airlift by Dagster Labs can help you achieve a seamless, step-by-step transition to gain this asset-oriented view in your data platform, all without the need for a large-scale migration project.

## What is Airlift?

Airlift is a toolkit developed by Dagster Labs to accelerate, lower the cost, and reduce the risk of migrating from Airflow to Dagster. It divides the migration process into three simple and incremental steps, delivering business value from the very beginning:

**1\. Peer**: With just a few lines of code, Airflow DAGs automatically appear in Dagster.

**2\. Observe**: View and monitor assets produced by Airflow in the Dagster UI.

**3\. Migrate**: Incrementally move your Airflow tasks to Dagster, task by task.

This approach minimizes risk, keeps costs low, and avoids the challenges of a “big bang” migration. It also ensures that value is created from the very first step.

## Breaking down the migration steps

### Step 1: Peer

In this step, an implicit asset graph is generated from your Airflow code. With a single function call in Dagster (build\_defs\_from\_airflow\_instance), all tasks and DAGs are displayed in the Dagster UI.

At this stage, Airflow runs are not yet recorded in Dagster, but you’ve already set the stage for future integration.

### Step 2: Observe

Next, Dagster begins listening to Airflow’s runs database. You can trigger tasks and DAGs within Dagster while they still execute in Airflow.

This step offers immediate benefits:

-   **Data lineage**: Understand relationships between tasks and DAGs.
-   **Data quality**: Leverage Dagster’s built-in tools to ensure data integrity.
-   **Alerting & scheduling**: Use Dagster’s advanced features to manage downstream workflows.

After the “Observe” step, you can start developing new pipelines directly in Dagster while Dagster continues to trigger your existing Airflow DAGs. This ensures your data users remain satisfied throughout the migration process.

### Step 3: Migrate

The final step involves migrating your Airflow tasks to Dagster incrementally. With Airlift, tasks are migrated one at a time, in parallel, creating a manageable and structured migration process.

Here are the advantages:

-   **Step-by-step migration**: Break the project into smaller, achievable blocks.
-   **Immediate feedback**: See results for each migrated task directly in Dagster.
-   **Rollback capability**: Easily roll back individual tasks if needed.
-   **Clear progress tracking**: Dagster’s UI provides a visual overview of the migration status.

During this step, Dagster becomes the source of truth for your data orchestration, and minimal changes are required to your Airflow code until you’re ready to deprecate it entirely.

> Dagster’s asset-oriented orchestration helps organizations manage their data platforms more effectively, offering better control, reduced operational costs, and improved scalability.

## In short

For businesses, seamless data operations are critical for staying competitive and making data-driven decisions. With the Peer – Observe – Migrate approach, powered by Airlift from Dagster Labs, companies can ensure a smooth migration from Airflow to Dagster with minimal disruption. This process delivers business value immediately by improving visibility, streamlining workflows, and enabling faster and more accurate decision-making.

Dagster’s asset-oriented orchestration helps organizations manage their data platforms more effectively, offering better control, reduced operational costs, and improved scalability. By transitioning incrementally, your teams can continue delivering results without downtime or overwhelming change.

As an official Dagster implementation partner, Acumen is here to guide you every step of the way. Let us help your business unlock the full potential of modern data orchestration.
