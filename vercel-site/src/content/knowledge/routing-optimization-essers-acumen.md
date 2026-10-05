---
type: "case"
title: "Routing Optimization: A commercial simulation engine for smarter logistics decisions"
seoTitle: "AI-Powered Routing Optimization for Logistics"
description: "Discover how Essers uses an AI-driven routing optimization simulation to handle complex logistics networks, identify efficiency gains, and support smarter customer decisions."
excerpt: "Together with Essers, Acumen developed a routing optimization simulation that makes complex logistics networks manageable. By analyzing large volumes of orders across multiple scenarios, the solution reveals efficiency gains and supports more informed, data-driven customer conversations."
date: 2026-03-24T09:10:39.000Z
updated: 2026-03-24T15:34:10.000Z
author: "niels-donders"
tags: ["AI"]
image:
  width: 1707
  height: 2560
  src: "/wp-content/uploads/2025/10/DSCF1127-scaled.webp"
  alt: ""
  srcset: "/wp-content/uploads/2025/10/DSCF1127-scaled.webp 1707w, /wp-content/uploads/2025/10/DSCF1127-200x300.webp 200w, /wp-content/uploads/2025/10/DSCF1127-683x1024.webp 683w, /wp-content/uploads/2025/10/DSCF1127-768x1152.webp 768w, /wp-content/uploads/2025/10/DSCF1127-1024x1536.webp 1024w, /wp-content/uploads/2025/10/DSCF1127-1365x2048.webp 1365w"
ogImage: "/wp-content/uploads/2025/10/DSCF1127-scaled.jpg"
client: "H.Essers"
clientLogo:
  src: "/wp-content/uploads/2024/05/h-essers.webp"
  alt: "H.Essers logo"
  width: 102
  height: 64
industry: "Logistics & transport"
technologies: ["Databricks", "Apache Spark", "Python", "Google OR-Tools"]
outcome:
  decision: "Which routing and consolidation options to propose to each customer?"
  result: "H.Essers compares routing scenarios on real order data and brings substantiated options to customer conversations."
quote:
  text: "Turn thousands of complex routing possibilities into clear, data-driven logistics decisions."
cta:
  title: "Want our AI expertise in your organization?"
  text: "Reach out below!"
---

In a highly competitive logistics market, preparing well-founded commercial offers requires handling large volumes of orders across a complex logistics network. Transport costs are influenced by many factors such as distance, transport modality, consolidation opportunities and network structure, while the number of possible combinations grows exponentially with order volume. Solving this manually, for instance in spreadsheets, quickly becomes impractical.

Together with [H.Essers](https://www.essers.com/), we built a routing optimization solution that automates this complexity. The tool takes a set of transport orders as input and determines how they can be transported most efficiently through the H.Essers network. The result is a simulation platform that reveals opportunities for consolidation, modal shift and efficiency gains, supporting H.Essers in structuring better logistics proposals and having more substantiated conversations with customers.

## What was built?

The Routing Optimization solution is designed as a commercial simulation tool. It takes a set of transport orders as input and determines how these orders can be transported most efficiently through the H.Essers network.

The solution calculates optimal transport routes for each order, taking into account the full logistics network, including cross docks and terminals. Where possible, orders are combined so they can be transported together instead of individually. This increases load efficiency and reduces the total number of kilometers, while still respecting operational and commercial constraints.

By adjusting parameters, H.Essers can simulate different scenarios and evaluate their impact. For example comparing direct transport versus cross-dock routing or assessing the potential of a modal shift. For each scenario, the solution produces clear and tangible outputs focused on efficiency and consolidation potential. While the optimization logic is advanced, the outcome remains transparent and controllable.

**Added value for H.Essers**

The main value of the solution lies in its ability to handle large volumes and high complexity. This type of routing exercise, combining hundreds of orders across a multi-node network while respecting capacity, time window and routing constraints, is simply too complex to solve manually. The solution makes it controllable and repeatable.

By running simulations on real order data, H.Essers can identify where efficiency gains are achievable: which lanes benefit most from consolidation, whether a modal shift makes sense and how network choices affect the overall number of kilometers driven. These insights inform how H.Essers structures its proposals and discusses logistics options with customers.

The ability to compare multiple routing scenarios also strengthens customer conversations. Instead of presenting a single option, H.Essers can show how different routing or consolidation choices affect efficiency and sustainability, positioning H.Essers as a proactive logistics partner that actively supports customers in making informed decisions. Translating identified potential into actual operational results remains the responsibility of the operations team.

## Collaboration and way of working

This project was approached as a true partnership between H.Essers and Acumen. The solution was developed iteratively, with regular feedback moments throughout the project. H.Essers was closely involved in validating assumptions, testing intermediate results and providing both data and business expertise. This close collaboration ensured that the solution reflects real operational constraints and commercial needs.

Trust and transparency played a key role during the entire collaboration. Open communication and continuous alignment allowed both teams to move forward efficiently and build a solution that is both technically robust and practically usable.

**Technical implementation**

The Routing Optimization solution was built with scalability, stability and long-term use in mind. Given the complexity of routing and bundling calculations, the underlying technology needed to support heavy computation while remaining reliable and future-proof.

The solution runs on the Databricks platform, leveraging the distributed computing power of Apache Spark. This allows calculations to be spread across a compute cluster, enabling efficient processing of both small and large simulation scenarios. The infrastructure automatically scales depending on the workload, ensuring consistent performance as scenario complexity or data volumes increase.

All core logic is implemented in Python, providing a flexible and maintainable foundation. For the optimization itself, the solution uses Google OR-Tools, a proven framework for constraint programming and combinatorial optimization. This enables the system to handle complex routing decisions, consolidation rules and operational constraints in a structured and reliable way.

By combining distributed data processing with advanced optimization techniques, the solution delivers consistent and repeatable results. At the same time, the architecture remains transparent and extensible, ensuring that the solution can evolve as new requirements emerge.

## Product setup and current status

Today, the Routing Optimization solution is actively used to run new customer scenarios. It is a stable and reliable product that supports H.Essers in their commercial processes. The solution was built specifically for H.Essers, fully aligned with their network, business rules and strategic ambitions. While it already delivers clear value today, it also provides a solid foundation for further development as H.Essers continues to refine and expand its commercial capabilities.

**Looking ahead**

This project shows how advanced optimization techniques can be translated into tangible business value when combined with deep domain knowledge and close collaboration. By building a tailored commercial simulation tool, H.Essers has taken an important step towards more data-driven and transparent logistics decision-making.

Acumen acted as the technical expert supporting this innovation and we see this solution as the start of a longer-term partnership in which data and AI will continue to play an important role in shaping the future of logistics at H.Essers.
