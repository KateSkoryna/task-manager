# Statistics Page Redesign — Product Guidelines

I want to redesign the Statistics page of my task manager.

Important: this task is only about the **Statistics page**.

Do not mix it with the future AI Report / AI Recommendations feature. The Statistics page should present clear, objective data and trends. AI-generated interpretation and coaching will be implemented separately later.

## Main goal

The Statistics page should help a user answer practical questions about their productivity and planning.

Right now, the page shows numbers and charts, but many of them do not provide enough context to understand whether the user is actually planning well, completing what they planned, balancing different areas of life, or consistently leaving tasks unfinished.

The redesigned page should help answer questions such as:

- What kinds of tasks am I spending most of my attention on?
- Am I neglecting some categories?
- Am I planning a realistic number of tasks per day?
- Are some days heavily overloaded while others are almost empty?
- How much of what I plan do I actually complete?
- How many tasks remain unfinished?
- How old are my unfinished tasks?
- Which kinds of tasks do I tend to leave unfinished?
- Am I using priorities meaningfully?
- Do I mark too many tasks as High priority?
- Do I actually complete my High-priority tasks?
- How consistent am I from day to day or week to week?
- How long does it usually take me to finish tasks?

The page should support **Week / Month / Year** periods where the metric makes sense.

---

# 1. Summary metrics

At the top of the page, show a small number of useful KPI cards.

Possible metrics:

### Completion Rate

Percentage of planned tasks that were completed during the selected period.

Example:
`68% completed`
`13 of 19 tasks`

If historical data exists, also show change compared with the previous equivalent period:

`+8% vs previous week`

### Completed Tasks

Number of completed tasks compared with all tasks planned for the period.

Example:
`13 / 19 completed`

### Unfinished / Overdue Tasks

Tasks whose planned date has passed but which are still not completed.

Example:
`6 unfinished`
`2 older than 7 days`

### Planning Load

Average number of tasks planned per active day.

Example:
`7.4 tasks/day`

Also consider showing the highest-load day if useful.

The KPI section should avoid vanity metrics such as total number of tasks ever created or number of days tracked unless they provide useful context.

---

# 2. Planned vs Completed by Day

This should be one of the main charts.

For every day in the selected period, compare:

- tasks planned
- tasks completed
- optionally unfinished tasks

Purpose:

Help the user understand whether they consistently plan more work than they actually complete.

Example:

Monday:

- Planned: 12
- Completed: 7

Tuesday:

- Planned: 5
- Completed: 5

Wednesday:

- Planned: 16
- Completed: 4

This should make overloaded or unrealistic planning immediately visible.

For Month or Year views, consider grouping appropriately if daily granularity becomes too noisy.

---

# 3. Workload Distribution

Show how many tasks were planned for each day.

Purpose:

Help identify uneven planning.

For example, the user might plan:

- Monday: 15 tasks
- Tuesday: 2
- Wednesday: 18
- Thursday: 4

The page should make it obvious that workload is distributed unevenly.

Useful supporting metrics could include:

- average tasks per day
- busiest day
- lightest day
- deviation from the user's normal workload

Do not decide arbitrary universal limits such as "10 tasks is too many". The statistic should primarily describe the user's own planning pattern.

---

# 4. Category Distribution

This section is important because I want to understand **where my attention goes**.

Show task distribution by category, for example:

- Work
- Education
- Family
- Home
- Personal
- Other

Ideally distinguish between:

### Planned by Category

How much of the user's planned workload belongs to each category.

Example:

Work — 48%
Education — 24%
Family — 8%
Home — 20%

### Completed by Category

How much of the completed work belongs to each category.

This allows the user to notice patterns such as:

"I plan family tasks, but rarely complete them."

or:

"Most of my attention is going to work."

Absolute numbers should also be available, not only percentages.

Example:

`Work: 12 / 15 completed`

Consider whether one combined chart or two related visualizations would communicate this best.

---

# 5. Completion Rate by Category

Show how successfully the user completes tasks in each category.

Example:

Work — 82%
Education — 54%
Family — 33%
Home — 71%

Purpose:

The Category Distribution answers:

> Where does my attention go?

This metric answers:

> Which areas do I actually follow through on?

These are different questions and should not be confused.

---

# 6. Priority Distribution

Show how the user assigns priorities.

For example:

- High: 12
- Medium: 5
- Low: 3

Also show percentages.

Example:

`60% of tasks were marked High priority.`

Purpose:

Priority labels lose meaning if almost everything is High priority.

The statistics should make this visible without yet providing AI coaching.

Possible views:

- priority distribution for the whole period
- priority distribution by day
- trend in High-priority percentage

---

# 7. High-Priority Completion

Priority statistics should not only show how tasks are labelled.

Also measure whether High-priority tasks are actually completed.

Example:

High priority:
`7 / 12 completed — 58%`

Medium:
`4 / 5 completed — 80%`

Low:
`2 / 3 completed — 67%`

This can reveal situations where the user labels many tasks as important but still does not finish them.

---

# 8. Unfinished Task Aging

I do not want unfinished tasks to automatically receive a new planned date.

If a task was planned for Monday and was not completed, its original planned date should remain Monday.

This is important because changing the date would distort historical statistics.

However, unfinished tasks can still appear in the current UI as overdue or unfinished from previous days.

Statistics should track how long unfinished tasks have been sitting.

Possible buckets:

- 1 day old
- 2–3 days
- 4–7 days
- more than 7 days

Useful metrics:

- number of unfinished tasks
- average age
- oldest unfinished task
- number of stale tasks

Also consider showing which categories contain the oldest unfinished tasks.

Purpose:

Help the user identify tasks they repeatedly avoid or never finish.

---

# 9. Task Completion Time

I want to understand how long tasks take.

First inspect the existing data model and determine what can actually be measured.

There are two different concepts:

### Active Duration

How much time the user actively spent working on the task.

This is only possible if the application has reliable start / pause / stop timestamps or another tracking mechanism.

### Time to Completion

Time between task creation/planned date and completion.

Example:

Task created Monday → completed Thursday = 3 days to completion.

Possible metrics:

- median time to completion
- average time to completion
- completion time by category
- completion time by priority

Prefer median when extreme outliers could make averages misleading.

Do not fabricate active task duration if the application does not currently track enough data.

---

# 10. Consistency

Show how consistent the user is across time.

Possible metrics:

- daily completion rate
- weekly completion rate
- number of days where planned work was mostly completed
- completion-rate trend

The goal is not to create a gamified streak for its own sake.

The purpose is to answer:

> Is my productivity relatively stable, or do I alternate between highly productive and very unproductive periods?

A trend chart may be more useful than a single "consistency score".

---

# 11. Period Comparison

Whenever there is sufficient historical data, important metrics should include context.

Examples:

`Completion rate: 68%`
`+9 percentage points vs previous week`

`Average daily workload: 8.2 tasks`
`Previous week: 6.1`

`High-priority tasks: 54%`
`Previous week: 31%`

Numbers without comparison often have little meaning.

Comparison should work as:

- Week → previous week
- Month → previous month
- Year → previous year

Only show comparisons when enough data exists.

---

# Suggested Page Structure

A possible structure is:

## Row 1 — Overview

Four compact KPI cards:

- Completion Rate
- Completed / Planned
- Unfinished / Overdue
- Average Daily Workload

## Row 2 — Planning vs Reality

Large chart:
**Planned vs Completed over time**

Secondary visualization:
**Workload Distribution**

## Row 3 — Life / Work Balance

- Category Distribution
- Completion Rate by Category

## Row 4 — Priority Behavior

- Priority Distribution
- Completion Rate by Priority

## Row 5 — Unfinished Work

- Unfinished Task Aging
- Oldest / Stale Tasks summary

## Row 6 — Trends

- Completion trend / consistency
- comparison with previous period

Task duration / time-to-completion can be included here or in its own section depending on available data.

---

# UX Principles

The redesign should follow these principles:

1. Every chart should answer a specific user question.
2. Avoid showing the same information in several different forms.
3. Prefer metrics that provide context rather than raw totals.
4. Absolute numbers and percentages should complement each other.
5. Historical comparison is valuable where enough data exists.
6. Do not create opaque "Productivity Scores" unless the calculation has a clear and defensible meaning.
7. Avoid calling unfinished tasks "Failed".
8. Prefer terms such as:
   - Completed
   - Pending
   - Unfinished
   - Overdue
   - Stale
9. Do not automatically change the original planned date of unfinished tasks for statistical purposes.
10. Week / Month / Year views may require different aggregation levels rather than simply displaying the exact same chart with more data.

---

# Before Implementation

Do not immediately rewrite the page.

First:

1. Inspect the current Statistics page implementation.
2. Inspect the task data model and available timestamps/status fields.
3. Identify which proposed metrics can already be calculated reliably.
4. Identify which metrics require new data to be stored.
5. Check whether historical task state is preserved well enough for these calculations.
6. Identify any ambiguous definitions, especially:
   - what counts as "planned"
   - what counts as "overdue"
   - how recurring tasks behave
   - how deleted tasks affect statistics
   - whether completion should be attributed to the planned date or the actual completion date
7. Propose the final dashboard structure.
8. Explain any required database/schema changes.
9. Discuss trade-offs with me before implementing major structural changes.

The goal is not to maximize the number of charts.

The goal is to create a Statistics page where the user can quickly understand:

**What am I planning?  
What am I actually doing?  
Where does my attention go?  
What do I keep leaving unfinished?  
How realistic is my planning?  
How consistent am I over time?**
