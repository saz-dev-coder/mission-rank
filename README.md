# Mission Rank

> A smart study planner for Indian competitive-exam aspirants.

Mission Rank helps students preparing for **SSC CGL, SSC CHSL, Railway, Banking, GATE, and similar exams** plan daily tasks, track focused study time, complete study targets, manage revisions, and recover missed work.

🌐 **Live Demo:** https://mission-rank-gamma.vercel.app/

---

## Features

- Personalised daily and weekly study planner
- Tasks linked with exam, subject, topic, and priority
- Timed tasks with start time and end time
- Study availability blocks
- Focus timer with hours, minutes, and seconds
- Pause, resume, and session-ending alarm
- Task targets such as:
  - Vocabulary words
  - Practice questions
  - Previous-year questions
  - Revision topics
  - Mock tests
- Partial task completion and carry-forward option
- Daily execution score out of 100
- Subject and topic progress tracking
- Revision task reminders
- Overdue task recovery planning
- Dark mode, light mode, and reduced-motion support
- Local browser storage with export/import backup

---

## Example Task

```text
Exam: SSC CGL
Subject: Quantitative Aptitude
Topic: Percentage → Profit and Loss
Task Type: Previous Year Questions

Target: 40 questions
Planned Time: 45 minutes
Priority: Must do
```

---

## Tech Stack

| Area | Technology |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Animations | CSS / Framer Motion |
| Storage | Browser localStorage |
| Focus Timer | JavaScript `Date.now()` + `setInterval()` |
| Alarm | Web Audio API |
| Charts | SVG / Recharts |
| Hosting | Vercel |
| App Development | Google AI Studio |

---

## Run Locally

```bash
git clone https://github.com/saz-dev-coder/mission-rank.git
cd mission-rank
npm install
npm run dev
```

Then open the local URL shown in your terminal.

Usually it will be:

```text
http://localhost:5173
```

---

## Current Limitations

- Student data is stored in browser localStorage.
- Data does not automatically sync between devices.
- Clearing browser data can remove saved tasks.
- Browser alarms and notifications may not work if the browser is fully closed.
- The daily score measures study execution, not exam rank or selection chance.
- This project does not guarantee marks, rank, government-job selection, or exam success.

---

## Future Improvements

- Firebase login and cloud sync
- Secure user accounts
- Push notifications
- Hindi and Hinglish language support
- More syllabus templates for different exams
- Topic-level revision planning
- Mock-test performance analytics
- Better weak-topic recommendations
- Custom domain

---

## Screenshots

<img width="959" height="445" alt="image" src="https://github.com/user-attachments/assets/fdd5318c-0e56-40b2-bd5f-b18eb4ffd945" />

## Author

**Saz Jani**  
Computer Science Engineering Student | Gujarat Technological University

- GitHub:(https://github.com/saz-dev-coder)

---

> Mission Rank is a portfolio project built to help competitive-exam aspirants plan, study, revise, and recover from missed tasks.
