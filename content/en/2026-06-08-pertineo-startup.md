---
thumbnail: /assets/img/posts/pertineo-startup.webp
thumbnail_alt: Pertineo AWS system architecture
title: "Pertineo: A 3D AI Talent Evaluation Platform"
date: 2026-06-08
categories:
  - Startup
tags:
  - Pertineo
  - AI
  - LLM
  - Startup
  - HR Tech
  - LangGraph
  - EXAONE
description: Pertineo evaluates talent in 3 dimensions — learning ability, job
  fit, and execution capability — using AI. Selected as one of Korea's AI Rookie
  Top 100, now expanding to the US.
source_sha256: a23476d7381b09b857b11f0bd176cc50c74a8cfb873f1231b65997faab8f2566
---

<img src="https://capsule-render.vercel.app/api?type=waving&color=BDBDC8&height=150&section=header&text=Pertineo" alt="Pertineo" />

## What is Pertineo?

**Pertineo** is an AI-powered talent evaluation platform that analyzes a candidate's resume, cover letter, portfolio, and even video data using natural-language models, and then assesses each person across **three dimensions**:

- **X-axis — Learning Ability:** growth mindset, speed of acquiring new skills, learning history
- **Y-axis — Job Fit:** how well an individual's competencies match the requirements of a specific role
- **Z-axis — Execution Capability:** real performance (KPIs), project completion, problem-solving, leadership

Most hiring tools stop at a **2D evaluation** (knowledge *or* skills). Pertineo goes further with a **3D evaluation model** that captures growth potential, role-specific competency, and demonstrated performance together — giving a far more dimensional view of a person.

> AI-driven quantitative analysis + up-to-date hiring trends + personalized feedback = a differentiated talent-growth solution. 🚀

- **Live service:** [pertineo.khu.ac.kr](https://pertineo.khu.ac.kr/)
- **GitHub organization:** [github.com/khu-return-19](https://github.com/khu-return-19)

---

## 🏆 Recognition & Traction

- **AI Rookie Top 100** — Selected by the **Ministry of Science and ICT of the Republic of Korea** as one of the nation's top 100 emerging AI ventures.
- **Technical partnership with LG AI Research and Upstage** — Pertineo receives technical support from **LG AI Research** and **Upstage**, collaborating with them to leverage the **EXAONE** model family at the core of its analysis pipeline.
- **1,200+ cumulative users** and growing.
- **US expansion in progress** — actively building toward launching the service in the United States to bring 3D talent evaluation to a global market.

---

## ☁️ System Workflow

The full production workflow runs on **AWS**: Route 53 + CloudFront (with WAF) serve the frontend from S3 (via OAC), while the backend and AI servers run as **ECS tasks in a private subnet** behind an ALB, with auto-scaling, a NAT instance for egress, and VPC endpoints to DynamoDB and CloudWatch. CI/CD ships through **GitHub Actions → ECR → ECS**.

![Pertineo AWS System Architecture](https://github.com/user-attachments/assets/c32cce5e-f721-407b-8432-e3ded2cca6c1)

---

## 🧠 How It Works — AI Node Architecture

Pertineo runs on a **LangGraph sequential pipeline** with **Evaluator quality gates** after every node. The core reasoning is powered by **LG AI Research's EXAONE** models (Korean AI track, EXAONE 100%).

<iframe src="/assets/html/pertineo-ai-node-architecture.html"
        title="Pertineo AI Node Architecture"
        style="width:100%;height:1180px;border:1px solid var(--main-border-color, #e3e3e3);border-radius:12px;background:#fff;margin:1.5rem 0;"
        loading="lazy"></iframe>

```
INPUT (Resume + Q&A)
   → Schemer → Planner → Tool Node → Analyzer →
OUTPUT (3D Report + Scores + Improvement Plan + Pass Probability)
```

| Node | Role | Model / Tech |
|---|---|---|
| **🔍 Schemer** | Validates the resume and extracts structured data (role, company, period, title) | EXAONE 3.5 → `current_criteria` |
| **🗺️ Planner** | Generates 2–3 prioritized web-search queries and a strategy | EXAONE 3.5 → `action_plan` |
| **⚙️ Tool Node** | Collects external info **in parallel** — Tavily web search (ReAct) for company/trend data + ElasticSearch agent for acceptance statistics | `asyncio.gather()` → `tool_results` |
| **✨ Analyzer** | Generates the streaming 3D report — X (learning) · Y (job fit) · Z (execution) | EXAONE Deep → `analysis_report` |

An **Evaluator** runs after each node (field completeness, query format, search-result presence, score extraction, pass-probability range). If a node's output falls below quality thresholds, the graph **automatically retries** that node. The entire flow is orchestrated as a LangGraph `StateGraph`.

---

## ✨ Key Features

- **Automated AI Analysis** — NLP, deep learning, and computer vision quantify resumes, portfolios (code, design), and video into measurable scores, visualized as **3D graphs and dashboards**.
- **Future-Job Trend Awareness** — Evaluation criteria auto-update from sources like the **WEF Future of Jobs** reports and LinkedIn hiring trends.
- **Personalized Feedback & Action Plans**
  - Weak X (learning): recommended courses & platforms (Coursera, edX)
  - Weak Y (job fit): tailored projects & mentoring programs
  - Weak Z (execution): Kaggle, hackathons, real-world project opportunities
- **Re-Evaluation Loop** — Re-assessment every 3–6 months to track competency growth and set the next target.

---

## 📌 Use Cases

- **Corporate Hiring** — Efficiently evaluate hundreds to thousands of applicants and surface the best-fit talent.
- **Jobseeker Consulting** — Score a candidate's materials on X/Y/Z and deliver concrete, personalized improvement plans.
- **Organizational Talent Management** — Periodically evaluate employees to optimize team placement and development.

---

## 📊 The Theory Behind 3D Evaluation

Pertineo's 3D model is grounded in established research:

- **Kolb (1984)** — Experiential Learning Theory: how experience and reflective thinking drive competency growth.
- **Dweck (2006)** — Growth Mindset: learning attitude and growth potential as core success factors.
- **Holland / Boyatzis** — Frameworks for job fit, leadership, and performance evaluation.

Evaluation is **multi-modal**: cover-letter text, portfolio artifacts, and video are analyzed with NLP, text mining, and computer vision, then compared against role-specific competency benchmarks and historical accepted-candidate averages for relative scoring.

---

## 📌 Conclusion

Pertineo overcomes the limits of conventional evaluation with a **3D competency-analysis solution** that serves hiring, job preparation, and in-house talent management alike. Recognized as one of Korea's **AI Rookie Top 100**, with **1,200+ users** and a **US launch underway**, Pertineo is building the next standard for how talent is understood and grown.
