// Concept: new storylines for the seven /expertise/* pages, rendered by pages/concept/expertise/[slug].astro.
// Order = the stack on /our-expertise/, top to bottom. Photos and expert portraits are read from the live
// src/content/expertise/<slug>.json, so nothing here duplicates image data.
// Every page follows the same beats: decision → symptoms → why it matters for AI → what we build → how → proof → FAQ → CTA.
// `review` lists what must be confirmed before any of this replaces the live page (shown only on /concept/expertise/).

// kind: 'case' = published customer case (href), 'article' = blog/whitepaper (href), 'anon' = unpublished, unnamed work.
// metric: one figure to feature (only real figures from the source case; omit when there is none).
export type Proof = { client: string; decision: string; result: string; href?: string; tags?: string[]; kind?: 'case' | 'article' | 'anon'; metric?: { value: string; label: string };
  // change: before → after, from the published case; fills the featured card's second column when there is no metric.
  change?: { before: string; after: string } };
// The one page-specific block, built from the page's own content:
// 'split' = two columns (a vs b, e.g. routine vs exception); 'rows' = a table of k → v (+ optional w);
// 'flow' = an ordered sequence of events (no durations).
export type Signature = {
  kind: 'split' | 'rows' | 'flow'; title: string; intro: string;
  a?: { label: string; items: string[] }; b?: { label: string; items: string[] };
  head?: [string, string] | [string, string, string]; rows?: { k: string; v: string; w?: string }[];
  steps?: { t: string; d: string }[];
};
export type Expertise = {
  slug: string; page: string; group: 'house' | 'foundation'; layer: string; ai?: boolean;
  // shape: 'phase' (strategy: a first phase), 'outcome' (AI, EPM, reporting, engineering, governance), 'service' (support: ongoing).
  shape?: 'phase' | 'outcome' | 'service';
  // eyebrow: short plain-language label above the H1 (the H1 is now `lead`; `page` stays in <title> and the eyebrow).
  eyebrow?: string;
  // depends: slugs of the layers this page relies on (shown in the hero stack, highlighted).
  depends?: string[];
  signature?: Signature;
  seo: { title: string; description: string };
  lead: string; intro: string;
  symptoms: { title: string; items: { t: string; d: string }[] };
  why: { title: string; text: string };
  build: { title: string; intro: string; items: { t: string; d: string }[]; scope?: string };
  stack?: string[];
  steps: { t: string; d: string }[];
  proof: Proof[];
  faq: { q: string; a: string }[];
  expert?: string;
  cta: { title: string; text: string; button?: string };
  review: string[];
};

const button = 'Plan a call';

export const expertises: Expertise[] = [
  {
    slug: 'data-strategy', page: 'Data Strategy', group: 'house', layer: 'Which decisions to automate first',
    shape: 'phase', eyebrow: 'Data Strategy · where to start', depends: [],
    seo: { title: 'Data Strategy: start with the decision | Acumen', description: 'A data strategy that starts from your recurring decisions, picks where data and AI pay off first and checks whether your data can carry them.' },
    lead: 'Start with the decision, not the data.',
    intro: 'Most data strategies list systems and tools. Ours starts from the decisions your organisation makes every day. We pick the few where data and AI pay off first, and check whether the data underneath can carry them.',
    symptoms: {
      title: 'Sound familiar?',
      items: [
        { t: 'A roadmap nobody uses', d: 'The strategy describes a target architecture, but not which decision gets better first, or when.' },
        { t: 'Ten AI ideas, no order', d: 'Every department has a use case. Nobody knows which one today’s data can support.' },
        { t: 'Pilots that never go live', d: 'The pilot worked on a clean sample. In production, the data turned out to mean something else.' },
      ],
    },
    why: { title: 'Strategy decides what runs automatically, and what stays with your experts.', text: 'We call this decision intelligence: routine decisions run on data, and the exceptions go to people. Choosing which decisions qualify, and in what order, is the strategy. Get the order wrong and you automate the hard cases first.' },
    signature: {
      kind: 'rows', title: 'Every decision scored on value and readiness',
      intro: 'A simplified example. Decisions that score high on both go first; the others get the foundation work they need.',
      head: ['Decision', 'Value', 'Data ready?'],
      rows: [
        { k: 'Which bookings need a confirmation call', v: 'High: fewer wasted visits', w: 'Yes: booking history is complete' },
        { k: 'How much stock to reorder each week', v: 'High: less overstock', w: 'Partly: supplier lead times are missing' },
        { k: 'Which customers are likely to leave', v: 'Medium', w: 'No: “active customer” has no agreed definition' },
      ],
    },
    build: {
      title: 'What you get',
      intro: 'A strategy you can start building on the next day:',
      items: [
        { t: 'Decision map', d: 'The recurring decisions, who makes them, how often, and the information each one needs.' },
        { t: 'Data readiness per decision', d: 'Is the data there, defined, owned and fresh enough? Measured with an automated scan of your systems, not estimated.' },
        { t: 'Prioritised roadmap', d: 'The first two or three use cases, their expected value, and the foundation work each one depends on.' },
        { t: 'Ownership basics', d: 'Named owners and agreed definitions for the data those first use cases rely on.' },
      ],
    },
    steps: [
      { t: 'Map', d: 'Interviews with the people who decide, and an automated scan of the systems behind them.' },
      { t: 'Score', d: 'Each decision on value and readiness, so the order follows from the facts.' },
      { t: 'Plan', d: 'One roadmap that sequences foundation work and use cases together, built by the team that will deliver it.' },
    ],
    proof: [
      { client: 'Bionerga', kind: 'case', href: '/knowledge/bionerga-future-ready-data-platform/', decision: 'How to unify facilities that each run their own data architecture?', result: 'An automated map of every data environment, then a roadmap to one platform with lineage, ownership and master data definitions built in.', tags: ['Microsoft Fabric', 'Dagster'], change: { before: 'Each facility on its own data architecture', after: 'One roadmap to a single platform, with lineage and ownership built in' } },
    ],
    faq: [
      { q: 'Do we need a data strategy before we start with AI?', a: 'You need one for the decision you start with, not for the whole organisation. We scope the strategy to the first use cases, so it leads straight into delivery instead of ending as a document.' },
      { q: 'Is this a separate project?', a: 'Usually it is the first phase of a data engineering or AI engagement. The team that sets the priorities also builds them.' },
      { q: 'What do you need from us?', a: 'Time with the people who make the decisions, and access to the systems behind them. The scan covers the technical side; the interviews cover what the numbers mean.' },
    ],
    expert: 'Glenn De Weerdt',
    cta: { title: 'Which decision would you <span>automate first?</span>', text: 'Bring the list. In a 30-minute call we sort it by value and readiness and tell you where to start.', button },
    review: [
      'Old page was a copy of the governance page (metadata, data quality). The new page is about choosing decisions; governance content moved to Data Governance.',
      'Expert: the live page names Glenn De Weerdt as author and Michel as contact. Confirm who owns strategy.',
      'Embedded model: strategy is sold as the first phase of an engagement, not standalone. The page says so (FAQ 2) and the shape is “phase”.',
      'Signature table uses generic illustrations, not client data. Only one proof card (Bionerga); a second strategy case would help.',
    ],
  },
  {
    slug: 'datascience-ai', page: 'Data Science & AI', group: 'house', layer: 'AI in your processes', ai: true,
    shape: 'outcome', eyebrow: 'Data Science & AI · decisions in your processes', depends: ['dataintegration-engineering', 'data-governance'],
    seo: { title: 'Data Science & AI for operational decisions | Acumen', description: 'AI inside your processes: predictions, optimisation, language models and agents that handle routine decisions and leave the exceptions to your experts.' },
    lead: 'AI that takes the routine decisions and hands your experts the exceptions.',
    intro: 'Who to call, what to stock, which route, when to service. We build models that sit inside the process, not next to it. Routine cases run automatically. Your planners and specialists get the exceptions, with the reason the model flagged them.',
    symptoms: {
      title: 'Sound familiar?',
      items: [
        { t: 'The pilot impressed, then stalled', d: 'It worked in the demo. Getting it into the booking system or the planning tool never happened.' },
        { t: 'Confident answers that are wrong', d: 'The AI assistant you already pay for answers every question, including the ones your data can’t support.' },
        { t: 'Experts buried in routine', d: 'Planners spend the day on cases a model could handle, and get to the hard ones last.' },
      ],
    },
    why: { title: 'Automate the routine. Escalate the exception.', text: 'That is what we mean by decision intelligence. It only works when the system knows when it is unsure. That takes data with tests, definitions and freshness checks underneath, which is why our AI work and our data engineering are one team.' },
    signature: {
      kind: 'split', title: 'Who handles what',
      intro: 'Taken from work we have delivered. The model takes the volume; people keep the judgement calls.',
      a: { label: 'Runs automatically', items: [
        'A no-show risk score for every booking',
        'Weekly visit schedules within legal and travel limits',
        'Routing options calculated on real order data',
        'Relevant sources retrieved for a legal question',
      ] },
      b: { label: 'Goes to your experts', items: [
        'High-risk bookings: a confirmation call before parts ship',
        'A schedule changed by hand: checked and repaired with minimal changes',
        'Which routing option to propose to the customer',
        'Questions the knowledge base can’t answer clearly',
      ] },
    },
    build: {
      title: 'What we build',
      intro: 'Four kinds of AI, each tied to a decision someone makes today:',
      items: [
        { t: 'Prediction', d: 'No-shows, demand, machine failures: forecasts that trigger an action, not a chart.' },
        { t: 'Optimisation', d: 'Routes, container loads, staff schedules: the best plan within your real constraints.' },
        { t: 'Language and documents', d: 'Assistants over your own knowledge base, technical drawings read automatically, customer feedback sorted by topic.' },
        { t: 'Agents', d: 'Multi-step tasks across systems, with a person approving the decisions that matter.' },
      ],
    },
    stack: ['Python', 'Databricks', 'Large language models', 'Retrieval-augmented generation', 'Google OR-Tools', 'AMPL'],
    steps: [
      { t: 'Pick the decision', d: 'One with a clear owner and an outcome you can measure.' },
      { t: 'Prove it on real data', d: 'A short experiment on production data, not a clean sample. If it doesn’t hold, you stop early.' },
      { t: 'Put it in the process', d: 'In the booking system, the planning tool, the daily routine. Monitored and retrained as things change.' },
    ],
    proof: [
      { client: 'H.Essers', kind: 'case', href: '/knowledge/routing-optimization-essers-acumen/', decision: 'Which routing and consolidation options to propose to each customer?', result: 'Routing scenarios compared on real order data, so every customer conversation starts from substantiated options.', tags: ['Databricks', 'Google OR-Tools'] },
      { client: 'Animo', kind: 'case', href: '/knowledge/ai-legal-assistant-animo-law/', decision: 'Which sources answer this client’s legal question?', result: 'Lawyers of every experience level retrieve relevant legal information instantly, from Animo’s own knowledge base.', tags: ['RAG', 'Large language models'], metric: { value: '50,000+', label: 'configuration variations evaluated to tune retrieval and answer quality' } },
      { client: 'Home-cleaning company', kind: 'anon', decision: 'Which household does each field employee visit, when, and in what order?', result: 'Weekly schedules within every legal and travel constraint. A planner’s own schedule is checked and repaired with minimal changes.', tags: ['AMPL'] },
      { client: 'Nationwide repair service', kind: 'anon', decision: 'Which booked customers won’t show up?', result: 'High-risk bookings get a confirmation call before parts are shipped and mechanics are scheduled.' },
    ],
    faq: [
      { q: 'We already have Copilot. Why build anything?', a: 'Copilot and similar assistants work well on data that is clearly described. Most company data isn’t yet, so the answers sound right and aren’t. We do the groundwork that makes those tools reliable, and build our own models where a decision needs more than a chat.' },
      { q: 'Do we need a large upfront investment?', a: 'No. Start with one decision and prove it on real data. If it holds, it goes into the process. If not, you stop early and know why.' },
      { q: 'Will AI replace our planners?', a: 'No. It takes the routine cases off their desk, so they spend their time on the exceptions, where their knowledge matters most.' },
    ],
    expert: 'Niels Donders',
    cta: { title: 'Which decision eats <span>your experts’ time?</span>', text: 'Tell us. In a 30-minute call we check whether a model can take the routine part, and what data it would need.', button },
    review: [
      'Old page described a generic ideation → experimentation → production flow. The new page leads with operational decisions, the strongest thread in the case library (19 real engagements).',
      'Anonymised proof cards (home-cleaning, repair service) come from unpublished cases: get client sign-off or keep them anonymous.',
      'Routing figures (up to 8% fewer trucks, >87% trailer fill) belong to the anonymised routing case, which is not confirmed as H.Essers. Left off the H.Essers card; add them once confirmed.',
      'A named delivery method is still missing (vault: Competence Center Consolidation, item 7). The three steps are a placeholder for it.',
    ],
  },
  {
    slug: 'data-planning-epm', page: 'Data Planning & EPM', group: 'house', layer: 'Plans, budgets and forecasts',
    shape: 'outcome', eyebrow: 'Planning & EPM · budgets and forecasts', depends: ['dataintegration-engineering'],
    seo: { title: 'Data Planning & EPM: plans that update with the business | Acumen', description: 'Budgets, forecasts and what-if scenarios in one connected model, from the yearly budget to operational capacity plans. Anaplan, IBM Planning Analytics and Aimplan.' },
    lead: 'Plans that update when the business does.',
    intro: 'From the yearly budget to next week’s capacity. Budgets, forecasts and what-if scenarios sit in one model, connected to actuals, so finance and operations plan on the same numbers. We have built planning models since 2007.',
    symptoms: {
      title: 'Sound familiar?',
      items: [
        { t: 'Forty spreadsheets and one deadline', d: 'Versions emailed around, links that break, and nobody sure which file is final.' },
        { t: 'Forecasts outdated on arrival', d: 'The cycle takes so long that the business has moved on by the time the numbers are in.' },
        { t: 'Finance plans one thing, operations another', d: 'The budget and the capacity plan use different assumptions, and meet only in a meeting.' },
      ],
    },
    why: { title: 'A plan is a decision about the future.', text: 'How many people, which trucks, what budget. Once a plan runs on connected data, the next step is a system that proposes the plan and planners who adjust it. That is decision intelligence applied to planning: the model does the routine calculation, people make the call.' },
    signature: {
      kind: 'rows', title: 'One question, several futures',
      intro: 'A fleet example: what does one truck cost per kilometre? Each scenario changes a driver; versions combine them.',
      head: ['Scenario', 'What changes'],
      rows: [
        { k: 'Fuel +5%', v: 'Cost per kilometre for every truck, on every route.' },
        { k: 'New road tax in one country', v: 'Cost on the routes through that country, from the date it applies.' },
        { k: '50 more trucks', v: 'Depreciation, drivers and capacity across the fleet.' },
        { k: 'All three combined', v: 'One version, compared side by side with the current plan.' },
      ],
    },
    build: {
      title: 'What we build',
      intro: 'One planning model, built around the drivers of your business:',
      items: [
        { t: 'Driver-based models', d: 'Cost, revenue and capacity calculated from the drivers that move them, not typed in.' },
        { t: 'Scenarios', d: 'What-if versions you can combine and compare side by side before you commit.' },
        { t: 'Forecast cycles', d: 'Rolling forecasts against actuals, with the variances explained.' },
        { t: 'Operational plans', d: 'Capacity, workforce and fleet plans connected to the financial plan.' },
      ],
    },
    stack: ['Anaplan', 'IBM Planning Analytics', 'Aimplan', 'Power BI'],
    steps: [
      { t: 'Choose the platform', d: 'We work with Anaplan, IBM Planning Analytics and Aimplan, so the advice follows your case, not a licence.' },
      { t: 'Model the drivers', d: 'With finance and operations together, so both plan on the same assumptions.' },
      { t: 'Run the cycle with you', d: 'We run the first cycles together, then your team owns it. When the business changes, the model changes with it.' },
    ],
    proof: [
      { client: 'Global pharma group', kind: 'anon', decision: 'How to plan bottom-up in 100+ countries and still add up?', result: 'One planning model, with frequent forecasts for the most critical parts of the business.', tags: ['IBM Planning Analytics'], metric: { value: '1,000+', label: 'users in one planning model' } },
      { client: 'European logistics group', kind: 'anon', decision: 'What does one truck cost per kilometre if fuel rises 5% and a new road tax comes in?', result: 'A model with every cost driver, from depreciation to country-specific wages. Scenarios are combined into versions and compared side by side.', tags: ['IBM Planning Analytics'] },
    ],
    faq: [
      { q: 'Which planning tool should we choose?', a: 'It depends on scale, your current BI stack and how often the model needs to change. We work with Anaplan, IBM Planning Analytics and Aimplan, so we can compare them on your case.' },
      { q: 'Can planning work inside Power BI?', a: 'Yes. Aimplan adds planning and write-back inside Power BI, which suits organisations that already report there.' },
      { q: 'Is EPM only for finance?', a: 'No. The same model can plan capacity, staff and fleet. Connecting those plans to the budget is where most of the value is.' },
    ],
    expert: 'Glenn De Weerdt',
    cta: { title: 'Which plan takes <span>too long to make?</span>', text: 'Show us the current cycle. In a 30-minute call we point out what a connected model would change.', button },
    review: [
      'EPM placement is parked. This storyline follows the vault candidate answer: planning as the operational decision layer. Confirm before it goes live.',
      'No published EPM case on the rebuilt site. Both proof cards are anonymised (logistics group, pharma group) and need sign-off, or a published Anaplan case.',
      'The logistics card and the fleet scenario table follow the H.Essers Planning Analytics case (vault: published on the old site). Either name and link it once republished, or keep it generic.',
      'Three platforms (Anaplan, Planning Analytics, Aimplan) have no settled positioning between them; the page presents them as a choice per case.',
    ],
  },
  {
    slug: 'datavisualisation-reporting', page: 'Data Visualization & Reporting', group: 'foundation', layer: 'Reports and dashboards',
    shape: 'outcome', eyebrow: 'Reporting · Power BI', depends: ['dataintegration-engineering', 'data-governance'],
    seo: { title: 'Power BI reporting on one version of the numbers | Acumen', description: 'Power BI reports on one governed dataset: role-based views, automated refresh and self-service that stays tidy. The reporting layer of your data foundation.' },
    lead: 'One version of the numbers, at the level each person decides on.',
    intro: 'Reports are where people meet the data foundation. We build them in Power BI on one governed dataset, so the executive view and the team view add up, and nobody exports to Excel to check.',
    symptoms: {
      title: 'Sound familiar?',
      items: [
        { t: 'Three reports, three answers', d: 'Each team built its own report on its own copy of the data, and none of them match.' },
        { t: 'Monthly exports to Excel', d: 'Someone spends days preparing numbers before anyone can look at them.' },
        { t: 'Dashboards nobody opens', d: 'Built to show everything, so they answer no one’s question in particular.' },
      ],
    },
    why: { title: 'Reporting is where you find out whether the foundation holds.', text: 'Dashboards answer the questions you knew to ask. With definitions in place, the same dataset also answers new questions, in a report or in a chat with your data. Reports that add up are the first sign your data is ready for AI.' },
    signature: {
      kind: 'rows', title: 'Same dataset, three views',
      intro: 'Each role sees the numbers it decides on. All three views come from one model, so they add up.',
      head: ['Who', 'Decides', 'Sees'],
      rows: [
        { k: 'Executive', v: 'Where to invest and what to correct', w: 'A few KPIs against target, and the trend' },
        { k: 'Manager', v: 'Where the team puts its effort this week', w: 'Team performance, with outliers flagged' },
        { k: 'Team', v: 'Which order, customer or line to fix', w: 'The detail behind every number' },
      ],
    },
    build: {
      title: 'What we build',
      intro: 'A reporting layer people trust and keep using:',
      items: [
        { t: 'Shared datasets', d: 'One model per domain, every KPI defined once and reused by every report.' },
        { t: 'Views by role', d: 'An overview for the executive, team performance for the manager, the detail for the team that fixes things.' },
        { t: 'Automated refresh', d: 'Data from your ERP and other sources refreshed on schedule, instead of exported by hand.' },
        { t: 'Self-service that stays tidy', d: 'A clear workspace structure and certified datasets, so new reports build on the shared model instead of copying it.' },
      ],
    },
    stack: ['Power BI', 'Microsoft Fabric', 'SAP Datasphere', 'Azure Data Factory'],
    steps: [
      { t: 'Start from the decisions', d: 'Which decisions each role makes, and which numbers they need for them.' },
      { t: 'Build the model once', d: 'Definitions and calculations in the shared dataset, not in each report.' },
      { t: 'Hand over the pen', d: 'Your team builds new reports on the model, with guidelines that keep it consistent.' },
    ],
    proof: [
      { client: 'Spaas Candles', kind: 'case', href: '/knowledge/enhanced-sales-insights-leveraging-power-bi-reporting/', decision: 'Which customers and products drive turnover and margin?', result: 'Interactive Power BI reports on SAP data show which customers and products drive turnover and margin.', tags: ['Power BI', 'SAP'], metric: { value: 'Daily', label: 'refresh, where it used to be a monthly manual export to Excel' } },
      { client: 'Kaneka', kind: 'case', href: '/knowledge/kaneka-powerbi-sap-datasphere/', decision: 'How to act on current data instead of delayed manual reports?', result: 'Decision-makers see the latest financial and operational data, and teams build their own reports.', tags: ['SAP Datasphere', 'Power BI'] },
      { client: 'Membership organisation', kind: 'anon', decision: 'How to report to four management levels without four versions of the truth?', result: 'One master dataset, with reports per stakeholder group and access by role.', tags: ['Power BI'], metric: { value: '65+', label: 'KPIs on one master dataset' } },
    ],
    faq: [
      { q: 'Do you only work with Power BI?', a: 'Yes, by choice. Depth in one platform gives you better models and faster answers than broad knowledge of five.' },
      { q: 'Can you clean up the reports we already have?', a: 'Yes. We map what exists, keep what is used, and move the shared logic into one dataset so reports stop drifting apart.' },
      { q: 'What about Copilot in Power BI?', a: 'It works well on a model with clear names and definitions. That is the same work that makes your reports consistent, so you get both.' },
    ],
    expert: 'Jannis Ramaekers',
    cta: { title: 'Which number do people <span>argue about?</span>', text: 'Tell us which report starts the discussion. In a 30-minute call we show how to make it one number again.', button },
    review: [
      'Old page opened with a definition (“the visual representation of data using visual elements”). The new page opens with the outcome and frames reporting as part of the foundation.',
      'The membership-organisation card is anonymised and unpublished; get sign-off.',
      'Expert: the live page names Jannis Ramaekers as author and Bram as contact. Confirm.',
    ],
  },
  {
    slug: 'dataintegration-engineering', page: 'Data Integration & Engineering', group: 'foundation', layer: 'One platform for all your data',
    shape: 'outcome', eyebrow: 'Data Engineering · the platform underneath', depends: [],
    seo: { title: 'Data engineering on dbt, Databricks, Fabric and Dagster | Acumen', description: 'One data platform where definitions, tests, ownership and lineage live in the code. Built on dbt, Databricks or Microsoft Fabric, and Dagster.' },
    lead: 'One platform where every number carries its meaning.',
    intro: 'We build data platforms on dbt, Databricks or Microsoft Fabric, and Dagster. Definitions, tests, ownership and lineage live in the code next to the data. Every answer, in a report or from AI, can be traced back to its source.',
    symptoms: {
      title: 'Sound familiar?',
      items: [
        { t: 'Data in ten systems, joined by hand', d: 'ERP, CRM, files and sensors each tell part of the story. Combining them is someone’s monthly job.' },
        { t: 'Pipelines that fail quietly', d: 'A load breaks overnight and you find out from a wrong number in the morning meeting.' },
        { t: 'A platform only its builder understands', d: 'Logic hidden in scripts and schedulers, with no record of what depends on what.' },
      ],
    },
    why: { title: 'AI is only as good as what it knows about your data.', text: 'A model or chat assistant reads your tables, not your intentions. When “revenue” means three things, it picks one and answers with confidence. A platform that carries definitions and tests with the data gives you AI answers you can check.' },
    signature: {
      kind: 'flow', title: 'The path of one number',
      intro: 'Take revenue. This is how it travels from the source to the person asking, with a check at every step.',
      steps: [
        { t: 'Source system', d: 'An order is booked in the ERP.' },
        { t: 'Ingestion', d: 'The order lands in the platform, with its raw history kept.' },
        { t: 'dbt model with a test', d: 'Revenue is calculated once, by the agreed definition, and tested.' },
        { t: 'Dagster asset check', d: 'Freshness and quality are checked before anything downstream refreshes.' },
        { t: 'Report or AI answer', d: 'The same number in the dashboard and the chat assistant, traceable back to the order.' },
      ],
    },
    build: {
      title: 'What we build',
      intro: 'A standard stack, so every platform we build is familiar to the next engineer:',
      items: [
        { t: 'Ingestion', d: 'From ERP, CRM, SAP, files and IoT sensors into one platform, with raw history kept so logic can be re-run.' },
        { t: 'Transformation in dbt', d: 'Models with contracts, tests and documentation, reviewed and deployed like any other code.' },
        { t: 'Orchestration in Dagster', d: 'Every table knows what it depends on, when it was refreshed and whether its checks passed.' },
        { t: 'A platform on Databricks or Fabric', d: 'Storage and compute sized to your data, on the platform that fits your landscape.' },
      ],
    },
    stack: ['dbt', 'Databricks', 'Microsoft Fabric', 'Dagster', 'SAP Datasphere', 'Azure', 'Delta Lake', 'Apache Iceberg'],
    steps: [
      { t: 'Map sources and decisions', d: 'Which data feeds which decision, and where it lives today.' },
      { t: 'Build in slices', d: 'One domain end to end, from source to report, before the next one. Value early, no big bang.' },
      { t: 'Make it yours', d: 'Documentation and lineage are generated from the code, so your team can read, extend and run it.' },
    ],
    proof: [
      { client: 'Bionerga', kind: 'case', href: '/knowledge/bionerga-future-ready-data-platform/', decision: 'How to rebuild entangled reporting while migrating the ERP?', result: 'Validated Power BI datasets feed reliable reports across Bionerga, with a clear view of every data flow.', tags: ['Microsoft Fabric', 'Dagster'] },
      { client: 'Kaneka', kind: 'case', href: '/knowledge/kaneka-powerbi-sap-datasphere/', decision: 'How to combine SAP data and reporting without manual exports?', result: 'SAP Datasphere feeds Power BI directly, with row-level security and incremental refresh.', tags: ['SAP Datasphere', 'Power BI'] },
      { client: 'Metadata-driven blueprint', kind: 'article', href: '/knowledge/jump-start-your-data-lake-with-our-meta-data-driven-blueprint/', decision: 'How to add a new source without writing a new pipeline?', result: 'A metadata-driven framework that ingests new sources by configuration, for faster onboarding and lower cost.', tags: ['Cloud data lake'] },
    ],
    faq: [
      { q: 'Databricks or Microsoft Fabric?', a: 'Both work well. The choice depends on your Microsoft footprint, the volume and type of data, and how much machine learning follows. We help you decide on those criteria.' },
      { q: 'Why Dagster rather than Airflow?', a: 'Airflow schedules tasks; Dagster manages data assets. Every table knows its dependencies, freshness and checks, which is the lineage AI and auditors need. As an official Dagster implementation partner, we also migrate existing Airflow setups.' },
      { q: 'Can you work with our SAP data?', a: 'Yes. SAP Datasphere connects SAP to the rest of the platform without manual extracts, as at Kaneka.' },
    ],
    expert: 'Tjomme Vergauwen',
    cta: { title: 'Where does your data <span>lose its meaning?</span>', text: 'Show us one number nobody fully trusts. In a 30-minute call we trace where it breaks and what would fix it.', button },
    review: [
      'Old page spent most of its length on textbook definitions of engineering vs. integration. The new page leads with the outcome and names the standard stack in the intro and SEO title (SEO: “dbt”, “Databricks”, “Fabric” were missing from the site).',
      'No dedicated dbt case exists. The page claims dbt as the standard stack, not as a certified partnership.',
      'The Databricks-or-Fabric decision rule is not confirmed internally; the FAQ gives criteria, not a rule.',
      'The metadata-driven blueprint is published as type “case” but names no client; kind is set to “case”. Relabel it “article” if the card should not read as a customer case.',
    ],
  },
  {
    slug: 'data-governance', page: 'Data Governance', group: 'foundation', layer: 'Definitions, quality and ownership',
    shape: 'outcome', eyebrow: 'Data Governance · definitions and quality', depends: ['dataintegration-engineering'],
    seo: { title: 'Data governance as code: definitions you can trust | Acumen', description: 'Definitions, quality tests, ownership and lineage built into the data platform itself, so governance deploys with the data and makes AI answers checkable.' },
    lead: 'Agree once what each number means, and keep it true in the code.',
    intro: 'Governance usually arrives as a policy document and a catalogue that falls behind reality. We put definitions, tests, ownership and lineage in the data pipeline itself, so they deploy with the data and stay current.',
    symptoms: {
      title: 'Sound familiar?',
      items: [
        { t: '“What counts as an active customer?”', d: 'Every department has its own answer, and every report reflects a different one.' },
        { t: 'Quality problems found in the board meeting', d: 'A wrong figure is spotted by the person presenting it, not by a check upstream.' },
        { t: 'A catalogue nobody updates', d: 'It was complete on launch day. Since then, the platform has changed and the catalogue hasn’t.' },
      ],
    },
    why: { title: 'Governance is what makes AI answers checkable.', text: 'When a chat assistant answers “what was our margin last quarter”, it needs the agreed definition, an owner and a passing test. Governance in the code supplies exactly that. It also tells the system when data is stale or broken, so it can flag the problem instead of guessing.' },
    signature: {
      kind: 'rows', title: 'The metrics people argue about',
      intro: 'Typical examples. Each answer is reasonable on its own; the problem is that both end up in reports.',
      head: ['Metric', 'Sales says', 'Finance says'],
      rows: [
        { k: 'Active customer', v: 'Placed an order in the last 12 months', w: 'Invoiced this financial year' },
        { k: 'Revenue', v: 'Order value when the deal is signed', w: 'Invoiced, minus credit notes' },
        { k: 'Margin', v: 'Price minus list cost', w: 'After discounts, freight and rebates' },
        { k: 'On-time delivery', v: 'Shipped on the promised day', w: 'Delivered complete on the agreed date' },
      ],
    },
    build: {
      title: 'What we build',
      intro: 'Four things, all living in the platform rather than beside it:',
      items: [
        { t: 'Shared definitions', d: 'Metrics and business terms defined once in the transformation layer, documented and searchable.' },
        { t: 'Quality tests', d: 'Checks at every step. A failing test stops bad data before it reaches a report.' },
        { t: 'Ownership', d: 'A named owner for each dataset and metric, visible to everyone who uses it.' },
        { t: 'Lineage', d: 'The path from source system to report, generated from the code, so it is always up to date.' },
      ],
      scope: 'This governs the data that feeds your decisions: everything that passes through your data platform. If you need an enterprise-wide stewardship programme, we’ll tell you.',
    },
    stack: ['dbt', 'Dagster', 'Unity Catalog', 'Microsoft Fabric'],
    steps: [
      { t: 'Start with the metrics people argue about', d: 'The five to ten definitions that cause the most discussion, agreed with the business.' },
      { t: 'Put them in the code', d: 'With tests and an owner, reviewed like any other change.' },
      { t: 'Make them visible', d: 'Definitions, owners and lineage published where business users can look them up.' },
    ],
    proof: [
      { client: 'Bionerga', kind: 'case', href: '/knowledge/bionerga-future-ready-data-platform/', decision: 'How to keep a multi-site data platform understandable as facilities are added?', result: 'A built-in data catalogue with end-to-end lineage, ownership and master data definitions.', tags: ['Microsoft Fabric', 'Dagster'], change: { before: 'Entangled reporting, no view of how data flowed', after: 'Every flow visible in Dagster, definitions and owners in the catalogue' } },
      { client: 'Organisation on Databricks', kind: 'anon', decision: 'How to let business users ask questions of their data in plain language?', result: 'Definitions and business rules in Unity Catalog first, then chat with data per domain. The foundation mattered more than the AI layer.', tags: ['Databricks', 'Unity Catalog'] },
    ],
    faq: [
      { q: 'Do we need a governance tool like Collibra?', a: 'Not to start. Definitions, tests and lineage in the platform cover the data that drives your decisions. Large regulated organisations with a stewardship programme can need a dedicated tool; we’ll tell you if that is your situation.' },
      { q: 'Who owns a definition: IT or the business?', a: 'The business decides what a number means. The code makes sure that meaning is applied the same way everywhere.' },
      { q: 'How do we start without a big programme?', a: 'With the few metrics people argue about most. Fixing those builds the habit, and the trust, for the rest.' },
    ],
    expert: 'Bernd Bils',
    cta: { title: 'Which definition causes <span>the most discussion?</span>', text: 'Name it. In a 30-minute call we show how to agree on it once and keep it that way.', button },
    review: [
      'Old intro opened with “Let’s be honest” and stayed abstract. The new page uses the governance-as-code argument from the vault, scoped honestly to the platform (vault: “bound the claim”).',
      'Terraform is roadmap only and is left out on purpose.',
      'The Databricks/Genie card is anonymised and unpublished; get sign-off. Its context layer is Unity Catalog, not dbt.',
      'The signature table (Sales vs Finance definitions) is a generic illustration, not client data.',
    ],
  },
  {
    slug: 'support-maintenance', page: 'Support & Maintenance', group: 'foundation', layer: 'Kept reliable as your business changes',
    shape: 'service', eyebrow: 'Support & Maintenance · once you are live', depends: ['dataintegration-engineering', 'data-governance', 'datavisualisation-reporting'],
    seo: { title: 'Support & Maintenance for data platforms and models | Acumen', description: 'Monitoring, incident handling and change for data platforms, reports and AI models, so they stay reliable as sources, definitions and questions change.' },
    lead: 'Your data keeps changing after launch. We keep it reliable.',
    intro: 'Sources change, definitions move, new questions come in. We keep data platforms, reports and models reliable through those changes, with specialists who know how they were built.',
    symptoms: {
      title: 'Sound familiar?',
      items: [
        { t: 'The builder left, and the knowledge went too', d: 'Nobody is sure what a change will break, so nothing changes.' },
        { t: 'Loads fail at night, users find out in the morning', d: 'Problems surface in a report instead of an alert.' },
        { t: 'Every change request becomes a project', d: 'A new KPI takes a quote, a planning round and three months.' },
      ],
    },
    why: { title: 'An unmaintained model gets worse, quietly.', text: 'Reports degrade slowly; AI models degrade fast. Customer behaviour shifts, a source adds a field, and predictions drift. Monitoring freshness, quality and model performance keeps automated decisions safe to automate.' },
    signature: {
      kind: 'flow', title: 'When a source system changes',
      intro: 'An ERP update renames a field. This is what happens next.',
      steps: [
        { t: 'Change detected', d: 'The load picks up the new structure from the source.' },
        { t: 'A test fails and raises an alert', d: 'The check on that table fails before the report refreshes, so users don’t see a wrong number.' },
        { t: 'The owner is told', d: 'Lineage shows which datasets and reports are affected, and who owns them.' },
        { t: 'Fixed at the root cause', d: 'The model is adjusted to the new source, not patched further downstream.' },
        { t: 'Documented', d: 'The change and the fix are recorded with the code, for the next person.' },
      ],
    },
    build: {
      title: 'What support covers',
      intro: 'We agree the scope with you. It typically includes:',
      items: [
        { t: 'Monitoring', d: 'Freshness, failed loads, quality tests and model drift, flagged before users notice.' },
        { t: 'Incident handling', d: 'Failed loads and data inconsistencies fixed at the root cause, not just re-run.' },
        { t: 'Change', d: 'New KPIs, source changes and new reports, handled as routine instead of a new project.' },
        { t: 'Optimisation', d: 'Cost, performance and usage reviewed, unused reports and pipelines cleaned up.' },
      ],
    },
    steps: [
      { t: 'Agree the scope', d: 'What we watch, what we change, and what your own team handles.' },
      { t: 'Take over cleanly', d: 'Documentation, access and a walkthrough of how the platform works today.' },
      { t: 'Review together', d: 'Regular reviews of incidents, usage and cost, and what to improve next.' },
    ],
    proof: [
      { client: 'Automotive group', kind: 'anon', decision: 'How to keep the old platform running while two transformation projects replace it?', result: 'We ran support and change on the legacy platform during the migration. The new platform started exactly where the old one stopped.' },
      { client: 'Reliable data support', kind: 'article', href: '/knowledge/continuous-data-support/', decision: 'What does support look like after implementation?', result: 'Monitoring, incident management, user support and change: what continuous support covers once a data environment is live.' },
    ],
    faq: [
      { q: 'Is support a fixed package?', a: 'No. Every platform and user group is different, so we agree the scope together.' },
      { q: 'Do you also maintain AI models?', a: 'Yes. We monitor model performance and data drift, and retrain when the business changes.' },
      { q: 'Can support include user questions?', a: 'Yes. Onboarding new users, training and ad-hoc questions can be part of the scope.' },
    ],
    cta: { title: 'What breaks <span>when nobody is watching?</span>', text: 'Tell us how your platform runs today. In a 30-minute call we sketch what support would cover.', button },
    review: [
      'BLOCKER: the vault says nothing about support should be quoted until a delivery model replaces the closed Romania team. Confirm the model before this page (or the live one) is promoted.',
      'The live page names Wouter Mertens, an external freelancer who is no longer engaged. Remove his name from the live page regardless of this concept.',
      'Option: fold support into each page as an “after go-live” section instead of a standalone page, which fits the embedded model better.',
      'The signature flow describes the monitoring set-up in principle (tests, alerts, lineage); it promises no response times.',
    ],
  },
];
