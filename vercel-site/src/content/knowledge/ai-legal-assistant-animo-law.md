---
type: "case"
title: "AI for legal: A customer case in collaboration with Animo"
description: "Discover how Acumen helped Animo transform a growing legal knowledge base into a smart, AI-powered assistant. The result? Instant answers, greater efficiency, and future-proof legal research through advanced technology."
excerpt: "When Animo’s legal knowledge base became too vast to navigate efficiently, they partnered with Acumen to build an AI-powered legal assistant. The result: faster access to relevant legal insights, reduced research time and a competitive edge - all powered by their own data."
date: 2025-04-07T15:02:21.000Z
updated: 2025-04-17T08:31:26.000Z
author: "josse-marchoul"
tags: ["AI"]
image:
  width: 2560
  height: 1707
  src: "/wp-content/uploads/2025/02/DSCF1029-scaled.webp"
  alt: ""
  srcset: "/wp-content/uploads/2025/02/DSCF1029-scaled.webp 2560w, /wp-content/uploads/2025/02/DSCF1029-300x200.webp 300w, /wp-content/uploads/2025/02/DSCF1029-1024x683.webp 1024w, /wp-content/uploads/2025/02/DSCF1029-768x512.webp 768w, /wp-content/uploads/2025/02/DSCF1029-1536x1024.webp 1536w, /wp-content/uploads/2025/02/DSCF1029-2048x1365.webp 2048w"
ogImage: "/wp-content/uploads/2025/02/DSCF1029-scaled.jpg"
client: "Animo"
industry: "Legal services (tax law)"
technologies: ["Retrieval-Augmented Generation (RAG)", "Large language models", "Vector database", "Graph database"]
results:
  - value: "50,000+"
    label: "configuration variations evaluated to optimise retrieval accuracy and response quality"
outcome:
  decision: "Which sources answer this client’s legal question?"
  result: "Lawyers of every experience level retrieve relevant legal information instantly, with answers based on Animo’s own knowledge base."
quote:
  text: "Animo now has access to smart and fast AI assistance for their legal inquiries, based on their own knowledge base."
cta:
  title: "What can Acumen do for me?"
  text: "Get in touch to improve your organization with AI."
---

In the fast-paced world of tax law, having instant access to the right information can make all the difference. [Animo](https://animo-law.be/), a specialized tax law firm based in Leuven, assists clients with tax rulings, audits and disputes. To enhance their services, they developed a comprehensive knowledge base covering various legal topics. However, navigating this vast repository proved to be a challenge, particularly for junior lawyers who had to sift through complex directory structures and lengthy documents to find relevant information.

As Animo’s knowledge base grew, finding precise legal information became increasingly difficult. The manual search process was time-consuming and inefficient, often taking hours to locate and analyze the necessary legal texts. To maintain their competitive edge, Animo needed an AI-driven solution capable of answering complex legal questions by extracting and reasoning over their corpus of legal PDFs.

## Our AI solution

To address this challenge, an AI-driven solution was developed, leveraging a Retrieval-Augmented Generation (RAG) architecture to enhance legal research and document management.

The system is designed to perform a range of critical functions. First, it acts as an intelligent legal assistant, capable of answering intricate legal questions by applying advanced legal reasoning, referencing relevant statutes, case law and precedents. It ensures that responses are not only contextually accurate but also align with the latest legal frameworks.

Additionally, the system enables efficient management and querying of Animo’s existing knowledge base. It indexes and structures large volumes of legal literature, allowing users to retrieve information quickly and accurately. It can understand legal terminology and context, providing users with the most relevant excerpts and citations.

By integrating these capabilities, the AI-driven system enhances productivity, reduces research time and ensures that legal professionals can make informed decisions backed by comprehensive and accurate legal knowledge.

## The high-level architecture of the system

**1\. Input query of the user:**

An Animo employee puts a legal question into the system. When the employee uses the system for an inquiry of the generation of legal advice, sources can be in- and excluded based on their preference and the requirements of the case.

**2\. Retrieval of relevant information:**

The chunks of information that are relevant for the input question are retrieved.

**3\. Generator:**

Using these retrieved text fragments, a large language model (LLM) generates a comprehensive, context-aware legal response.

**4\. Legal reasoning:**

The system incorporates advanced legal reasoning principles to enhance response accuracy. By equipping the LLM with an understanding of the hierarchy of norms, jurisdictional variations and the significance of location and time in legal contexts, it ensures that responses align with the generally applicable legal framework and precedent.

As a result, the core technical components of the AI solution are:

**5\. Knowledge base:**

This is a collection of all documents, information, organizational data and specialized content that the system can look through for accurate responses. This not only includes their own knowledge base, but also automatically connects with various external sources. When uploading new documents to the knowledge base, all documents, footnotes, references… automatically update.

**6\. Complex handling of footnote references:**

The references can be included in the legal reasoning and are used to check if their knowledge base is complete or if there are missing references. Thanks to this, all the generated answers are based on a complete set of information.

**7\. Embedding model and vector database:**

The embedding model maps the information of the knowledge base into vectors while preserving the semantic relationships. These vectors are stored in a vector database.

**8\. Retriever:**

After receiving the input query of the user, the retriever compares the vector representation of the question with the vectors in the vector database and retrieves the chunks of information with the highest similarity. Postprocessing of the retrieved chunks is done by using techniques like a query reranker and document compression to improve the context that is used to eventually generate an answer for the user.

**9\. LLM:**

The text content of the vectors that are retrieved in the previous step is passed to a large language model to generate an answer using the content of the vectors as context. To ensure accuracy and relevance of the answer, the LLM needs to understand legal reasoning including the hierarchy of norms and how laws apply over time and across different regions.

**10\. User interface:**

A clear and simple user interface shows the AI-generated responses and the source documents to the user. Furthermore, it allows Animo to manage their users and the underlying knowledge base.

**11\. Testing:**

Given the rapid advancements in AI, rigorous testing was essential to ensure the system’s reliability. The solution was fine-tuned using a genetic algorithm to evaluate over 50,000 configuration variations, optimizing retrieval accuracy and response quality.

**12\. Graph database:**

Additionally, graph analytics was employed to assess the credibility of legal sources — giving greater weight to renowned authors and frequently cited publications.

## Business value and an outlook on the future

With the AI-powered solution in place, Animo can now:

-   Instantly retrieve relevant legal information based on client inquiries.
-   Seamlessly manage their knowledge base, including metadata and document updates.
-   Adapt quickly to evolving tax laws and regulations.
-   Empower lawyers of all experience levels with AI-assisted legal research.
-   Reduce manual research time by automatically linking references and footnotes, improving transparency and efficiency.

Thanks to our provided solution, Animo has access to smart and fast AI assistance for their legal inquiries, based on their own knowledge base.

Ongoing advancements in generative AI pave the way for significant future developments.

We look forward to the discovery of new generative AI techniques and evaluate how they can improve the accuracy of the system as well as enable deeper reasoning capabilities. Furthermore, the use of other data types beyond text and adding more features to the system will allow Animo to integrate generative AI seamlessly in their professional workflow.
