// lib/core/sample-data.ts
import { StudidexState } from "./types";

export const INITIAL_STUDIDEX_STATE: StudidexState = {
    version: 1,
    lastUpdated: "2026-10-08T14:00:00.000Z",
    profile: {
        name: "Alex",
        stage: "ug",
        className: "Semester 3",
        degree: "B.A. (Hons)",
        examiningBody: "University of Calcutta",
        board: "University of Calcutta",
        medium: "English",
        institutionName: "Presidency University",
        center: "Main Campus",
        stream: "Humanities & Social Sciences",
        specialization: "Political Science",
        minorSpecialization: "Economics",
        enrolledSubjectIds: [
            "subj_political-science",
            "subj_economics",
            "subj_english",
        ],
        papers: [
            {
                id: "paper_cc5",
                name: "CC-5: Comparative Politics & Government",
                code: "POL-CC-301",
                category: "CC",
                semester: "Semester 3",
            },
            {
                id: "paper_sec",
                name: "SEC-1: Panchayati Raj in Practice",
                code: "POL-SEC-A-1",
                category: "SEC",
                semester: "Semester 3",
            },
            {
                id: "paper_ge3",
                name: "GE-3: Introductory Macroeconomics",
                code: "ECO-GE-301",
                category: "GE",
                semester: "Semester 3",
            },
        ],
        hasCompletedOnboarding: false,
    },
    subjects: [
        {
            id: "subj_political-science",
            name: "Political Science",
            code: "POL101",
            description: "Introduction to Political Theory & Modern Institutions",
            createdAt: "2026-09-01T09:00:00.000Z",
        },
        {
            id: "subj_economics",
            name: "Economics",
            code: "ECO201",
            description: "Principles of Microeconomics & Market Dynamics",
            createdAt: "2026-09-01T09:00:00.000Z",
        },
        {
            id: "subj_english",
            name: "English Literature",
            code: "ENG105",
            description: "Critical Reading, Rhetoric & Modern British Drama",
            createdAt: "2026-09-01T09:00:00.000Z",
        },
    ],
    topics: [
        {
            id: "top_pol_theory",
            subjectId: "subj_political-science",
            name: "Political Theory",
            unit: "Module 1",
            description: "Foundational conceptual frameworks in governance",
            order: 1,
            progressPercent: 75,
        },
        {
            id: "top_pol_liberty",
            subjectId: "subj_political-science",
            name: "Liberty",
            unit: "Unit 1",
            description: "Negative vs Positive liberty, Isaiah Berlin, autonomy",
            order: 2,
            progressPercent: 80,
        },
        {
            id: "top_pol_equality",
            subjectId: "subj_political-science",
            name: "Equality",
            unit: "Unit 2",
            description: "Equality of opportunity, outcome, complex equality",
            order: 3,
            progressPercent: 60,
        },
        {
            id: "top_pol_justice",
            subjectId: "subj_political-science",
            name: "Justice",
            unit: "Unit 3",
            description: "John Rawls' A Theory of Justice, Nozick's entitlement",
            order: 4,
            progressPercent: 20,
        },
        {
            id: "top_eco_consumer",
            subjectId: "subj_economics",
            name: "Consumer Theory",
            unit: "Unit 1",
            description: "Utility maximization, indifference curves, budget lines",
            order: 1,
            progressPercent: 85,
        },
        {
            id: "top_eco_elasticity",
            subjectId: "subj_economics",
            name: "Elasticity of Demand",
            unit: "Unit 2",
            description: "Price, income, and cross elasticity calculations",
            order: 2,
            progressPercent: 40,
        },
    ],
    inputs: [
        {
            id: "inp_dept_notice_1",
            type: "message",
            source: {
                type: "department",
                name: "Political Science Department",
            },
            content:
                "Political Science internal test on 15 October, Units 1–2, 20 marks. Liberty assignment due the same day in room 204.",
            createdAt: "2026-10-06T11:20:00.000Z",
        },
        {
            id: "inp_exam_branch_2",
            type: "message",
            source: {
                type: "university",
                name: "University Examination Branch",
            },
            content:
                "NOTICE: Revised schedule for Autumn Semester End Term. Political Science Paper POL101 originally scheduled on 18 Oct has been rescheduled to 21 Oct at 09:30 AM due to state municipal elections.",
            createdAt: "2026-10-07T16:45:00.000Z",
        },
        {
            id: "inp_fellowship_3",
            type: "link",
            source: {
                type: "web",
                name: "National Higher Education Council",
            },
            content:
                "National Merit Academic Fellowship 2026-27: Applications open for undergraduate & postgraduate research scholars. Monthly stipend ₹18,000. Last date to apply: 25 October 2026.",
            createdAt: "2026-10-05T14:10:00.000Z",
        },
    ],
    items: [
        // TODAY'S CLASS
        {
            id: "item_today_pol_class",
            type: "event",
            eventType: "class",
            title: "Political Science Lecture",
            description: "Lecture on Democratic Institutions & Constitutionalism with Dr. S. Rao",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_theory"],
            startAt: "2026-10-08T10:00:00.000Z",
            endAt: "2026-10-08T11:30:00.000Z",
            priority: "normal",
            status: "active",
            metadata: {
                room: "Room 204, Arts Block",
            },
        },
        // TODAY'S ACTION (DUE TODAY)
        {
            id: "item_due_eco_assignment",
            type: "action",
            actionType: "assignment",
            title: "Economics Assignment",
            description: "Submit problem set 3 on Consumer Equilibrium in class",
            subjectId: "subj_economics",
            topicIds: ["top_eco_consumer"],
            dueAt: "2026-10-08T14:00:00.000Z",
            priority: "urgent",
            status: "active",
            metadata: {
                room: "Tutorial Room B-12",
                submissionType: "Physical hardcopy",
            },
        },
        // UPCOMING INTERNAL TEST (EVENT)
        {
            id: "item_pol_internal_test",
            type: "event",
            eventType: "test",
            title: "Political Science Internal Test",
            description: "Covers Units 1 & 2 (Liberty and Equality). 20 marks test.",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_liberty", "top_pol_equality"],
            inputId: "inp_dept_notice_1",
            startAt: "2026-10-15T10:00:00.000Z",
            endAt: "2026-10-15T11:00:00.000Z",
            priority: "high",
            status: "active",
            metadata: {
                marks: 20,
                units: "Units 1–2",
                room: "Room 204",
            },
        },
        // UPCOMING ASSIGNMENT (DUE ON SAME DAY AS TEST)
        {
            id: "item_liberty_assignment",
            type: "action",
            actionType: "assignment",
            title: "Liberty Assignment",
            description: "Critical essay: 'Does Isaiah Berlin's negative liberty account for social capability?'",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_liberty"],
            inputId: "inp_dept_notice_1",
            dueAt: "2026-10-15T17:00:00.000Z",
            priority: "high",
            status: "active",
            relatedItemIds: ["item_pol_internal_test"],
            metadata: {
                room: "Room 204 or submit via portal",
                checklist: [
                    { id: "c1", text: "Outline main thesis on Berlin vs Sen", done: true },
                    { id: "c2", text: "Draft comparison section", done: false },
                    { id: "c3", text: "Format bibliography and citations", done: false },
                ],
            },
        },
        // PREPARATION ACTION (PREPARES FOR INTERNAL TEST)
        {
            id: "item_prepare_pol_units",
            type: "action",
            actionType: "preparation",
            title: "Prepare Political Science Units 1–2",
            description: "Review notes on Liberty, revise Equality handouts, attempt 1 mock test",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_liberty", "top_pol_equality"],
            dueAt: "2026-10-14T20:00:00.000Z",
            priority: "high",
            status: "active",
            preparesForItemId: "item_pol_internal_test",
        },
        // IMPORTANT RECENT UPDATE (SCHEDULE CHANGED)
        {
            id: "item_update_exam_schedule",
            type: "update",
            updateType: "change",
            title: "Exam schedule changed",
            description: "Political Science Autumn Exam POL101 rescheduled by University Exam Branch",
            subjectId: "subj_political-science",
            inputId: "inp_exam_branch_2",
            priority: "high",
            status: "active",
            metadata: {
                changeDiff: {
                    from: "18 Oct 2026",
                    to: "21 Oct 2026",
                },
            },
        },
        // RESCHEDULED EXAM EVENT (LINKED TO UPDATE)
        {
            id: "item_pol_final_exam",
            type: "event",
            eventType: "exam",
            title: "Political Science Semester Exam",
            description: "End-Term Examination: Full syllabus (Units 1–4). 100 marks.",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_liberty", "top_pol_equality", "top_pol_justice"],
            inputId: "inp_exam_branch_2",
            startAt: "2026-10-21T09:30:00.000Z",
            endAt: "2026-10-21T12:30:00.000Z",
            priority: "high",
            status: "active",
            metadata: {
                marks: 100,
                room: "Main Examination Hall A",
            },
        },
        // ACADEMIC OPPORTUNITY
        {
            id: "item_fellowship_opportunity",
            type: "opportunity",
            opportunityType: "fellowship",
            title: "National Merit Academic Fellowship",
            description: "Undergraduate & postgraduate research fellowship with monthly stipend",
            inputId: "inp_fellowship_3",
            dueAt: "2026-10-25T23:59:00.000Z",
            priority: "normal",
            status: "active",
            metadata: {
                amount: "₹18,000 / month",
                eligibility: "Minimum 65% aggregate in preceding academic year",
                link: "https://example.edu/fellowship-apply",
            },
        },
        // ACTION LINKED TO OPPORTUNITY
        {
            id: "item_apply_fellowship",
            type: "action",
            actionType: "application",
            title: "Apply for National Merit Fellowship",
            description: "Collect recommendation letter from HoD and submit statement of purpose",
            dueAt: "2026-10-24T18:00:00.000Z",
            priority: "normal",
            status: "active",
            relatedItemIds: ["item_fellowship_opportunity"],
        },
        // COMPLETED ACTION (FOR ACTIONS GROUPING / COMPLETED STATE)
        {
            id: "item_completed_reading",
            type: "action",
            actionType: "study",
            title: "Read Chapter 1: Introduction to Ideology",
            description: "Completed textbook reading and summary margins",
            subjectId: "subj_political-science",
            dueAt: "2026-10-05T18:00:00.000Z",
            priority: "low",
            status: "completed",
            completedAt: "2026-10-05T17:30:00.000Z",
        },
    ],
    materials: [
        {
            id: "mat_pol_personal_notes",
            type: "note",
            title: "Class Notes: Two Concepts of Liberty",
            description: "Personal breakdown of Isaiah Berlin's 1958 lecture. Negative vs positive liberty boundaries.",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_liberty"],
            origin: "personal",
            content: `# Two Concepts of Liberty (Isaiah Berlin)

## 1. Negative Liberty
* Core definition: The absence of external obstacles, barriers, or deliberate human interference.
* Fundamental question: *"Over what area is the subject — a person or group — left to do or be what he is able to do or be, without interference by other persons?"*
* Key advocates: Thomas Hobbes, John Locke, J.S. Mill.
* Criticism: Focuses only on non-interference; ignores real material capacity (poverty, inequality).

## 2. Positive Liberty
* Core definition: The capacity or power to act upon one's fundamental potential and be one's own master (*self-realization*).
* Fundamental question: *"What, or who, is the source of control or interference that can determine someone to do, or be, this rather than that?"*
* Vulnerability: Can be co-opted by totalitarian regimes claiming to represent an individual's "higher" rational self against their empirical desires.`,
            metadata: {
                unit: "Unit 1",
            },
        },
        {
            id: "mat_pol_handout",
            type: "handout",
            title: "Dr. Sharma's Lecture Handout: Rawlsian Justice",
            description: "Original position, veil of ignorance, and the difference principle explained with case studies.",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_justice"],
            origin: "teacher",
            content: `### Principles of Justice (John Rawls - 1971)

1. **Equal Liberty Principle**: Each person has an equal right to the most extensive scheme of equal basic liberties.
2. **Social and Economic Inequalities must satisfy two conditions**:
   a. **Fair Equality of Opportunity**: Offices and positions must be open to all under conditions of fair equality of opportunity.
   b. **Difference Principle**: Inequalities are justified only if they work to the greatest benefit of the least-advantaged members of society.`,
            metadata: {
                unit: "Unit 3",
                author: "Dr. K. Sharma",
            },
        },
        {
            id: "mat_pol_syllabus",
            type: "syllabus",
            title: "POL101 Course Blueprint & Unit Syllabus",
            description: "Official university approved curriculum, reading list, and weightage distribution.",
            subjectId: "subj_political-science",
            origin: "college",
            content: `**Unit 1: Liberty (25% Weightage)**
- Conceptions of freedom; negative vs positive liberty.
- Key texts: Isaiah Berlin, J.S. Mill (On Liberty).

**Unit 2: Equality (25% Weightage)**
- Equality of opportunities vs outcomes; Ronald Dworkin.
- Affirmative action & egalitarian critiques.

**Unit 3: Justice (30% Weightage)**
- Procedural vs distributive justice; Rawls & Nozick.

**Unit 4: Rights & Democratic Obligation (20% Weightage)**`,
            metadata: {
                year: "2026-2027",
            },
        },
        {
            id: "mat_pol_pyq",
            type: "pyq",
            title: "Previous Years Questions (2021–2025): Units 1 & 2",
            description: "Compiled departmental PYQ set with model question weightages and repeat frequency indicators.",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_liberty", "top_pol_equality"],
            origin: "library",
            content: `1. (2024 · 10 marks) Distinguish between negative and positive liberty. Why was Isaiah Berlin cautious of the positive formulation?
2. (2023 · 10 marks) "Equality of opportunity without equality of conditions is an illusion." Critically evaluate.
3. (2022 · 5 marks) Write short notes on: (a) Veil of Ignorance (b) Formal vs substantive equality.
4. (2021 · 10 marks) Assess whether freedom and equality are contradictory ideals or mutually reinforcing.`,
            metadata: {
                term: "Autumn End-Term Archive",
            },
        },
        {
            id: "mat_pol_mock_test_1",
            type: "mock_test",
            title: "POL101 Units 1 & 2 Practice Mock Test",
            description: "Timed 4-question preparation test for the upcoming 15 Oct Internal Test. 20 marks.",
            subjectId: "subj_political-science",
            topicIds: ["top_pol_liberty", "top_pol_equality"],
            origin: "system",
            testData: {
                durationMinutes: 20,
                totalMarks: 20,
                questions: [
                    {
                        id: "q1",
                        question: "According to Isaiah Berlin, what defines 'negative liberty'?",
                        options: [
                            "The capacity of an individual to achieve self-realization through state support",
                            "The absence of external obstacles or deliberate human interference",
                            "The duty of citizens to participate actively in democratic legislation",
                            "The equal distribution of economic resources across social classes",
                        ],
                        correctAnswerIndex: 1,
                        explanation:
                            "Negative liberty strictly concerns the area within which a person can act unobstructed by others. It answers 'How wide is the area of non-interference?'",
                        marks: 5,
                    },
                    {
                        id: "q2",
                        question: "Why did Berlin express philosophical caution towards 'positive liberty'?",
                        options: [
                            "He believed freedom cannot exist in any form of society",
                            "He argued it could be manipulated by authoritarian regimes invoking a 'higher rational self'",
                            "He maintained that economic liberty must supersede political liberty",
                            "He thought positive liberty was strictly limited to religious doctrine",
                        ],
                        correctAnswerIndex: 1,
                        explanation:
                            "Berlin warned that positive liberty could lead to tyranny when an authority claims to understand a citizen's 'real' rational interest better than they do themselves.",
                        marks: 5,
                    },
                    {
                        id: "q3",
                        question: "In egalitarian political theory, what characterizes 'Fair Equality of Opportunity'?",
                        options: [
                            "Treating every applicant identical regardless of systemic starting barriers",
                            "Ensuring individuals with similar natural talents and willingness have equal prospects of success",
                            "Random lottery allocation of public office positions",
                            "Complete equality of financial outcomes regardless of effort",
                        ],
                        correctAnswerIndex: 1,
                        explanation:
                            "Fair equality of opportunity requires that positions are not merely formally open, but that all persons with similar abilities have equal chances to acquire them.",
                        marks: 5,
                    },
                    {
                        id: "q4",
                        question: "Which thinker formulated the distinction between 'equality of resources' and 'equality of welfare'?",
                        options: [
                            "Ronald Dworkin",
                            "Thomas Hobbes",
                            "Adam Smith",
                            "Jeremy Bentham",
                        ],
                        correctAnswerIndex: 0,
                        explanation:
                            "Ronald Dworkin developed the seminal theory of equality of resources, using the hypothetical desert island auction and insurance scheme.",
                        marks: 5,
                    },
                ],
            },
            userProgress: {
                completed: false,
                attempts: [],
            },
            metadata: {
                marks: 20,
                units: "Units 1–2",
            },
        },
        {
            id: "mat_eco_summary",
            type: "note",
            title: "Microeconomics: Elasticity of Demand Quick Reference",
            description: "Formulae for price elasticity, cross elasticity, and point-elasticity diagrams.",
            subjectId: "subj_economics",
            topicIds: ["top_eco_elasticity"],
            origin: "personal",
            content: `### Price Elasticity of Demand (Ped)

Formula:
$$Ped = \\frac{\\% \\Delta Q_d}{\\% \\Delta P}$$

* **|Ped| > 1**: Elastic (luxury goods, many substitutes)
* **|Ped| = 1**: Unitary elasticity (total revenue is maximized)
* **|Ped| < 1**: Inelastic (necessities, lack of direct substitutes)

### Cross-Price Elasticity ($E_{xy}$):
* Positive ($>0$): Substitutes (e.g. Tea and Coffee)
* Negative ($<0$): Complements (e.g. Printers and Ink)`,
            metadata: {
                unit: "Unit 2",
            },
        },
    ],
};
