# Software Engineering and Development

## A Comprehensive Educational Guideline

> This guide consolidates and restructures the supplied learning transcripts into a single educational reference. It is designed for learners beginning software engineering, web development, cloud development, or related technical roles.

---

## Table of Contents

1. [How to Use This Guide](#1-how-to-use-this-guide)
2. [Foundations of Software Engineering](#2-foundations-of-software-engineering)
3. [The Software Development Life Cycle](#3-the-software-development-life-cycle)
4. [The Six Phases of the SDLC](#4-the-six-phases-of-the-sdlc)
5. [Requirements Engineering](#5-requirements-engineering)
6. [Software Design and Architecture](#6-software-design-and-architecture)
7. [Development Methodologies](#7-development-methodologies)
8. [Building High-Quality Software](#8-building-high-quality-software)
9. [Software Testing](#9-software-testing)
10. [Releases and Software Versioning](#10-releases-and-software-versioning)
11. [Software Documentation](#11-software-documentation)
12. [Roles in Software Engineering Projects](#12-roles-in-software-engineering-projects)
13. [Web and Cloud Development Fundamentals](#13-web-and-cloud-development-fundamentals)
14. [Front-End Development](#14-front-end-development)
15. [Back-End Development](#15-back-end-development)
16. [Full-Stack Development and Team Integration](#16-full-stack-development-and-team-integration)
17. [Development Tools and Environments](#17-development-tools-and-environments)
18. [Version Control, Libraries, and Frameworks](#18-version-control-libraries-and-frameworks)
19. [CI/CD, Build Tools, Packages, and Package Managers](#19-cicd-build-tools-packages-and-package-managers)
20. [Software and Technology Stacks](#20-software-and-technology-stacks)
21. [Programming Languages and Execution Models](#21-programming-languages-and-execution-models)
22. [Programming Fundamentals](#22-programming-fundamentals)
23. [Algorithms, Flowcharts, and Pseudocode](#23-algorithms-flowcharts-and-pseudocode)
24. [Pair Programming](#24-pair-programming)
25. [Functions, Objects, and Modular Programming](#25-functions-objects-and-modular-programming)
26. [Software Architecture](#26-software-architecture)
27. [Software Design, Modeling, and UML](#27-software-design-modeling-and-uml)
28. [Object-Oriented Analysis and Design](#28-object-oriented-analysis-and-design)
29. [Component, Service-Oriented, and Distributed Architecture](#29-component-service-oriented-and-distributed-architecture)
30. [Architectural Patterns, Environments, and Production Infrastructure](#30-architectural-patterns-environments-and-production-infrastructure)
31. [End-to-End Project Guideline](#31-end-to-end-project-guideline)
32. [Study Checklists and Review Questions](#32-study-checklists-and-review-questions)
33. [Glossary](#33-glossary)
34. [Todo Application Case Study](#34-todo-application-case-study)
35. [Source Files](#35-source-files)

---

# 1. How to Use This Guide

This document presents software engineering as a connected discipline rather than a collection of isolated coding skills. A software professional must understand not only how to write code, but also how to identify the correct problem, gather requirements, design a solution, test it, deploy it, maintain it, document it, and collaborate with technical and non-technical stakeholders.

A useful learning order is:

1. Understand software engineering and the SDLC.
2. Learn how requirements are discovered and documented.
3. Study design, architecture, and development methodologies.
4. Learn coding quality practices and testing.
5. Understand releases, deployment, maintenance, and versioning.
6. Learn project roles and documentation practices.
7. Apply the concepts to front-end, back-end, full-stack, web, and cloud development.
8. Practice collaborative techniques such as pair programming.

Each major section includes key concepts, practical guidance, and learning checks.

---

# 2. Foundations of Software Engineering

## 2.1 Definition

**Software engineering** is the systematic application of scientific and engineering principles to the design, creation, testing, deployment, and maintenance of software.

It uses an organized process to:

- collect and analyze business requirements;
- design an appropriate solution;
- build the software;
- test whether the solution satisfies its requirements;
- release it to users;
- maintain and improve it over time.

The key idea is that software is not produced through coding alone. It is engineered through repeatable methods, documented decisions, quality controls, and collaboration.

## 2.2 Historical Development

In the early years of computing, especially during the late 1950s and early 1960s, software development was not yet a clearly defined engineering discipline. Programs were often built through informal, ad hoc efforts without a standard development process.

As computers became more widely used, software systems became larger, more important, and more complex. Organizations struggled to deliver reliable systems within an agreed budget and schedule. This period became known as the **software crisis**, which began in the mid-1960s and continued into the mid-1980s.

Common problems included:

- projects exceeding their budgets;
- projects finishing later than planned;
- unmanageable and poorly structured code;
- large numbers of defects;
- software becoming outdated before completion;
- solutions that worked for small systems but could not scale to larger systems;
- repeated redesign and refactoring as technologies changed.

The response was to transform software creation from an unorganized coding activity into an engineering discipline with formal methods, defined roles, standard processes, and measurable quality practices.

## 2.3 Computer-Aided Software Engineering

The mid-1980s saw the growth of **Computer-Aided Software Engineering (CASE)**. CASE tools helped automate or support activities across the development lifecycle.

CASE tools can support:

1. business analysis and modeling;
2. development and debugging;
3. verification and validation;
4. configuration management;
5. metrics and measurement;
6. project management.

Modern equivalents include modeling tools, IDEs, source-control systems, automated testing systems, build pipelines, code-quality analyzers, and project-tracking platforms.

## 2.4 Software Engineer and Software Developer

The terms **software engineer** and **software developer** are often used interchangeably, but they can imply different scopes.

### Software engineer

A software engineer generally takes a broad, systematic, and system-level view. Typical responsibilities include:

- designing complete systems;
- choosing or evaluating architecture;
- building and maintaining software systems;
- writing and testing code;
- considering scalability, reliability, security, and maintainability;
- consulting clients, stakeholders, vendors, security specialists, and team members;
- making decisions that affect multiple parts of the product.

### Software developer

A software developer generally focuses more directly on implementing software functionality. Typical responsibilities include:

- translating requirements and designs into code;
- implementing specific components or features;
- fixing defects;
- writing unit tests;
- integrating code with the larger system.

### Practical distinction

A simple distinction is:

- **Software engineers build and reason about systems.**
- **Software developers implement functionality within systems.**

In practice, the exact distinction depends on the organization, project, and job title.

## 2.5 Core Responsibilities of a Software Professional

A software professional may be expected to:

- understand business and user needs;
- communicate with technical and non-technical stakeholders;
- design maintainable solutions;
- write clean and secure code;
- test software systematically;
- document decisions and behavior;
- use version control and development tools;
- troubleshoot failures;
- contribute to deployment and maintenance;
- continuously learn as tools and technologies change.

---

# 3. The Software Development Life Cycle

## 3.1 Definition

The **Software Development Life Cycle (SDLC)** is a systematic process for developing high-quality software within a predictable timeframe and budget.

Its goal is to produce software that satisfies the client's or organization's business requirements. It divides development into defined phases, each with its own activities and deliverables.

The SDLC is a cycle of planning, design, development, testing, deployment, and maintenance. Although the original model was linear, modern teams often repeat phases iteratively to respond to feedback or changing requirements.

## 3.2 Historical Development of the SDLC

The SDLC began to take shape during the 1960s as software systems became too complex to manage through informal methods. Large organizations needed a deliberate process for building business systems that used significant computing resources.

The earliest widely used model was the **waterfall model**, where work moved sequentially through discrete stages. The SDLC was later adapted to iterative approaches that better support changing requirements and customer feedback.

## 3.3 Advantages of the SDLC

Using an SDLC provides several benefits.

### A process instead of an ad hoc approach

Teams have a shared roadmap. This improves efficiency and reduces uncertainty, risk, duplicated effort, and overlooked work.

### Clearly defined phases

Each phase has a purpose and expected deliverables. Team members understand what should happen, when it should happen, and when the work is complete.

### Better communication

The lifecycle helps customers, stakeholders, developers, designers, testers, and operations staff understand how they contribute to the project.

### Earlier problem solving

Problems can be identified during requirements and design instead of appearing for the first time during coding or production use.

### Defined responsibilities

Clear roles reduce conflict, gaps, and overlapping ownership.

### Support for iteration

At the end of a cycle, the team can return to an earlier phase to incorporate feedback, new requirements, defect fixes, or enhancements.

### Improved risk and cost control

Structured planning and validation reduce the chance that major problems will be discovered only after substantial resources have been spent.

---

# 4. The Six Phases of the SDLC

Organizations may use different names or combine phases, but a common model contains six stages:

1. Planning
2. Design
3. Development
4. Testing
5. Deployment
6. Maintenance

## 4.1 Planning Phase

The planning phase defines what problem the software will solve and what the project must achieve.

### Main activities

- identify stakeholders;
- gather and analyze requirements;
- document and prioritize requirements;
- define users and the purpose of the solution;
- determine inputs and outputs;
- identify legal and regulatory obligations;
- identify risks;
- define quality-assurance expectations;
- estimate labor, materials, time, and cost;
- allocate human and financial resources;
- create a project schedule;
- identify team members and propose roles.

### Prototyping during planning

When stakeholders cannot clearly express their requirements, the team may create a **prototype**. A prototype is a small-scale or preliminary representation of the proposed product used to test basic ideas, demonstrate possible behavior, and gather feedback.

Although prototypes are common in planning, they may be used at any stage when requirements need clarification.

### Main deliverable

A major output is the **Software Requirements Specification (SRS)**. It should be clearly understood and approved by relevant stakeholders and accessible to the developers who will implement it.

## 4.2 Design Phase

The design phase transforms requirements into a technical structure that can be implemented.

### Main activities

- define the software architecture;
- divide the system into components;
- define component responsibilities and boundaries;
- define interactions between components;
- design APIs and data exchanges;
- design databases and data models;
- design user interfaces;
- consider performance, security, and platform constraints;
- review the architecture with the team and stakeholders;
- create prototypes or mock-ups where helpful.

### Main deliverable

The central output is a **design document**. Developers use it to understand how the solution should be constructed.

## 4.3 Development Phase

The development phase is also called the implementation or building phase. Developers write the code after the requirements and design are sufficiently understood.

### Main activities

- convert the design into code;
- assign coding tasks;
- select programming languages, frameworks, and software stacks;
- follow organizational standards and coding conventions;
- use source control;
- write automated tests where appropriate;
- review and integrate code;
- build working components and features.

## 4.4 Testing Phase

Testing verifies that the software is stable, secure, and compliant with the requirements.

### Main activities

- prepare and execute test cases;
- conduct manual, automated, or hybrid testing;
- perform unit, integration, system, and acceptance testing;
- report and track defects;
- fix defects;
- retest corrected functionality;
- conduct regression testing after changes;
- confirm that requirements are satisfied.

Testing continues until the product meets the agreed quality and release criteria.

## 4.5 Deployment Phase

Deployment makes the software available in its intended environment.

Possible destinations include:

- a public website;
- a mobile application store;
- a cloud environment;
- a corporate network;
- a software distribution server;
- an on-premises production environment.

Deployment may happen in stages. For example, software may first be deployed to a **User Acceptance Testing (UAT)** environment. After customer approval, it can be released to production.

## 4.6 Maintenance Phase

Maintenance begins after the software has entered production.

### Main activities

- monitor operation and reliability;
- identify and fix production defects;
- respond to user-interface or usability issues;
- gather feedback from users and stakeholders;
- identify missing or changed requirements;
- improve performance and security;
- update dependencies;
- propose enhancements;
- update documentation;
- plan future releases.

High-priority defects may require immediate correction. Lower-priority issues and enhancements may become requirements for a future development cycle.

---

# 5. Requirements Engineering

## 5.1 Purpose

Requirements engineering defines the problem to be solved and documents what a successful solution must do. Poorly understood requirements create defects, rework, cost overruns, delays, and conflict.

A sound requirements process consists of six major steps:

1. identify stakeholders;
2. establish goals and objectives;
3. elicit requirements;
4. document requirements;
5. analyze and confirm requirements;
6. prioritize requirements.

## 5.2 Identifying Stakeholders

Stakeholders are people or groups affected by the product or capable of influencing it.

They may include:

- customers;
- decision-makers;
- end users;
- system administrators;
- engineers;
- marketing staff;
- sales staff;
- customer-support staff;
- legal, compliance, privacy, or security specialists;
- operations personnel.

A strong requirements process includes representatives from every group significantly affected by the product.

## 5.3 Goals and Objectives

### Goals

Goals are broad, long-term outcomes. They explain the overall business or customer result the product should create.

Example:

> Reduce the time customers need to complete an online purchase.

### Objectives

Objectives are specific, measurable, and actionable steps that help achieve a goal.

Example:

> Reduce the average checkout process from five screens to three and achieve a median completion time below two minutes.

Goals answer **why**. Objectives define **what measurable result** should be achieved.

## 5.4 Eliciting Requirements

Requirement elicitation discovers stakeholder needs. Common methods include:

- interviews;
- surveys;
- questionnaires;
- workshops;
- observation;
- analysis of existing systems;
- prototypes;
- user stories;
- use cases.

Elicitation, documentation, and confirmation are often iterative. New findings may change earlier assumptions.

## 5.5 Documenting Requirements

Requirements should be:

- clear;
- consistent;
- complete;
- understandable;
- testable;
- traceable;
- feasible;
- approved by relevant stakeholders.

Ambiguous words such as “fast,” “easy,” or “secure” should be replaced with measurable criteria whenever possible.

## 5.6 Analyzing and Confirming Requirements

The team checks requirements for:

- contradictions;
- missing information;
- duplication;
- ambiguity;
- feasibility;
- alignment with goals;
- technical or legal constraints;
- measurable acceptance conditions.

After analysis, stakeholders review and approve the requirements.

## 5.7 Prioritizing Requirements

Requirements can be grouped using labels such as:

- **must have**;
- **highly desired**;
- **nice to have**.

Requirements should also be ordered within categories when possible. Prioritization is especially important when budget, time, or staffing is limited.

## 5.8 Requirement Documents

Three common documents are the SRS, URS, and SysRS.

### 5.8.1 Software Requirements Specification (SRS)

The **SRS** describes the expected behavior and performance of the software.

It may include:

- purpose;
- intended audience;
- scope;
- benefits;
- goals and objectives;
- constraints;
- assumptions;
- dependencies;
- functional requirements;
- external-interface requirements;
- system features;
- non-functional requirements;
- performance or service-level benchmarks.

#### Functional requirements

Functional requirements describe what the software must do.

Examples:

- allow a user to create an account;
- calculate tax for an order;
- generate a monthly report;
- send a password-reset email.

#### External-interface requirements

These describe how the software behaves in relation to users, hardware, or other software.

Examples:

- user-interface behavior;
- communication with an external payment service;
- hardware-device integration;
- API formats.

#### System features

System features are required capabilities needed for the system to function. They are often treated as a subset of functional requirements.

#### Non-functional requirements

Non-functional requirements define quality attributes or operational constraints.

Examples include:

- performance;
- safety;
- security;
- scalability;
- availability;
- reliability;
- accessibility;
- maintainability;
- compliance.

#### Constraints

Constraints limit design choices.

Examples:

- mandatory technical standards;
- required hardware;
- regulatory rules;
- supported platforms;
- fixed technology choices.

#### Assumptions

Assumptions are conditions expected to be true.

Examples:

- users will have an internet connection;
- a particular operating system is available;
- a supported browser is used.

#### Dependencies

Dependencies are external systems, services, libraries, platforms, or processes the software relies on.

### 5.8.2 User Requirements Specification (URS)

The **URS** describes the business needs and expectations of end users.

User requirements are often expressed as user stories or use cases that answer:

1. Who is the user?
2. What function must the user perform?
3. Why does the user need the function?

A common user-story form is:

> As a [type of user], I want [capability] so that [benefit].

User acceptance testing determines whether these needs have been met. In many projects, the URS and SRS are combined.

### 5.8.3 System Requirements Specification (SysRS)

The **SysRS** covers the requirements of an entire system and is broader than a software-only specification.

It may include:

- system capabilities;
- system interfaces;
- user characteristics;
- policies;
- regulations;
- personnel requirements;
- performance requirements;
- security requirements;
- hardware requirements;
- system acceptance criteria.

## 5.9 Requirements Traceability

Requirements should remain connected to design decisions, implementation work, and tests. A **traceability matrix** maps requirements to test cases so the team can verify that every requirement is covered and every test has a purpose.

---

# 6. Software Design and Architecture

## 6.1 Purpose of Software Design

Software design transforms requirements into an implementable structure. It creates a technical language and plan that developers can use to write the code.

The design should explain:

- which components exist;
- what each component is responsible for;
- how components communicate;
- how data is stored and exchanged;
- how users interact with the product;
- how the solution meets security, performance, and platform needs.

## 6.2 Components and Boundaries

A technical lead or architect breaks requirements into related components. Each component should have:

- clearly defined behavior;
- clear boundaries;
- known inputs and outputs;
- explicit interactions with other components;
- a limited and understandable responsibility.

This supports modularity, maintainability, testing, and team ownership.

## 6.3 Main Areas of Design

### System functions

Describe the main capabilities and workflows of the system.

### Application logic and business rules

Define decisions, calculations, validation rules, and domain behavior.

### API design

Define how applications or components communicate with each other and with databases or external services.

### User-interface design

Define how users see, understand, and interact with functionality.

### Database design

Define data structures, relationships, constraints, and retrieval patterns.

### Performance design

Plan how the system will respond efficiently under expected usage and load.

### Security design

Plan authentication, authorization, data protection, safe communication, and threat controls.

### Platform design

Account for operating systems, cloud platforms, browsers, devices, infrastructure, and deployment environments.

## 6.4 Prototypes and Mock-ups

A prototype is a preliminary model used for demonstration and feedback. It may represent the entire system or only a part of it.

Prototypes can help:

- clarify unclear requirements;
- validate interaction ideas;
- compare design alternatives;
- identify usability issues;
- reduce risk before full implementation.

## 6.5 Design Documentation

A design document should give developers enough information to implement the solution consistently. Depending on the project, it may include:

- architecture diagrams;
- component descriptions;
- data models;
- API contracts;
- user-interface flows;
- security decisions;
- constraints and assumptions;
- technology choices;
- deployment topology;
- known trade-offs.

---

# 7. Development Methodologies

A development methodology defines how work is organized, how phases relate to one another, and how information is communicated.

The supplied materials emphasize three approaches:

1. Waterfall
2. V-shaped model
3. Agile

## 7.1 Waterfall

Waterfall is a sequential model. The output of one phase becomes the input for the next, and the next phase begins only after the previous one is complete.

### Characteristics

- requirements and architecture are planned up front;
- phases are discrete;
- customer feedback may arrive late;
- a full product may be developed before release;
- major releases may be separated by long intervals.

### Advantages

- easy to understand;
- clearly defined phases;
- straightforward assignment of roles;
- easier early estimation of budget and resources;
- suitable when requirements are stable and well understood.

### Disadvantages

- limited flexibility;
- late changes can be expensive;
- missing requirements may be discovered too late;
- customers may not see working software until testing;
- unforeseen complications are difficult to absorb.

## 7.2 V-Shaped Model

The V-shaped model is also sequential. It connects each verification stage with a corresponding validation stage.

### Verification side

The left side of the V contains:

1. planning;
2. system design;
3. architecture design;
4. module design.

### Coding

Coding occurs at the bottom of the V.

### Validation side

The right side contains:

1. unit testing;
2. integration testing;
3. system testing;
4. acceptance testing.

Tests are planned during verification and executed during validation.

### Advantages

- simple and structured;
- test planning begins early;
- each design stage has an associated test stage;
- early test design can save time later.

### Disadvantages

- more rigid than waterfall;
- changing requirements are difficult to accommodate;
- changes during testing can be especially expensive.

## 7.3 Agile

Agile is iterative and collaborative. Development occurs through repeated short cycles rather than one long top-down sequence.

### Sprints

Teams work in **sprints**, commonly lasting one to four weeks. Each sprint includes a small cycle of planning, design, development, testing, and feedback.

At the end of the sprint, the team presents working functionality during a sprint review or demonstration. Stakeholders provide feedback, and the next sprint incorporates new priorities or changes.

### Minimum Viable Product

After several cycles, the team may produce a **Minimum Viable Product (MVP)**. An MVP contains enough functionality to test assumptions, demonstrate value, and gather meaningful feedback.

### Four Agile values

Agile emphasizes:

- individuals and interactions over processes and tools;
- working software over comprehensive documentation;
- customer collaboration over contract negotiation;
- responding to change over following a plan.

The items on the right still have value, but Agile gives greater emphasis to the items on the left.

### Advantages

- changing requirements can be incorporated quickly;
- users see working software early and often;
- feedback is continuous;
- risk is reduced through small increments;
- testing occurs throughout development;
- modular work supports frequent integration and release.

### Disadvantages

- total scope may not be known at the beginning;
- budgeting and scheduling can be more difficult;
- resource allocation may change frequently;
- success depends heavily on communication and stakeholder participation.

## 7.4 Sequential and Iterative Models Compared

| Topic                 | Waterfall / V-model       | Agile                            |
| --------------------- | ------------------------- | -------------------------------- |
| Flow                  | Sequential                | Iterative and cyclical           |
| Planning              | Mostly up front           | Repeated each sprint             |
| Customer feedback     | Usually later             | Frequent                         |
| Change handling       | Difficult                 | Expected and supported           |
| Delivery              | Often a whole product     | Small working increments         |
| Budget predictability | Often easier initially    | Can be harder when scope evolves |
| Testing               | Later or mapped to stages | Integrated into each cycle       |

## 7.5 Selecting a Methodology

A methodology should be selected based on:

- stability of requirements;
- regulatory obligations;
- cost of change;
- need for early feedback;
- project size and complexity;
- team experience;
- release frequency;
- customer availability;
- technical risk.

No methodology removes the need for requirements, design, quality, or documentation. It changes how and when those activities occur.

---

# 8. Building High-Quality Software

Six common processes contribute strongly to quality:

1. requirements gathering;
2. design;
3. coding for quality;
4. testing;
5. releases;
6. documentation.

## 8.1 What Code Quality Means

Code quality includes characteristics such as:

- maintainability;
- readability;
- testability;
- security;
- correctness;
- consistency;
- efficiency;
- appropriate documentation.

Quality code fulfills the intended requirements without known defects and is understandable enough that other developers can safely modify it.

## 8.2 Coding for Quality

Coding for quality means applying disciplined practices while developing, not attempting to repair quality only at the end.

### Recommended practices

- follow shared coding standards;
- use consistent naming and formatting;
- apply established patterns where appropriate;
- keep components focused and modular;
- write readable code;
- avoid unnecessary complexity;
- validate inputs;
- handle errors explicitly;
- protect sensitive data;
- write tests;
- use automated analysis tools;
- review code;
- document non-obvious behavior.

## 8.3 Linters and Automated Tools

A **linter** analyzes code for stylistic problems, suspicious constructs, and some programming errors. Linters help teams maintain consistency and discover issues early.

Other quality tools may include:

- formatters;
- type checkers;
- static analyzers;
- dependency scanners;
- security scanners;
- test runners;
- coverage tools;
- build and integration systems.

## 8.4 Comments and Self-Documenting Code

Comments should explain decisions, intent, constraints, or behavior that is not obvious from the code. They should not merely repeat what the code visibly does.

Good code is structured and named clearly enough that many operations can be understood without excessive comments. Comments and code must be updated together.

## 8.5 Quality Is a Lifecycle Responsibility

Quality depends on every phase:

- unclear requirements create the wrong product;
- weak design creates fragile architecture;
- poor coding practices create defects and maintenance costs;
- insufficient testing leaves errors undiscovered;
- uncontrolled releases create operational risk;
- outdated documentation creates incorrect use and support problems.

---

# 9. Software Testing

## 9.1 Definition and Purpose

Software testing integrates quality checks throughout development. Its purpose is to determine whether the software:

- satisfies expected requirements;
- behaves correctly;
- handles errors appropriately;
- is sufficiently reliable, secure, efficient, and usable;
- is ready for release.

Testing does not prove that software has no defects. It provides evidence about quality and helps identify errors, gaps, and missing requirements.

## 9.2 Test Cases

A **test case** defines how to verify a specific behavior.

A test case normally contains:

- preconditions;
- execution steps;
- inputs;
- test data;
- expected outputs;
- actual result;
- pass/fail status.

Test cases should be based on finalized or sufficiently stable requirements. They can be written during different SDLC stages, depending on the methodology.

## 9.3 Testing Categories

### 9.3.1 Functional Testing

Functional testing checks whether the system performs its required functions.

It is commonly associated with **black-box testing**, where the tester evaluates inputs and outputs without relying on knowledge of the internal source code.

Functional testing evaluates:

- expected features;
- user workflows;
- input validation;
- correct outputs;
- accessibility and usability expectations;
- exception behavior;
- appropriate error messages.

It can be manual or automated.

### 9.3.2 Non-Functional Testing

Non-functional testing evaluates quality attributes and operational behavior.

It may test:

- performance;
- security;
- scalability;
- availability;
- reliability;
- compatibility;
- recovery;
- documentation consistency;
- behavior under stress or high load.

Questions include:

- What happens when many users log in simultaneously?
- How does the application behave under stress?
- Does it behave consistently on different operating systems?
- How does it recover from a failure or disaster?
- Are user instructions consistent with the product?
- Is sensitive information protected?

### 9.3.3 Regression Testing

Regression testing confirms that a change has not damaged existing behavior.

It should be performed after:

- a defect fix;
- a requirements change;
- a new feature;
- a refactor;
- an integration change;
- an environment or dependency update.

Not every regression suite can always be run in full. Test selection may prioritize cases that:

- frequently discover defects;
- cover frequently used functionality;
- cover recently changed features;
- cover complex behavior;
- test edge cases;
- have previously passed or failed inconsistently.

## 9.4 Testing Levels

Four common testing levels are unit, integration, system, and acceptance testing.

### 9.4.1 Unit Testing

Unit testing verifies the smallest isolated part of the code, commonly a function, method, or class.

It is usually performed by developers during implementation.

Goals include:

- catch construction errors early;
- verify local logic;
- make refactoring safer;
- improve overall development efficiency;
- prevent defects from reaching integrated modules.

### 9.4.2 Integration Testing

Integration testing checks whether separate modules work correctly together.

It can expose problems involving:

- incompatible logic;
- incorrect data formats;
- communication failures;
- database interactions;
- hardware integration;
- external services;
- poor exception handling;
- modules built from different or changing assumptions.

Integration testing occurs after relevant units have passed unit tests and have been combined.

### 9.4.3 System Testing

System testing evaluates the complete, integrated application against specified requirements.

It includes functional and non-functional testing and should occur in a staging environment that resembles production as closely as practical.

### 9.4.4 Acceptance Testing

Acceptance testing evaluates whether the system satisfies user needs, business processes, and agreed requirements.

It is usually conducted by customers, users, or stakeholders. It determines whether the product is acceptable for release or operational use.

## 9.5 Testing Sequence

A typical progression is:

1. unit tests verify individual parts;
2. integration tests verify interactions;
3. system tests verify the complete product;
4. acceptance tests verify business and user expectations.

These levels reduce unnecessary overlap and allow defects to be found at the smallest practical scope.

## 9.6 Defect Workflow

A disciplined defect process includes:

1. identify the failure;
2. record steps to reproduce it;
3. describe expected and actual behavior;
4. classify severity and priority;
5. assign ownership;
6. fix the cause;
7. retest the fix;
8. run appropriate regression tests;
9. close the defect only when evidence supports resolution.

---

# 10. Releases and Software Versioning

## 10.1 Release Stages

A **release** is a distributed version of the software. Different release types serve different audiences and purposes.

### Alpha release

The alpha is an early functioning version distributed to a small group of internal or selected stakeholders.

It may:

- contain errors;
- omit some features;
- include most important functionality;
- still require significant design changes.

### Beta release

The beta, sometimes called a limited release, is provided to stakeholders or users outside the development organization.

Its purposes include:

- evaluating the product under real conditions;
- validating functionality;
- finding remaining defects;
- gathering external feedback.

The beta should normally satisfy the functional requirements, even if defects remain.

### General Availability

A **General Availability (GA)** release is the stable version intended for the full user audience. It follows agreed changes and testing after earlier release stages.

## 10.2 Purpose of Versioning

Software versioning tracks:

- new releases;
- updates;
- patches;
- builds;
- the history of software changes.

Version numbers help users identify what they are running and help developers communicate compatibility and change history.

## 10.3 Version Number Formats

Version numbers commonly contain two, three, or four numeric groups separated by periods.

Examples:

- `1.0`
- `2.4.1`
- `3.2.5.104`

A first stable release may be called `1.0`. Software still in development or beta may have a value below 1, such as `0.9`.

## 10.4 Semantic-Style Version Numbers

A common interpretation is:

`MAJOR.MINOR.PATCH.BUILD`

- **MAJOR**: substantial or incompatible changes, often a major release;
- **MINOR**: smaller features or compatible improvements;
- **PATCH**: bug fixes or small corrections;
- **BUILD**: build identifier, build date, or very small change.

Not every product follows the same interpretation or uses four components.

## 10.5 Date-Based Versioning

Some projects use a year and month. For example, a version such as `18.04.2` may indicate an April 2018 release with a later update represented by the final number.

## 10.6 Finding a Software Version

Version information is commonly available in an **About** or **Help** section. In many browsers, the user can open the main menu, select Help, and then select About.

## 10.7 Compatibility

Compatibility problems can arise between old and new software versions. Updating an outdated product may resolve some issues.

**Backward compatibility** means that newer software can continue to work with files, programs, protocols, or systems created for older versions.

Version changes should be communicated clearly when they affect compatibility.

---

# 11. Software Documentation

## 11.1 Definition

Software documentation is information that explains what a software product is, how it works, how it was built, or how to use it.

Documentation may be:

- written;
- video-based;
- graphical.

It is required across all SDLC phases and may serve:

- end users;
- developers;
- architects;
- QA engineers;
- system administrators;
- support personnel;
- managers;
- other stakeholders.

## 11.2 Product and Process Documentation

### Product documentation

Product documentation explains the software product, its behavior, structure, operation, or use.

### Process documentation

Process documentation explains how to complete a task or business process. It should describe how to perform the process with the required quality.

## 11.3 Main Types of Product Documentation

### 11.3.1 Requirements documentation

Created mainly during planning for developers, architects, QA personnel, and stakeholders.

Examples:

- SRS;
- SysRS;
- URS or user-acceptance specifications;
- user stories;
- use cases.

### 11.3.2 Design documentation

Created by architects and development teams to explain how the software will meet the requirements.

It can include conceptual and technical design materials.

### 11.3.3 Technical documentation

Technical documentation helps engineers understand and maintain the implementation.

Examples:

- inline code comments;
- README files;
- architecture documents;
- design documents;
- API documentation;
- working papers;
- engineering notes;
- maintenance guides;
- verification information.

### 11.3.4 Quality-assurance documentation

QA documentation records testing strategy, progress, evidence, and metrics.

Examples:

- test plans;
- test strategies;
- test data;
- test scenarios;
- test cases;
- defect reports;
- traceability matrices;
- test results.

### 11.3.5 User documentation

User documentation helps non-technical users install, operate, or troubleshoot the product.

Examples:

- user manuals;
- installation guides;
- help guides;
- tutorials;
- frequently asked questions;
- instructional videos;
- online help;
- inline help.

## 11.4 Standard Operating Procedures

A **Standard Operating Procedure (SOP)** gives detailed, organization-specific instructions for completing a common but potentially complex task.

Process documentation may give an overview; an SOP gives the exact steps.

For example, software engineers generally understand how to commit code, but a company may require a specific sequence for branch naming, pull requests, checks, approvals, and merging into the main branch.

SOPs may be presented as:

- step-by-step instructions;
- hierarchical outlines;
- flowcharts.

## 11.5 Keeping Documentation Current

Documentation becomes misleading when the product changes but the documentation does not.

Documentation should be:

- updated during maintenance;
- reviewed periodically;
- included in change planning;
- assigned explicit ownership;
- tested for accuracy where practical.

Organizations must allocate time and resources for documentation updates.

---

# 12. Roles in Software Engineering Projects

Role names differ between organizations and methodologies. Not every project contains every role, and one person may perform several roles in a small team.

## 12.1 Project Manager

A project manager helps the project run smoothly and coordinates large-scale concerns.

Responsibilities may include:

- planning;
- scheduling;
- budgeting;
- allocating people and resources;
- executing the project plan;
- tracking progress;
- managing risks;
- facilitating communication.

## 12.2 Scrum Master

In Agile teams, a Scrum master focuses on team effectiveness and communication rather than traditional command-and-control planning.

Responsibilities include:

- facilitating team events;
- helping remove obstacles;
- supporting healthy collaboration;
- protecting the team's process;
- encouraging individual and team success.

## 12.3 Stakeholders

Stakeholders are the people for whom the product is designed or who are affected by it.

They may:

- define requirements;
- clarify business needs;
- review prototypes;
- provide feedback;
- participate in beta or acceptance testing;
- approve deliverables.

## 12.4 System, Software, or Solution Architect

The architect defines and communicates the technical structure of the solution.

Responsibilities include:

- designing the architecture;
- defining core components and interactions;
- making technical decisions;
- considering quality attributes;
- supporting the team across SDLC stages;
- communicating architectural intent.

## 12.5 User-Experience Designer

The UX designer defines how the software behaves from the user's perspective.

Responsibilities include:

- making the product intuitive;
- ensuring the interface supports requirements;
- designing user flows and interactions;
- determining how the software communicates functionality;
- balancing simplicity with necessary capability.

## 12.6 Software Developer or Engineer

Developers write and maintain the code that powers the product.

Responsibilities include:

- implementing the design architecture;
- fulfilling software requirements;
- incorporating UX designs;
- writing tests;
- fixing defects;
- integrating components;
- contributing to documentation and reviews.

## 12.7 Tester or QA Engineer

QA professionals evaluate whether the solution meets requirements and quality expectations.

Responsibilities include:

- designing test strategies;
- writing and executing test cases;
- reporting defects;
- verifying fixes;
- assessing quality and release readiness;
- communicating findings to the development team.

## 12.8 Site Reliability or Operations Engineer

A **Site Reliability Engineer (SRE)** or operations engineer connects software development with IT systems management.

Responsibilities may include:

- monitoring reliability;
- tracking incidents;
- facilitating incident reviews;
- automating systems and procedures;
- troubleshooting;
- improving operational processes;
- helping ensure reliable service for customers.

## 12.9 Product Manager or Product Owner

The product manager or owner holds the product vision and understands client requirements and end-user needs.

Responsibilities include:

- defining product value;
- prioritizing features;
- leading or guiding development efforts;
- aligning work with stakeholder expectations;
- ensuring the product solves the intended problem.

## 12.10 Technical Writer or Information Developer

The technical writer translates technical information for a particular audience, often non-technical users.

Possible outputs include:

- user manuals;
- reports;
- white papers;
- help content;
- tutorials;
- release information;
- press materials.

Good user documentation also helps customers provide accurate feedback to the development team.

## 12.11 Collaboration Across Roles

Successful delivery depends on collaboration. Requirements, architecture, UX, implementation, testing, operations, product strategy, and documentation influence one another. Handoffs should be treated as communication points, not barriers between departments.

---

# 13. Web and Cloud Development Fundamentals

## 13.1 Client-Server Communication

When a user enters a URL into a browser, the browser acts as a client and contacts a server. The server receives the request and returns the information required to display or operate the website.

A typical response contains:

- **HTML** for page structure;
- **CSS** for presentation and styling;
- **JavaScript** for interactivity and dynamic behavior.

## 13.2 Static and Dynamic Content

### Static content

Static content is already stored and is returned largely as prepared.

Examples:

- a fixed image;
- a basic informational page;
- a stored stylesheet.

### Dynamic content

Dynamic content is generated or selected when the client requests it. It may depend on:

- the user;
- database information;
- current application state;
- data from another service;
- time or location;
- business rules.

Most modern websites combine static and dynamic elements.

## 13.3 Cloud Applications

Cloud applications also use client-server communication, but they are designed to work with cloud-based infrastructure, storage, data processing, and services.

Cloud architectures can support:

- scalability;
- resilience;
- distributed processing;
- managed services;
- flexible resource allocation.

The client still requests content or functionality, while the cloud-based back end processes the request and returns a response.

## 13.4 Front End and Back End

The web development environment is commonly divided into two areas.

### Front end

The front end is the client-side portion the user can see and interact with.

### Back end

The back end is the server-side portion that handles application logic, data, authentication, authorization, and services before information is returned to the client.

## 13.5 Full Stack

A full-stack developer has knowledge and experience in both front-end and back-end development and understands how the parts connect.

---

# 14. Front-End Development

## 14.1 Purpose

Front-end development creates the visible and interactive portion of a website or cloud application. It must translate user needs and UX designs into an interface that works across browsers and devices.

## 14.2 HTML

**Hypertext Markup Language (HTML)** defines the structure of a webpage.

It represents elements such as:

- text;
- links;
- images;
- videos;
- sections and dividers;
- forms;
- buttons.

HTML gives the browser a structured description of the content.

## 14.3 CSS

**Cascading Style Sheets (CSS)** define the presentation of HTML content.

CSS controls:

- colors;
- fonts;
- spacing;
- layouts;
- sizing;
- visual consistency;
- responsive behavior;
- component styling.

CSS helps create a uniform look and feel across a site.

## 14.4 JavaScript

JavaScript adds behavior, logic, interactivity, and dynamic content.

For example:

- HTML creates a login button;
- CSS styles the button;
- JavaScript responds to the click and performs the login interaction.

JavaScript can update content, validate forms, communicate with APIs, and manage application state.

## 14.5 CSS Extensions: Sass and Less

### Sass

**Sass** is a CSS extension that can provide:

- variables;
- nested rules;
- imports;
- reusable styling structures.

It helps developers organize and create stylesheets more efficiently. Sass must be transformed into standard CSS for browsers.

### Less

**Less** also extends CSS with additional functions and organizational features while remaining compatible with CSS concepts. A tool such as `less.js` can convert Less styles into CSS.

## 14.6 Adaptive and Responsive Design

### Adaptive design

Adaptive design provides a layout specifically prepared for a particular screen size or device category. Different devices may receive different versions or levels of detail.

### Responsive design

Responsive design automatically adjusts layout and sizing to the available screen. The same content reorganizes itself to remain usable on phones, tablets, and desktop screens.

## 14.7 Cross-Browser and Cross-Device Compatibility

Front-end software should work across:

- multiple browsers;
- operating systems;
- screen sizes;
- desktop and mobile devices;
- assistive technologies where required.

Compatibility must be tested because browsers and devices may interpret features differently.

## 14.8 JavaScript Frameworks and Libraries

Frameworks and libraries provide reusable structures and components for building interactive applications.

### Angular

Angular is a broad front-end framework with built-in capabilities such as routing and form validation. It supports the creation of structured web applications.

### React

React is a library focused on building and rendering reusable user-interface components. Capabilities such as routing normally require additional tools.

### Vue

Vue focuses strongly on the user-interface layer and visual components. It is flexible and can be adopted as a library for part of a page or as a larger application framework.

## 14.9 Continuous Learning in Front-End Development

Front-end technology changes frequently. Developers must maintain knowledge of:

- browser capabilities;
- language features;
- frameworks and libraries;
- accessibility;
- responsive design;
- performance;
- security;
- device compatibility.

---

# 15. Back-End Development

## 15.1 Purpose

A back-end developer creates and manages the resources required to answer client requests. The back end processes inputs, retrieves and stores data, applies business logic, and delivers services securely.

Front-end and back-end developers must understand the same requirements and agree on how their parts will interact.

## 15.2 Common Back-End Responsibilities

Back-end work may include:

- processing user inputs;
- querying databases;
- returning data to the client;
- managing accounts;
- implementing authentication;
- implementing authorization;
- securely handling sensitive data;
- defining APIs;
- defining routes and endpoints;
- integrating external services;
- maintaining server-side behavior;
- troubleshooting and monitoring.

## 15.3 Example: Online Shopping

In an online store, the back end may process:

- login information;
- product searches;
- shopping-cart operations;
- addresses;
- payment information;
- inventory data;
- orders.

When a user searches for a product, the front end sends a request. The back end interprets it, queries a database, processes the result, and sends suitable data back for display.

## 15.4 Authentication and Authorization

### Authentication

Authentication determines who the user is.

Examples:

- username and password;
- multi-factor authentication;
- identity-provider login.

### Authorization

Authorization determines what an authenticated user is allowed to do.

Examples:

- a customer can view their own orders;
- an administrator can manage products;
- a support agent can access limited customer information.

## 15.5 Secure Data Handling

Sensitive data such as addresses, credentials, and payment information must be handled securely.

The back end should consider:

- safe transmission;
- validation;
- access control;
- secure storage;
- minimal collection;
- error handling;
- regulatory and privacy requirements.

## 15.6 APIs

An **Application Programming Interface (API)** defines rules and structures for software communication.

APIs commonly exchange data in formats such as:

- JSON;
- XML.

They allow websites, cloud applications, mobile apps, and other software to access back-end resources.

## 15.7 Routes and Endpoints

### Route

A route is a path that connects a request to behavior in the application.

### Endpoint

An endpoint is a specific accessible location or operation, often exposed through an API.

When a front-end request arrives, server-side routing directs it to the correct service. If no suitable route or endpoint exists, the server may return an error such as HTTP 404.

## 15.8 Back-End Languages and Frameworks

A back-end developer should know at least one server-side language and its ecosystem.

### JavaScript

JavaScript can be used on the server through environments and tools such as:

- Node.js;
- Express.

### Python

Python can support web applications, database access, automation, and data analysis.

Common web frameworks include:

- Django;
- Flask.

## 15.9 Databases and SQL

Back-end developers frequently store, retrieve, and process data.

They may work with:

- relational databases;
- NoSQL databases;
- database administrators on larger projects.

Knowledge of SQL is valuable for understanding and troubleshooting relational data operations.

## 15.10 Object-Relational Mapping

An **Object-Relational Mapper (ORM)** connects application objects with relational database records. It can reduce the need to write every query manually.

However, developers should still understand database fundamentals because abstractions can hide performance or correctness problems.

## 15.11 Back-End Development as an Evolving Discipline

Back-end systems must remain secure, available, and maintainable while requirements and technologies change. The work ranges from account management and API design to database operations, security, cloud services, and production reliability.

---

# 16. Full-Stack Development and Team Integration

## 16.1 Full-Stack Scope

A full-stack developer understands both client-side and server-side environments.

This may include:

- HTML, CSS, and JavaScript;
- a front-end framework or library;
- server-side programming;
- API design;
- authentication and authorization;
- databases;
- development tooling;
- testing;
- deployment fundamentals.

Full-stack knowledge does not require equal mastery of every technology. It means being able to understand and contribute across the end-to-end flow.

## 16.2 Front-End and Back-End Collaboration

Before development begins, both sides should agree on:

- requirements;
- user flows;
- data formats;
- API contracts;
- validation rules;
- authentication behavior;
- error responses;
- performance expectations;
- security responsibilities.

During development, they collaborate to resolve integration problems and add functionality.

## 16.3 Typical Request Flow

1. A user interacts with the front end.
2. JavaScript sends a request to a back-end route or API endpoint.
3. The server authenticates and authorizes the request when required.
4. Business logic processes the request.
5. The back end reads or updates a database or external service.
6. The server returns a response.
7. The front end updates the interface.
8. Errors are displayed or handled appropriately.

---

# 17. Development Tools and Environments

## 17.1 Code Editors

A code editor is a fundamental development tool. It helps developers create and modify source files.

Examples mentioned in the source material include:

- Sublime Text;
- Atom;
- Vim;
- Visual Studio Code.

## 17.2 Integrated Development Environments

An **Integrated Development Environment (IDE)** combines editing with additional tools such as:

- build integration;
- compilation;
- debugging;
- project management;
- language support;
- testing;
- source-control integration.

Examples include:

- Visual Studio;
- Eclipse;
- NetBeans.

Some modern editors can gain IDE-like capabilities through extensions.

## 17.3 Source Control

Development environments often integrate with source-control tools such as Git and collaboration platforms such as GitHub.

Source control supports:

- change history;
- collaboration;
- branches;
- reviews;
- merging;
- restoration of earlier versions;
- release management.

## 17.4 Build and Debugging Tools

Developers may need tools to:

- integrate modules;
- compile source code;
- build applications;
- run tests;
- inspect errors;
- debug execution;
- package releases.

## 17.5 Customization

Extensions and themes can adapt an editor or IDE to a language, framework, workflow, or accessibility need. Customization should improve productivity without making the environment inconsistent or difficult for the team to support.

---

# 18. Version Control, Libraries, and Frameworks

## 18.1 Version Control

Version control records how source code changes over time. It identifies what changed, when it changed, and who made the change. This is essential when several developers contribute to the same codebase, but it is also valuable for individual projects because it provides history and a safe way to return to an earlier working version.

A version-control workflow commonly includes:

- a **repository** containing the project and its history;
- **commits** that record logical sets of changes;
- **branches** that isolate features or experiments;
- **merges** that combine completed work;
- **pull requests** or merge requests for review and discussion;
- conflict resolution when two changes affect the same code.

**Git** is a widely used distributed version-control system. **GitHub** is a hosting and collaboration platform built around Git repositories. Teams can use it not only for source code, but also for pull requests, issue tracking, feature planning, task management, and project discussions.

### Recommended beginner workflow

1. Create a repository at the start of the project.
2. Commit small, meaningful changes with clear messages.
3. Create a branch for each feature or fix.
4. Pull or fetch recent changes before starting work.
5. Run tests and formatting tools before opening a pull request.
6. Review and merge only when the change meets team standards.

## 18.2 Code Libraries

A **library** is a reusable collection of code that solves a particular problem or supplies a feature. Instead of implementing common behavior from scratch, a developer calls the library when it is needed. When the library routine finishes, control returns to the developer's program.

Examples include:

- DOM-manipulation libraries;
- validation utilities;
- HTTP-client libraries;
- date and time libraries;
- reusable Java or Python components;
- database drivers.

Libraries accelerate development, but they must be evaluated for maintenance status, security, licensing, compatibility, documentation, size, and long-term support.

## 18.3 Frameworks

A **framework** provides a standard structure for building and deploying an application. It acts as a scaffold into which developers place their code. Unlike a library, a framework generally controls the application flow and calls the developer's code at defined points.

This relationship is called **inversion of control**:

- with a library, your code calls the library;
- with a framework, the framework calls your code.

Frameworks improve consistency, reduce repetitive configuration, and encourage recognized architectural patterns. They are usually less flexible than libraries because developers must follow their conventions.

Examples include Angular, Vue, Django, Flask, Express, Spring, and ASP.NET.

## 18.4 Opinionated and Unopinionated Frameworks

An **opinionated framework** makes many decisions for the developer, such as file locations, naming conventions, project organization, and standard workflows. This can make development faster and more consistent, especially across a team.

A less opinionated framework gives developers more architectural freedom, but the team must make and document more decisions itself.

## 18.5 Library versus Framework

| Dimension    | Library                                | Framework                                             |
| ------------ | -------------------------------------- | ----------------------------------------------------- |
| Control flow | Application calls library              | Framework calls application code                      |
| Scope        | Usually solves a focused problem       | Structures much or all of the application             |
| Flexibility  | Generally higher                       | Generally lower                                       |
| Adoption     | Can often be added for a specific need | Usually selected early because it shapes architecture |
| Main value   | Reuse                                  | Standardization and structure                         |

---

# 19. CI/CD, Build Tools, Packages, and Package Managers

## 19.1 Continuous Integration

**Continuous Integration (CI)** is the practice of integrating code changes frequently and validating them automatically. A CI server checks out the code, installs dependencies, builds the application, and runs automated tests and quality checks.

Frequent integration reduces the size of each change and makes conflicts and defects easier to identify. A healthy CI pipeline should give rapid, trustworthy feedback.

Typical CI stages are:

1. retrieve source code;
2. install or restore dependencies;
3. lint and format-check code;
4. compile or build;
5. run unit and integration tests;
6. perform security or quality scans;
7. create a build artifact.

## 19.2 Continuous Delivery and Continuous Deployment

**Continuous delivery** automatically prepares validated changes and deploys them to a testing or staging environment. Production release remains a deliberate business or technical decision.

**Continuous deployment** goes further: every change that passes the pipeline is automatically released to production.

Both approaches depend on strong automated tests, repeatable infrastructure, monitoring, rollback procedures, and small changes.

## 19.3 Build Tools

A build tool transforms source code and project resources into runnable or distributable artifacts. Depending on the technology, a build may:

- download dependencies;
- compile source code;
- transpile newer language syntax;
- bundle modules;
- optimize assets;
- execute tests;
- package binaries;
- produce deployment artifacts.

Build tools can run locally from a terminal or IDE, or remotely on a build-automation server. Examples include Webpack, Babel, Maven, Gradle, and platform-specific compilers and bundlers.

## 19.4 Build Utilities and Build Servers

A **build-automation utility** performs build tasks and generates artifacts. A **build-automation server** runs those utilities automatically when triggered by a commit, pull request, schedule, or release event.

Automation is especially important when projects contain many modules, dependencies, contributors, and deployment environments.

## 19.5 Packages

A **software package** bundles application files with installation instructions and metadata. Package metadata may include:

- package name and description;
- version;
- author or publisher;
- dependencies;
- supported platform;
- installation scripts;
- integrity information.

Packages make software easier to distribute, install, update, and remove consistently.

## 19.6 Package Managers

A **package manager** locates, downloads, verifies, installs, updates, and removes packages. It also resolves dependencies and may verify checksums or digital signatures.

Common examples include:

- npm for Node.js and JavaScript;
- pip and Conda for Python;
- Maven and Gradle for Java ecosystems;
- RubyGems for Ruby;
- Homebrew and MacPorts for macOS;
- DPKG/APT and RPM-family tools for Linux;
- Chocolatey for Windows.

### Dependency-management practices

- Pin or lock dependency versions for reproducible builds.
- Update dependencies regularly rather than allowing them to become obsolete.
- Review transitive dependencies and known vulnerabilities.
- Remove unused packages.
- Commit lock files when the ecosystem expects them.
- Avoid installing packages solely because they are popular; evaluate necessity and trustworthiness.

---

# 20. Software and Technology Stacks

## 20.1 Definition

A **software stack** is a combination of programming languages, frameworks, servers, databases, and supporting software that work together to build and run an application. The technologies form layers, with higher layers providing services to users and lower layers interacting more closely with operating systems, networks, and hardware.

A **technology stack** is a broader term that may also include infrastructure such as virtual machines, containers, storage systems, load balancers, orchestration platforms, and cloud services.

## 20.2 Common Layers

A simple application stack may contain:

1. **Presentation layer** — user interface and client-side behavior.
2. **Business-logic layer** — rules, workflows, validation, and application services.
3. **Data layer** — databases, storage, and data-access code.

Larger systems may add API gateways, messaging, caching, identity services, observability, networking, container orchestration, and security services.

## 20.3 Selecting a Stack

A stack should be chosen according to:

- product requirements;
- team skills;
- expected scale and performance;
- data structure and consistency needs;
- hosting environment;
- security and compliance;
- ecosystem maturity;
- maintainability and hiring availability;
- licensing and total cost;
- integration with existing systems.

There is no requirement to use every possible layer or service. A good stack contains only what the solution needs.

## 20.4 Common Stack Examples

### LAMP

- Linux
- Apache
- MySQL or a compatible relational database
- PHP, Perl, or Python

LAMP is mature, open source, well documented, and suitable for many server-rendered web applications. Components can often be substituted, such as PostgreSQL for MySQL.

### MEAN

- MongoDB
- Express
- Angular
- Node.js

MEAN uses JavaScript across most of the stack. This can simplify skill requirements and data exchange, but MongoDB's document model and the stack's architecture are not automatically ideal for every large or highly relational system.

### MERN and MEVN

MERN replaces Angular with React. MEVN replaces Angular with Vue. The choice mainly changes the front-end approach while retaining MongoDB, Express, and Node.js on the back end.

### Other examples

- Python with Django and a relational database;
- Ruby on Rails;
- ASP.NET with IIS, SQL Server, and Azure services;
- Java with Spring and a relational or document database.

## 20.5 Avoiding Stack-Driven Design

A popular stack is not automatically the correct stack. Teams should begin with requirements and constraints, then choose technologies. Selecting a stack first and forcing the problem into it can create unnecessary complexity and long-term maintenance costs.

---

# 21. Programming Languages and Execution Models

## 21.1 Human-Readable Code and Machine Code

Programming languages allow humans to express instructions in a readable form. Processors ultimately execute **machine code**, represented in binary. Language-processing tools translate source code into instructions the computer can execute.

## 21.2 Interpreted Languages

An interpreted language is executed through an interpreter or runtime. The interpreter translates or executes code as the program runs. Examples commonly described as interpreted include Python and JavaScript, although modern implementations may also compile portions internally.

Typical characteristics include:

- fast edit-run feedback;
- portability when a compatible runtime exists;
- flexible and interactive development;
- runtime discovery of some errors;
- possible performance overhead compared with ahead-of-time native compilation.

## 21.3 Compiled Languages

A compiler translates source code into another form before execution, often native machine code or an intermediate representation. Compiled programs can provide strong build-time checks and efficient execution.

Examples include C, C++, C#, Java, Rust, and Go, although their exact compilation and runtime models differ. Java, for example, normally compiles to bytecode executed by a virtual machine rather than directly to a platform-specific native executable.

## 21.4 The Distinction Is Not Absolute

Modern languages often combine interpretation, bytecode compilation, just-in-time compilation, and ahead-of-time compilation. Therefore, language choice should not be based only on the label “compiled” or “interpreted.” Consider the complete runtime, deployment environment, tooling, performance needs, type system, ecosystem, and team expertise.

## 21.5 High-Level and Low-Level Languages

A **high-level language** abstracts many hardware details and offers syntax designed for human readability and productivity. Examples include Python, Java, JavaScript, SQL, C#, and many other application languages.

A **low-level language** is closer to processor instructions and memory operations. Assembly languages are low-level and normally depend on a specific processor architecture.

## 21.6 Query Languages and SQL

A **query language** is used to request or manipulate data. SQL is the most common language for relational database systems.

The four fundamental data operations are often summarized as **CRUD**:

- Create
- Read
- Update
- Delete

SQL statements can retrieve data, insert rows, modify existing data, remove data, define schemas, create users, and manage permissions.

Relational databases use tables, defined schemas, rows, columns, keys, and relationships. **NoSQL** describes several non-relational database models, such as document, key-value, graph, and wide-column databases. NoSQL does not mean that structure or querying is absent; it means the system does not rely exclusively on the traditional relational model.

## 21.7 Assembly Languages

Assembly language represents processor instructions with readable mnemonics and operands. An **assembler** translates each assembly instruction into machine instructions.

Assembly is architecture-specific. ARM, x86, and MIPS systems use different instruction sets. Assembly is used where precise hardware control, very low-level optimization, embedded programming, operating-system work, or reverse engineering is required.

A typical instruction contains:

- an opcode or mnemonic describing the operation;
- one or more operands identifying values or locations;
- optionally, a label and comment.

## 21.8 Programming Paradigms

### Procedural programming

Procedural programming organizes behavior around procedures or functions and a sequence of operations. It can be direct, efficient, and easy to reason about for algorithmic tasks.

### Object-oriented programming

Object-oriented programming organizes software around objects that combine state and behavior. It can model real-world or domain concepts and provide encapsulation and reusable abstractions.

Too little structure can make a system difficult to maintain, while excessive object-oriented structure can create unnecessary inheritance, indirection, and boilerplate. The appropriate paradigm depends on the problem.

---

# 22. Programming Fundamentals

## 22.1 Identifiers

An **identifier** is a name assigned to a program element, such as a variable, constant, function, class, method, interface, or module. Good identifiers communicate purpose and reduce the need for explanatory comments.

Prefer meaningful names such as `taxRate`, `customerEmail`, or `calculateTotal` over vague names such as `x`, `data`, or `doThing`, except where a short conventional name is genuinely clearer.

## 22.2 Constants and Variables

A **constant** represents a value that should not change during the relevant lifetime of a program. Constants improve readability and place important configuration or domain values in one location.

A **variable** stores a value that may change while the program executes. Variables can represent user input, intermediate calculations, application state, counters, object references, and many other forms of data.

Avoid unnecessary hard-coding. Named constants and configuration make software easier to understand and change.

## 22.3 Data Types

A data type describes the kind of value a program stores and the operations permitted on it. Common categories include:

- integers and floating-point numbers;
- Boolean values;
- characters and strings;
- dates and times;
- collections;
- objects and records;
- null or optional values.

Some languages enforce types statically before execution, while others determine types dynamically at runtime. Both approaches have benefits and trade-offs.

## 22.4 Containers: Arrays and Dynamic Collections

An **array** usually stores a fixed-size sequence of elements, commonly of the same type, and accesses them by index. Many languages use zero-based indexing.

A **dynamic array** or vector can grow and shrink as elements are added or removed. Dynamic collections are more flexible but may require additional memory and occasional resizing work.

Other important containers include lists, sets, maps or dictionaries, queues, stacks, and trees. Choose a data structure according to the operations the program must perform efficiently.

## 22.5 Boolean Logic

A Boolean value is either `true` or `false`. Boolean expressions compare values and combine conditions using operators such as AND, OR, and NOT.

Boolean logic drives program decisions, validation, authorization checks, filtering, loops, and state transitions.

## 22.6 Branching

**Branching** allows a program to follow different paths according to conditions.

Common constructs include:

- `if`;
- `if/else`;
- `else if` chains;
- `switch` or `match` expressions.

A branch should be clear, focused, and testable. Deeply nested conditions often indicate that logic should be simplified or divided into smaller functions.

The `goto` statement exists in some languages but is generally avoided in application code because unrestricted jumps can make control flow difficult to follow.

## 22.7 Looping

A **loop** repeats a block of instructions until a condition changes or a sequence is exhausted.

Common loop types are:

- `while` — checks the condition before each iteration;
- `for` — commonly uses a counter or iterates over a collection;
- `do/while` — executes the body at least once and checks afterward;
- collection iteration constructs such as `for each`.

Every loop should have a clear termination condition. Infinite loops, off-by-one errors, and modification of a collection during iteration are common sources of defects.

## 22.8 Functions and Subroutines

A function packages a defined behavior behind a name. It may accept parameters and return a result. Functions improve reuse, readability, testing, and separation of concerns.

Good functions generally:

- do one coherent job;
- use descriptive names;
- have clear inputs and outputs;
- avoid hidden side effects where practical;
- remain small enough to understand;
- handle invalid input deliberately.

---

# 23. Algorithms, Flowcharts, and Pseudocode

## 23.1 Algorithms

An **algorithm** is a finite, ordered procedure for solving a problem. Code is an implementation of an algorithm in a particular programming language.

Before writing code, clarify:

1. required inputs;
2. desired outputs;
3. rules and constraints;
4. exceptional and edge cases;
5. the sequence of transformations;
6. termination conditions;
7. correctness and performance expectations.

## 23.2 Why Plan Before Coding

Planning improves readability, maintainability, consistency, and reliability. It allows the team to discuss logic without becoming distracted by language syntax and helps identify missing cases before implementation becomes expensive.

Two common planning tools are flowcharts and pseudocode.

## 23.3 Flowcharts

A **flowchart** is a graphical representation of a process or algorithm. Standard symbols include:

- capsule or oval — start/end;
- rectangle — process;
- diamond — decision;
- parallelogram — input/output;
- arrows — control flow;
- connectors — continuation between areas.

Flowcharts are useful for communicating smaller workflows, decision paths, business processes, and system interactions. They become difficult to maintain when used for very large or highly detailed programs.

## 23.4 Pseudocode

**Pseudocode** is a language-independent, structured description of program logic. It resembles code but does not require exact syntax.

Example:

```text
READ number
IF number MOD 2 equals 0
    DISPLAY "even"
ELSE
    DISPLAY "odd"
END IF
```

Pseudocode helps technical and non-technical participants agree on behavior. It is easy to modify and can be translated into different programming languages.

## 23.5 Flowchart versus Pseudocode

| Dimension           | Flowchart                          | Pseudocode                           |
| ------------------- | ---------------------------------- | ------------------------------------ |
| Form                | Visual diagram                     | Structured text                      |
| Best suited to      | Small processes and decision flows | Detailed algorithms and larger logic |
| Accessibility       | Highly visual                      | Closer to implementation             |
| Modification        | Can become cumbersome              | Usually quick to edit                |
| Language dependence | Independent                        | Independent                          |

## 23.6 From Problem to Code

A reliable beginner workflow is:

1. Restate the problem in plain language.
2. Identify inputs, outputs, and constraints.
3. Write example cases, including edge cases.
4. Design the algorithm.
5. Express it in pseudocode or a flowchart.
6. Review the logic with another person.
7. Translate it into code.
8. Create tests from the earlier examples.
9. Refactor names and structure after correctness is established.

---

# 24. Pair Programming

## 24.1 Definition

**Pair programming** is an Agile collaboration technique in which two developers work together at one computer or through a shared remote environment.

They continuously discuss, plan, review, and implement a solution. Physical pairing is often preferred, but virtual pairing through screen sharing and video communication can also be productive.

## 24.2 Driver-Navigator Style

This is the most common style.

- The **driver** types the code.
- The **navigator** reviews the code as it is written, suggests the next direction, and watches the larger solution.

The pair should exchange roles regularly so both participants remain engaged and understand the complete task.

## 24.3 Ping-Pong Style

Ping-pong pairing incorporates test-driven development.

For each task:

1. one developer writes a failing test;
2. the other writes the code required to pass it;
3. they swap roles for the next task;
4. they refactor the successful solution together.

## 24.4 Strong-Style Pairing

Strong-style pairing is useful for transferring knowledge from an experienced engineer to a less experienced engineer.

The core principle is:

> For an idea to move from one person's mind into the computer, it must pass through the other person's hands.

The experienced developer often acts as navigator, while the learning developer drives and implements the guidance. This exposes the learner to the expert's reasoning and implementation approach.

## 24.5 Benefits

Pair programming can:

- transfer knowledge and project context;
- onboard new team members;
- build communication skills;
- improve problem-solving skills;
- reduce typographical and logic errors;
- discover defects earlier;
- provide continuous informal review;
- generate and compare multiple solution ideas;
- improve code quality;
- reduce later testing, review, and defect-fixing effort.

Although two people work on one task, the overall result may be more efficient when reduced defects and rework are considered.

## 24.6 Challenges

Pair programming can also create difficulties:

- long periods of concentration can be exhausting;
- schedules and personal commitments may not align;
- one person may dominate;
- the pairing can degrade into a typist/programmer relationship;
- personality conflicts can reduce effectiveness;
- multiple pairs in one room can create noise;
- pairing may feel slower for simple or familiar tasks.

## 24.7 Good Pairing Practices

- define the task before beginning;
- agree on the pairing style;
- rotate roles regularly;
- verbalize reasoning;
- ask questions respectfully;
- take breaks;
- avoid domination;
- use shared coding standards;
- finish with tests and a brief review;
- choose pairing for work where collaboration adds value.

---

# 25. Functions, Objects, and Modular Programming

## 25.1 Modular Programming

Modular programming divides a large program into smaller components, each responsible for a focused task. This reduces complexity and makes software easier to understand, test, reuse, maintain, and extend.

A useful module should have:

- a clear responsibility;
- a stable and understandable interface;
- minimal dependence on unrelated modules;
- behavior that can be tested independently; and
- a name that communicates its purpose.

Modularity supports teamwork because different developers can work on separate parts of a system with less interference.

## 25.2 Functions

A function is a structured, reusable block of code that performs one specific action. Depending on the language and context, similar constructs may be called procedures, methods, subroutines, or modules.

A function commonly:

1. receives input through parameters;
2. processes that input;
3. produces a result or side effect; and
4. optionally returns an output.

Programming languages usually provide standard-library functions, such as functions for printing, sorting, or working with text. Developers can also create custom functions and call them repeatedly.

### Defining and calling functions

Defining a function establishes its name, parameters, and body. Calling or invoking the function executes the instructions in that body. Some languages also require a separate declaration that tells the compiler about the function before its implementation is encountered.

### Function-design guidelines

- Give each function one clear responsibility.
- Use descriptive names.
- Keep parameter lists manageable.
- Avoid hidden changes to unrelated state.
- Return predictable values.
- Handle invalid input deliberately.
- Write unit tests for important behavior.

## 25.3 Objects

An object combines data and behavior. Its data is represented by properties, attributes, fields, or state, while its behavior is represented by methods.

For example, a `UserAccount` object might contain properties such as an identifier, email address, and account status, together with methods such as `activate()`, `suspend()`, or `changePassword()`.

Object-oriented programming packages operations with the data they affect. Procedural programming generally emphasizes procedures that operate on separate data structures. Neither approach is universally superior; the appropriate design depends on the problem, team, language, and required flexibility.

## 25.4 Functions versus Methods

A function is generally an independent reusable operation. A method is a function associated with an object or class. Methods can access the object's state and are commonly used to express the behaviors that an object can perform.

---

# 26. Software Architecture

## 26.1 Definition and Purpose

Software architecture is the fundamental organization of a software system. It acts as a blueprint that describes major components, their responsibilities, their interactions, the operating environment, and the principles that guide implementation.

Architecture captures important early decisions. These decisions can be expensive to reverse after implementation, so they should be based on explicit business, technical, and operational requirements.

## 26.2 Quality Attributes

Architecture must address not only functional behavior but also non-functional qualities, including:

- performance;
- scalability;
- availability and reliability;
- security;
- maintainability;
- interoperability;
- testability;
- manageability; and
- deployability.

Trade-offs are unavoidable. For example, a highly distributed design may improve scalability and team autonomy while increasing operational complexity, latency, and debugging difficulty.

## 26.3 Why Architecture Matters

Well-designed architecture:

- creates a shared technical vision;
- supports communication among stakeholders;
- guides technology-stack and infrastructure choices;
- reduces the cost of future change;
- provides boundaries for parallel team development;
- makes quality attributes explicit; and
- helps the system survive changes in implementation technology.

## 26.4 Architecture and Technology Stacks

The architecture should drive stack selection rather than the reverse. Architects evaluate languages, frameworks, databases, messaging systems, infrastructure, and cloud services according to the system's requirements and constraints.

Selection criteria should include:

- suitability for required workloads;
- team knowledge and hiring availability;
- ecosystem maturity;
- security and maintenance support;
- integration requirements;
- operational cost;
- vendor lock-in; and
- expected lifetime of the system.

## 26.5 Architecture Artifacts

Common architecture deliverables include:

### Software Design Document (SDD)

The SDD records the technical design, including assumptions, dependencies, constraints, objectives, methodologies, interfaces, and implementation guidance.

### Architecture diagram

An architecture diagram visualizes system components, boundaries, communication paths, external dependencies, and deployment constraints.

### UML diagrams

Unified Modeling Language diagrams provide standardized, language-independent representations of system structure and behavior.

### Architecture Decision Records

An Architecture Decision Record, or ADR, captures a significant decision, the context in which it was made, alternatives considered, and consequences. ADRs preserve design reasoning that diagrams alone often cannot communicate.

---

# 27. Software Design, Modeling, and UML

## 27.1 Structural and Behavioral Design

Structural design describes how a system is organized. It decomposes a problem into modules and submodules with defined responsibilities and relationships.

Behavioral models describe what the system does over time: how it responds to inputs, changes state, and coordinates interactions. They focus on observable behavior without necessarily specifying implementation details.

## 27.2 Cohesion and Coupling

**Cohesion** is the degree to which the elements inside a module belong together. High cohesion is desirable because a module with one focused purpose is easier to understand and change.

**Coupling** is the degree of dependency between modules. Loose coupling is desirable because changes in one module are less likely to break another.

A strong design generally aims for **high cohesion and low coupling**.

## 27.3 Unified Modeling Language

UML is a standardized, programming-language-independent visual modeling language. It helps teams plan systems before coding, communicate across technical and non-technical audiences, onboard team members, and navigate relationships within a complex codebase.

UML diagrams fall broadly into two categories:

- **Structural diagrams**, which describe static organization.
- **Behavioral diagrams**, which describe activity and interaction over time.

## 27.4 State-Transition Diagrams

A state-transition diagram shows:

- the possible states of a system or object;
- events that trigger changes;
- transitions between states; and
- sometimes conditions or actions related to those transitions.

These diagrams are useful for workflows, devices, orders, user accounts, and any domain where behavior depends strongly on current state.

## 27.5 Interaction and Sequence Diagrams

Interaction diagrams model communication among objects or components. A sequence diagram presents interactions in time order, making it useful for understanding request flows, API calls, authentication, transactions, and distributed operations.

## 27.6 Modeling Guidelines

- Model only what supports a decision or shared understanding.
- Keep diagrams at a consistent level of abstraction.
- Use names that match the implementation vocabulary.
- Update high-value diagrams when the system changes.
- Avoid diagrams so detailed that maintaining them costs more than the insight they provide.

---

# 28. Object-Oriented Analysis and Design

## 28.1 Objects, Classes, and Instances

A class is a blueprint or template describing common properties and methods. An object is a concrete instance created from that class. Creating an instance is called instantiation.

For example, a `Patient` class might define properties such as `lastName` and methods such as `cancelAppointment()`. A specific patient object receives actual property values when instantiated.

## 28.2 Object-Oriented Analysis

Object-oriented analysis studies the problem domain and identifies:

- important entities;
- their responsibilities;
- their data;
- their behaviors;
- relationships among them; and
- interactions required to complete use cases.

The aim is to understand the domain before deciding implementation details.

## 28.3 Object-Oriented Design

Object-oriented design translates the analysis into software structures. It assigns responsibilities to classes, defines interfaces, chooses relationships, and organizes collaboration among objects.

Good object-oriented design avoids both extremes: a single oversized object that does everything and an excessive number of tiny abstractions that add ceremony without value.

## 28.4 Class Diagrams

A UML class diagram shows classes, their properties, methods, and relationships. Common relationships include:

- **association** — objects know about or use one another;
- **aggregation** — a whole contains parts that can exist independently;
- **composition** — a whole owns parts whose lifecycle depends on it;
- **inheritance** — a subclass receives and extends behavior from a parent class; and
- **dependency** — one class temporarily relies on another.

## 28.5 Inheritance and Composition

Inheritance models an “is-a” relationship, while composition models a “has-a” relationship. Composition is often more flexible because behavior can be assembled from smaller collaborators without creating deep class hierarchies.

Use inheritance when the subtype genuinely satisfies the behavioral contract of its parent. Prefer composition when responsibilities need to vary independently.

---

# 29. Component, Service-Oriented, and Distributed Architecture

## 29.1 Components

A component is an encapsulated unit of functionality that works with other components to form an application. Effective components are:

- reusable;
- replaceable;
- independent;
- extensible;
- encapsulated; and
- usable in more than one context.

Components should expose clear interfaces and hide internal implementation details.

## 29.2 Component-Based Architecture

Component-based architecture decomposes the system into logical, loosely coupled components. It operates at a higher abstraction level than individual classes and objects.

Examples include controllers, reusable APIs, adapters, and data-access components.

## 29.3 Services

A service is a unit of functionality designed to be deployed independently and consumed by one or more clients or systems. Services commonly represent business capabilities such as payment processing, identity verification, or notification delivery.

A service may contain multiple components, and those components may contain multiple objects.

## 29.4 Service-Oriented Architecture

In service-oriented architecture, or SOA, services communicate over a network using defined contracts and protocols. The goal is to create reusable business capabilities that remain loosely coupled from their consumers.

## 29.5 Distributed Systems

A distributed system contains cooperating processes or services running on multiple networked machines while appearing to users as one coherent system.

Typical characteristics include:

- message-based communication;
- concurrent activity;
- resource sharing;
- horizontal scalability;
- heterogeneity of hardware and software;
- partial failure; and
- fault-tolerance mechanisms.

Distributed systems introduce challenges such as network latency, retries, duplicate messages, inconsistent clocks, partial outages, observability, and data consistency. Engineers must assume that remote calls can fail even when local code is correct.

## 29.6 Nodes and Communication

A node is a network-connected device or process capable of recognizing, processing, and transmitting data. Distributed services commonly communicate through protocols such as HTTP, message queues, event streams, or remote procedure calls.

---

# 30. Architectural Patterns, Environments, and Production Infrastructure

## 30.1 Architectural Patterns

An architectural pattern is a reusable approach to a recurring system-design problem. Patterns provide a shared vocabulary and a starting structure, not a complete design.

### Two-tier or client-server

The client provides the interface and requests data or services from a server. This structure is simple but may place substantial responsibility on one server layer.

### Three-tier and n-tier

A three-tier system separates:

1. the presentation tier;
2. the application or business-logic tier; and
3. the data tier.

Additional tiers may be introduced for integration, caching, security, or specialized processing. Separation makes independent scaling and maintenance easier, although it adds operational complexity.

### Peer-to-peer

In a peer-to-peer system, nodes can both provide and consume resources. There is no strict permanent distinction between client and server.

### Event-driven architecture

Event-driven systems contain producers, routers or brokers, and consumers. Producers publish notifications about changes, and interested consumers react asynchronously. This supports loose coupling and scalability but requires careful handling of ordering, retries, duplication, and monitoring.

### Microservices

A microservices architecture divides a system into independently deployable services organized around business capabilities. Services interact through APIs or messaging.

Benefits can include independent deployment, focused ownership, and selective scaling. Costs include distributed transactions, service discovery, operational overhead, network failure, versioned contracts, and more difficult end-to-end testing.

Architectural patterns can sometimes be combined. For example, a three-tier application may use microservices in its application tier and event-driven communication between those services.

## 30.2 Application Environments

An application environment includes all hardware and software required to run the application: code or executables, runtime, libraries, middleware, operating system, networking, compute, memory, and storage.

### Development

The environment where code is actively written and locally evaluated. It may be an individual workstation, a shared development system, or an ephemeral cloud environment.

### QA or testing

An environment used for formal functional, integration, system, performance, and security testing.

### Staging

A pre-production environment designed to resemble production as closely as practical. It supports release validation, deployment rehearsals, and final stakeholder checks.

### Production

The live environment serving real users and business processes. Production must account for load, security, reliability, scalability, monitoring, backup, recovery, and operational support.

Configuration should be managed so that the same build artifact can move through environments while environment-specific values are supplied externally.

## 30.3 Deployment Models

### On-premises

The organization owns or controls the physical infrastructure and is responsible for hardware, networking, maintenance, security, and capacity. This can provide control but typically requires greater capital and operational effort.

### Public cloud

Infrastructure is provided over the internet on shared provider-owned hardware. Public cloud services can offer rapid provisioning, elasticity, and usage-based pricing.

### Private cloud

Cloud infrastructure is dedicated to one organization, either on-premises or hosted by a provider. It can offer customization and control at greater cost and management effort.

### Hybrid cloud

A hybrid model connects private and public environments. It may balance cost, scalability, security, regulation, and legacy-system constraints, but introduces integration and governance complexity.

## 30.4 Common Production Components

### Firewall

A firewall monitors and controls traffic between networks according to security rules. It helps limit unauthorized access but is only one layer of a broader defense-in-depth strategy.

### Load balancer

A load balancer distributes requests across multiple servers to improve availability, responsiveness, and capacity. It can perform health checks and stop routing traffic to unhealthy instances.

### Web server

A web server handles HTTP requests and delivers static content or forwards dynamic requests to application services.

### Application server

An application server executes business logic, coordinates workflows, applies authorization, and communicates with databases or other services.

### Proxy server

A proxy sits between communicating systems. Depending on its role, it may route traffic, terminate encryption, cache responses, filter requests, hide internal topology, or perform load balancing.

### Database server and DBMS

A database server stores and manages application data. A database management system provides controlled access, querying, transactions, indexing, authorization, backup, and recovery capabilities.

### High-availability replicas

Replicas reduce the risk that one server failure makes the service unavailable. Replication must be paired with health checks, failover procedures, and tested recovery plans.

## 30.5 Production Readiness Checklist

Before release, confirm that the system has:

- capacity and load estimates;
- secure configuration and secret management;
- health checks and monitoring;
- centralized logs and useful metrics;
- alerting with clear ownership;
- backup and restoration procedures;
- rollback or roll-forward procedures;
- redundancy for critical components;
- dependency and failure-mode analysis;
- tested deployment automation;
- incident-response guidance; and
- current operational documentation.

---

# 31. End-to-End Project Guideline

This section combines the material into a practical workflow.

## Step 1: Define the problem

- Identify the business need.
- Define the intended users.
- Establish goals and measurable objectives.
- Identify stakeholders.

## Step 2: Elicit and prioritize requirements

- Interview or survey stakeholders.
- Create user stories and use cases.
- Document functional, interface, system, and non-functional requirements.
- Record assumptions, constraints, and dependencies.
- Confirm clarity, consistency, completeness, and feasibility.
- Prioritize must-have, desired, and optional requirements.

## Step 3: Create and approve requirement specifications

- Produce an SRS, URS, SysRS, or an appropriate combined document.
- Define measurable acceptance criteria.
- Gain stakeholder agreement.
- Establish requirement traceability.

## Step 4: Select a development approach

Choose waterfall, V-model, Agile, or a suitable variation based on:

- requirement stability;
- project risk;
- compliance obligations;
- need for feedback;
- release strategy;
- team capability.

## Step 5: Design the solution

- define architecture;
- divide the system into components;
- design user flows and interfaces;
- define APIs and data models;
- plan security and performance;
- create prototypes where useful;
- document decisions and trade-offs.

## Step 6: Plan the implementation

- choose languages, frameworks, and tools;
- assign ownership;
- establish coding standards;
- define source-control and review procedures;
- prepare development and test environments;
- define the initial versioning approach.

## Step 7: Build in small, testable units

- implement focused components;
- write unit tests;
- use linters and automated checks;
- review code;
- use pair programming where beneficial;
- integrate frequently.

## Step 8: Test systematically

- perform unit testing;
- test module integration;
- conduct complete system testing;
- evaluate functional and non-functional requirements;
- run regression tests after changes;
- conduct acceptance testing with stakeholders.

## Step 9: Prepare release documentation

- create or update user guides;
- update technical documentation;
- document known issues;
- prepare deployment and rollback instructions;
- assign a version number;
- confirm test evidence and release criteria.

## Step 10: Release progressively

Where appropriate:

1. alpha release to selected stakeholders;
2. beta release for broader real-world evaluation;
3. GA release for all intended users.

## Step 11: Deploy

- deploy to the target environment;
- verify configuration;
- validate availability and security;
- perform smoke tests;
- monitor early operation;
- be prepared to correct or roll back a failed release.

## Step 12: Maintain and improve

- monitor incidents and reliability;
- fix defects;
- update dependencies and security controls;
- collect user feedback;
- maintain documentation;
- identify enhancements;
- feed new requirements into the next lifecycle iteration.

---

# 32. Study Checklists and Review Questions

## 26.1 Software Engineering Checklist

A learner should be able to:

- define software engineering;
- explain the software crisis;
- describe how engineering practices improved software development;
- distinguish system-level engineering from feature implementation;
- list common software-engineering responsibilities.

## 26.2 SDLC Checklist

A learner should be able to:

- define the SDLC;
- list its six common phases;
- describe the purpose and deliverables of each phase;
- explain why iteration may be necessary;
- identify the advantages of a structured lifecycle.

## 26.3 Requirements Checklist

Before development, verify that:

- stakeholders are identified;
- goals and objectives are clear;
- requirements are documented;
- functional and non-functional requirements are separated;
- constraints, assumptions, and dependencies are recorded;
- requirements are testable;
- requirements are prioritized;
- stakeholders have approved them.

## 26.4 Design Checklist

Verify that the design explains:

- architecture;
- components and boundaries;
- data and database behavior;
- APIs and interactions;
- user-interface behavior;
- performance expectations;
- security considerations;
- platform requirements;
- implementation guidance.

## 26.5 Code Quality Checklist

Verify that code is:

- correct;
- readable;
- maintainable;
- testable;
- secure;
- consistent;
- appropriately documented;
- analyzed by automated tools;
- reviewed by another developer where practical.

## 26.6 Testing Checklist

Verify that:

- test cases map to requirements;
- expected results are explicit;
- units are tested;
- integrations are tested;
- the complete system is tested;
- functional and non-functional behavior is evaluated;
- regression testing follows changes;
- users or stakeholders conduct acceptance testing.

## 26.7 Documentation Checklist

Verify that:

- technical documentation exists;
- user documentation exists;
- QA evidence exists;
- procedures are documented;
- documentation has an owner;
- documentation matches the current version;
- obsolete content has been removed or marked.

## 26.8 Web Development Checklist

A learner should be able to explain:

- browser-to-server communication;
- HTML, CSS, and JavaScript;
- static and dynamic content;
- front-end, back-end, and full-stack development;
- APIs, routes, and endpoints;
- databases and ORMs;
- authentication and authorization;
- responsive and adaptive design.

## 26.9 Review Questions

1. Why did software engineering emerge as a formal discipline?
2. What problems characterized the software crisis?
3. What is the purpose of the SDLC?
4. What is the main deliverable of the planning phase?
5. How does a prototype help requirements gathering?
6. What is the difference between functional and non-functional requirements?
7. How do the SRS, URS, and SysRS differ?
8. How does software design translate requirements into implementation?
9. What is the main difference between sequential and iterative methodologies?
10. Why can Agile respond more easily to changing requirements?
11. What attributes define high-quality code?
12. How do functional, non-functional, and regression testing differ?
13. How do unit, integration, system, and acceptance tests differ?
14. What is the purpose of alpha, beta, and GA releases?
15. What information can a version number communicate?
16. What is backward compatibility?
17. How do product and process documentation differ?
18. Why must documentation be maintained?
19. How do the responsibilities of a product owner differ from those of an architect?
20. How do front-end and back-end systems communicate?
21. What are authentication and authorization?
22. What are the benefits and risks of an ORM?
23. How does responsive design differ from adaptive design?
24. What are the three described pair-programming styles?
25. Under what conditions can pair programming improve overall efficiency?

---

# 33. Glossary

**Acceptance testing** — Formal testing that evaluates whether a system satisfies user needs and business requirements.

**Adaptive design** — A design approach that provides layouts prepared for specific screen sizes or device categories.

**Agile** — An iterative and collaborative approach that delivers software through short development cycles.

**Alpha release** — An early functioning version distributed to selected stakeholders, often with incomplete functionality or known defects.

**API** — Application Programming Interface; a defined mechanism by which software systems exchange data or invoke functionality.

**Architecture** — The high-level structure of a software system, including components, relationships, boundaries, and major technical decisions.

**Authentication** — Verification of a user's or system's identity.

**Authorization** — Determination of what an authenticated user or system is permitted to do.

**Back end** — Server-side software and infrastructure that process requests, apply logic, access data, and provide services.

**Backward compatibility** — The ability of a newer version to continue working with artifacts or systems from older versions.

**Beta release** — A pre-GA version provided to external stakeholders or users for real-world evaluation.

**Black-box testing** — Testing based on inputs and outputs without relying on internal implementation details.

**CASE** — Computer-Aided Software Engineering; tools that support engineering activities such as modeling, development, testing, and project management.

**Client** — Software, commonly a browser or mobile app, that requests data or services from a server.

**Cloud application** — An application designed to use cloud-hosted infrastructure, storage, processing, or services.

**Component** — A defined part of a system with a specific responsibility and interface.

**Constraint** — A condition that limits possible design or implementation choices.

**CSS** — Cascading Style Sheets; the language used to style and lay out webpage content.

**Dependency** — An external system, library, service, platform, or resource required by the software.

**Deployment** — The process of placing software into an environment where it can be used.

**Design document** — A description of how requirements will be implemented through architecture and technical structure.

**Endpoint** — A specific server or API location that receives a request and provides a response.

**Functional requirement** — A description of behavior or capability the software must provide.

**Functional testing** — Testing that evaluates required software functions and input-output behavior.

**Front end** — The client-side user interface and interactions of a website or application.

**Full-stack developer** — A developer able to work with both client-side and server-side technologies.

**GA** — General Availability; the stable release intended for the full target audience.

**Goal** — A broad desired outcome.

**HTML** — Hypertext Markup Language; the structural language of webpages.

**IDE** — Integrated Development Environment; a tool combining code editing with functions such as debugging, building, and source control.

**Integration testing** — Testing of interactions between combined modules or services.

**JavaScript** — A programming language widely used for web interactivity and also for server-side development.

**Linter** — A tool that analyzes code for potential errors, suspicious constructs, or style violations.

**Maintenance** — Post-deployment work including monitoring, fixes, updates, enhancements, and documentation changes.

**MVP** — Minimum Viable Product; a small but usable feature set designed to test assumptions and gather feedback.

**Non-functional requirement** — A quality, performance, security, or operational expectation rather than a specific feature.

**Non-functional testing** — Testing of quality attributes such as performance, security, scalability, and availability.

**Objective** — A specific and measurable action or outcome that supports a goal.

**ORM** — Object-Relational Mapper; a tool that maps application objects to relational database data.

**Pair programming** — A technique in which two developers collaborate on the same implementation task.

**Prototype** — A preliminary representation used to explore, demonstrate, or validate a solution.

**Regression testing** — Testing that checks whether a change has damaged existing behavior.

**Requirement** — A documented need, capability, constraint, or quality condition the solution must satisfy.

**Responsive design** — A design approach in which a layout automatically adjusts to the available screen size.

**Route** — A server-side path that connects an incoming request to application behavior.

**SDLC** — Software Development Life Cycle; a structured process for planning, designing, building, testing, deploying, and maintaining software.

**Server** — A system that receives client requests and returns data or services.

**SOP** — Standard Operating Procedure; detailed organization-specific instructions for completing a process.

**Sprint** — A short Agile development cycle, commonly one to four weeks.

**SRS** — Software Requirements Specification; a document describing required software behavior and quality criteria.

**SysRS** — System Requirements Specification; a broader document covering the requirements of the entire system, including hardware and operational concerns.

**System testing** — Testing of the complete integrated software system.

**Test case** — A defined set of steps, inputs, data, and expected results used to verify behavior.

**Traceability matrix** — A document that maps requirements to tests or other lifecycle artifacts.

**UAT** — User Acceptance Testing; stakeholder or user testing to determine whether the product meets agreed needs.

**Unit testing** — Testing of a small isolated part of the code.

**URS** — User Requirements Specification; a description of business and end-user needs.

**UX** — User Experience; how a user perceives and interacts with a product.

**V-shaped model** — A sequential lifecycle that maps verification stages to corresponding validation stages.

**Versioning** — The practice of identifying and tracking software releases, updates, patches, and builds.

**Waterfall** — A sequential development method in which one phase is completed before the next begins.

**ADR** — Architecture Decision Record; a concise record of a significant design choice, its context, alternatives, and consequences.

**Component** — An encapsulated, reusable unit of functionality with a defined interface.

**Cohesion** — The degree to which the responsibilities within a module belong together.

**Coupling** — The degree of dependency between modules or services.

**Distributed system** — A system whose cooperating parts run on multiple networked computers but present one coherent service.

**Event-driven architecture** — An architecture in which producers publish events and consumers react to them.

**Load balancer** — A component that distributes incoming traffic among multiple servers.

**Microservice** — A small, independently deployable service organized around a business capability.

**OOAD** — Object-Oriented Analysis and Design; analysis and design based on collaborating objects and classes.

**Proxy server** — An intermediary that handles traffic between clients, servers, or system tiers.

**SDD** — Software Design Document; a technical specification describing how a software design should be implemented.

**UML** — Unified Modeling Language; a standardized visual language for representing software structure and behavior.

---

# 34. Todo Application Case Study

This case study consolidates the former `Explanations.md`. It records the reasoning behind the todo application's original implementation and connects the general engineering concepts in this guide to a concrete Nx, React, Express, and MongoDB project.

> **Historical context:** the application has evolved since the original technical exercise. Use the repository README for current behavior and `docs/PLAN.md` for current status, priorities, and acceptance criteria. The decisions below explain the original baseline and should not be mistaken for the current authentication, data model, API contract, or deployment state.

## 34.1 Problem-Solving Sequence

The original implementation followed a dependency-aware order:

1. Inspect the Nx workspace and supplied OpenAPI contract.
2. Create shared TypeScript types used by both applications.
3. Build the backend from models to repositories to controllers.
4. Test each backend layer, followed by full API integration tests.
5. Build reusable frontend elements and feature components.
6. Connect the UI to the API through React Query hooks.
7. Add Cypress coverage for the critical CRUD journeys.
8. Add the original multi-user demonstration and deployment configuration.

This order reduced uncertainty because each layer was built on an already-understood dependency and checked before the next layer was added.

## 34.2 Architecture Decisions

### Nx monorepo

The project used an Nx monorepo containing the React frontend, Express backend, Cypress project, and a shared types library. The main advantages were centralized tooling, consistent configuration, task caching, and direct sharing of TypeScript contracts. Separate repositories would offer stronger deployment isolation, but would add package publishing and cross-repository coordination for a project of this size.

### MongoDB and Mongoose

The original skeleton included MySQL, but the implementation moved to MongoDB to exercise document-database skills and simplify the initial deployment model. Mongoose provided typed schemas and virtual population.

Todos remained separate documents referencing their parent list. A Mongoose virtual populated the list's `todos` field when the nested API representation was required. This avoided duplicating todo data inside list documents and allowed independent todo queries and updates. The trade-off was an additional population step and more care around relationship integrity and cascading deletion.

### Layered Express backend

The original server separated responsibilities into:

```text
HTTP request
    ↓
Controller — request handling and validation
    ↓
Repository — persistence operations
    ↓
Mongoose model — schema and database representation
```

This structure made controller tests possible with mocked repositories and kept database operations out of route handlers. Its limitations were repeated controller `try/catch` blocks, manual dependency wiring, and validation duplicated across trust boundaries. The current plan addresses those weaknesses with shared Zod schemas, dependency injection, guards, pipes, and centralized error handling.

### Shared TypeScript contracts

The `libs/types` library established a compile-time contract between the frontend and backend. This reduced duplicated interfaces and made breaking API changes visible across the workspace. TypeScript types alone do not validate untrusted runtime data, so shared runtime schemas are the necessary complement.

### REST and OpenAPI

The original API used resource-oriented todo and todo-list endpoints and was manually implemented against a supplied Swagger specification. REST kept the CRUD model simple and familiar. Manual implementation offered control but allowed the specification and runtime behavior to drift, which is why generated or runtime-derived OpenAPI is preferable as the application grows.

### Tailwind CSS

Tailwind was selected for rapid UI development and consistent theme usage without introducing a full component framework. Project colors belong in `tailwind.config.js`; components should use theme utilities instead of duplicating raw color constants.

## 34.3 Frontend Design

### Server state with React Query

React Query managed remote todo and list data, including caching, loading and error state, refetching, mutations, and query invalidation. Local React state remained appropriate for temporary UI concerns such as form fields and edit-mode toggles. This separation avoided using a general global-state library for data that primarily belonged to the server.

Custom hooks such as `useTodoListsData` hid query and mutation details from page components. Fetcher functions formed a typed API boundary, while feature components focused on user interaction and rendering.

### Component composition

The original component hierarchy separated reusable elements—buttons, inputs, text, loaders, containers, and error fallbacks—from todo-specific forms, cards, and list views. Feature components composed the primitives instead of duplicating their styling and behavior.

Inline editing was chosen for quick task updates without navigation or modal state. Controlled forms were initially sufficient for the small input surface; more complex cross-field validation justifies React Hook Form with shared Zod schemas.

### User feedback

Loading indicators, empty states, disabled submission controls, and error fallbacks made asynchronous behavior visible. A production-quality evolution should also provide retry actions, accessible status announcements, optimistic rollback, and error messages appropriate to the failure type.

## 34.4 Testing Strategy

The project used complementary test levels rather than relying on a single suite:

- **Model and unit tests** checked schema behavior and isolated controller logic quickly.
- **Integration tests** exercised Express routes, repositories, Mongoose, and response serialization together.
- **Cypress E2E tests** checked critical user workflows in a browser.

`mongodb-memory-server` provided an isolated MongoDB process for integration tests. It exercised real Mongoose queries without risking development data and made teardown deterministic. Controller unit tests still mocked repositories where the purpose was to isolate HTTP and validation logic.

Supertest used the Express application without binding a fixed public port. This avoided port conflicts and allowed the full middleware and routing stack to be exercised in-process.

The E2E suite used stable test attributes and a page-object helper. Direct selectors remained in some tests during rapid debugging, which reduced the benefit of the abstraction. New tests should prefer accessible roles and labels for user-facing behavior, reserving test IDs for cases with no stable semantic selector.

Test cleanup was designed to leave each scenario independent. Because deleting a parent list changes the DOM, cleanup re-queried after each deletion rather than iterating over a stale collection. API-level setup and cleanup is generally faster and less brittle when the UI behavior itself is not under test.

Meaningful coverage matters more than a nominal 100% target. Priority cases include successful CRUD, validation failures, unauthorized access, missing resources, empty states, network/server errors, relationship cleanup, and the main authenticated workflow.

## 34.5 Deployment and Configuration Lessons

The initial deployment shape used a separately hosted frontend and backend, with MongoDB and environment-specific configuration. Its durable lessons are:

- keep secrets out of source control;
- document every required environment variable;
- restrict CORS to known production origins;
- build and test locally before deployment;
- expose health and readiness information;
- keep deployment configuration reproducible;
- use monitoring, redacted structured logs, and rollback procedures.

Development convenience, such as permissive CORS or fallback URLs, must not silently become the production security policy.

## 34.6 Important Trade-offs and Lessons

### Speed versus polish

The exercise prioritized a working, testable vertical slice. Tailwind, React Query, Nx generators, and a simple layered backend accelerated delivery. The cost was incomplete UI testing, some repeated error handling, and architectural choices that required later hardening.

### Database migration

Moving from MySQL to MongoDB demonstrated adaptability but introduced new relationship and data-integrity decisions. A technology should normally be selected from access patterns, consistency needs, operational constraints, and team expertise—not solely because it is desirable on a résumé.

### E2E reliability

An edit flow worked manually but was difficult to stabilize in Cypress. The right response is to diagnose timing, network, focus, and cache behavior; use retryable assertions; and keep the limitation visible until the deterministic test passes. Arbitrary waits only hide the race and make the suite slower.

### Historical multi-user approach

The first exercise distinguished users through numeric URL/query values. That was a demonstration mechanism, not authentication or authorization: a caller could choose another identifier. The current application uses Firebase Authentication and server-enforced ownership. This distinction is an important interview lesson—filtering by a client-supplied user ID is not a security boundary.

## 34.7 Production Evolution Checklist

The most important production improvements identified by the original retrospective were:

- enforce authentication and server-side authorization;
- add shared runtime validation and bounded pagination;
- index common ownership and relationship queries;
- centralize API errors and add structured, redacted logging;
- restrict CORS, add security headers, and rate-limit sensitive routes;
- add frontend component and hook tests;
- make critical E2E flows deterministic and part of CI;
- support responsive and keyboard-accessible interactions;
- add monitoring, dependency scanning, backup awareness, and safe rollback;
- measure performance before adding caches or distributed infrastructure.

The detailed implementation sequence and measurable acceptance criteria live in `docs/PLAN.md`.

## 34.8 Interview Discussion Prompts

Use these prompts to explain reasoning rather than memorizing answers:

1. Why was an Nx monorepo suitable, and when would separate repositories be better?
2. Why were todos referenced instead of embedded, and what access patterns could reverse that decision?
3. How did controller, repository, and model boundaries improve testability?
4. What does a shared TypeScript library guarantee, and what requires runtime validation?
5. Why is React Query a better fit for server state than Redux in this application?
6. What belongs in local component state versus the query cache?
7. What different failures are caught by unit, integration, and E2E tests?
8. Why use an in-memory MongoDB process instead of mocking every persistence call?
9. Why is a user ID in a URL not authentication or authorization?
10. How would cursor pagination, indexes, object storage, and rate limiting change scalability?
11. Which historical shortcuts were reasonable for a time-boxed exercise, and which would block production release?
12. What evidence—tests, metrics, API documentation, or ADRs—supports each architectural claim?

## 34.9 Local Runbook

The current README is authoritative for setup. The common commands are:

```bash
npm install
npm run docker:mongodb
npm run emulator
npm run serve:be
npm run serve:fe
```

The repository also provides `npm run all` for the documented combined local workflow. Run lint, typecheck, unit/integration tests, affected production builds, and the critical E2E smoke flow before deployment or commit review.

---

## 34.10 Frontend Testing Concepts Added in Phase 2

### React Testing Library

React Testing Library renders components as users experience them. Tests query accessible roles, labels, and visible text instead of component internals, keeping them focused on behavior and accessibility.

### `@testing-library/user-event`

`user-event` simulates realistic typing, clicking, keyboard navigation, and file uploads. It runs in Jest and JSDOM, so it is faster than browser E2E testing while exercising realistic event sequences.

### MSW (Mock Service Worker)

MSW intercepts HTTP requests at the network boundary and returns controlled responses. The frontend uses its real API client and query code, while tests can model success, empty data, authorization failures, and server errors without a running backend or implementation-level fetcher mocks.

### Jest setup and coverage

`apps/todo/src/test-setup.js` loads `jest-dom` matchers, supplies stable translation output, and provides browser APIs missing from JSDOM. `apps/todo/src/app/mocks/handlers.ts` defines reusable API responses and `server.ts` creates the MSW server.

`apps/todo/jest.config.ts` collects coverage for the tested frontend components and store and requires at least 70% statement, line, and function coverage, with a 50% branch threshold. CI runs the coverage-enabled Nx test command so regressions fail automatically.

These are component and unit-level tests, not E2E tests. They run quickly without a real browser or deployed services; E2E tests remain responsible for validating the complete application, routing, backend, and infrastructure together.

---

## 34.11 Backend Architecture Concepts Added in Phase 3

### Modules

A Nest `@Module` declares a cohesive unit of controllers, providers, and imports. `AppModule` composes feature modules (`AuthModule`, `TodolistModule`, `TodoModule`, `UserModule`) instead of one file wiring every route and dependency by hand.

### Constructor dependency injection

Controllers and services declare what they need in their constructor; Nest's injector resolves and supplies it. This replaces manually imported singleton repositories and makes substituting a test double as simple as overriding a provider in a testing module.

### Guards

A guard implements `CanActivate` and runs before a route handler to decide whether the request may proceed. `FirebaseTokenGuard` verifies a bearer token; `FirebaseAuthGuard` additionally resolves the MongoDB profile and enforces that the authenticated user matches the requested path. Guards replace ad hoc Express middleware chains with a declarative, testable authorization boundary.

### Custom parameter decorators

`@CurrentUser()` reads the authenticated principal that a guard attached to the request. Handlers receive a typed value instead of casting or reaching into the raw Express request object.

### Pipes

A pipe transforms or validates a single argument before it reaches a handler. `ZodValidationPipe` parses request bodies against the shared Zod schemas from `libs/types`, and `MongoIdPipe` validates route-parameter identifiers, both returning the established client-error shape on failure. Pipes keep validation at the HTTP boundary instead of duplicated inside each controller method.

### Exception filters

A global `HttpExceptionFilter` catches thrown errors once, for every route, and converts them into the application's established response shape. This removed repeated per-controller `try/catch` blocks without changing the observable status codes or bodies clients already depended on.

### Injected Mongoose models

`@InjectModel(TOKEN)` supplies a service with its Mongoose model through `MongooseModule.forFeature`, rather than importing a module-level singleton. This keeps persistence testable through Nest's testing module and avoids duplicate model registration across the application and its tests.

### Nest testing modules

`Test.createTestingModule` assembles a real dependency graph — or one with overridden providers, such as a mocked Firebase Admin app — for both isolated unit tests and full Supertest-driven integration tests. The same technique proved guard, pipe, and cross-user authorization behavior without bypassing the HTTP layer.

### Strangler migration

The backend adopted Nest incrementally: a Nest-first host was established, then each feature area (auth, todo lists, todos, users/statistics) was migrated behind the same routes while an Express fallback still carried unmigrated traffic. Only after every route was proven equivalent were the legacy controllers, middleware, repositories, and the fallback router removed. This pattern lets a live API keep serving traffic throughout a rewrite instead of requiring a single high-risk cutover.

### Generated OpenAPI documentation

`@nestjs/swagger` builds the OpenAPI document from the running application's decorated controllers rather than from a hand-maintained YAML file. A test comparing the generated method/path set against the documented API operations catches drift automatically instead of relying on someone remembering to update a separate spec file.

# 35. Source Files

This guide was created from the following supplied transcript files:

- `subtitle (2).txt` — What Is Software Engineering?
- `subtitle (3).txt` — Introduction to the Software Development Life Cycle
- `subtitle (4).txt` — Phases of the Software Development Life Cycle
- `subtitle (5).txt` — Building Quality Software
- `subtitle (6).txt` — Requirements
- `subtitle (7).txt` — Software Development Methodologies
- `subtitle (8).txt` — Software Versions
- `subtitle (9).txt` — Software Testing
- `subtitle (10).txt` — Software Documentation
- `subtitle (11).txt` — Roles in Software Engineering Projects
- `subtitle (12).txt` — Overview of Web and Cloud Development
- `subtitle (13).txt` — Front-End Development
- `subtitle (14).txt` — Importance of Back-End Development
- `subtitle (15).txt` — Pair Programming

---

## Additional Source Transcripts Incorporated

- Pair programming (duplicate/reinforcing transcript)
- Application development tools: version control, libraries, and frameworks
- CI/CD, build tools, packages, and package managers
- Software stacks
- Practitioner viewpoints on development tools and technologies
- Interpreted and compiled languages
- Query and assembly languages
- Code organization with flowcharts and pseudocode
- Practitioner viewpoints on language paradigms
- Branching and looping logic
- Identifiers, constants, variables, arrays, and vectors

- Programming concepts: functions and objects
- Introduction to software architecture
- Software design, behavioral modeling, and UML
- Object-oriented analysis and design
- Component-based, service-oriented, and distributed architecture
- Architectural patterns
- Application deployment environments
- Production deployment components

## Final Learning Summary

Software engineering is a disciplined, collaborative method of creating and maintaining software systems. The work begins with a clear understanding of users and business needs, continues through requirements, design, implementation, and systematic testing, and extends into deployment, maintenance, documentation, and continuous improvement.

A capable software professional does more than write working code. They contribute to reliable processes, communicate with stakeholders, understand system structure, test assumptions, protect quality and security, document the product, and adapt to changing needs and technologies.
