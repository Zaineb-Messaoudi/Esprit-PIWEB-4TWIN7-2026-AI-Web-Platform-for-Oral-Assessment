# AI-Supported Web Platform for Oral Performance Assessment

A full-stack web platform integrating AI-based speech and video analysis into structured academic oral evaluation workflows.

The system combines rubric-based grading with automated analytics while preserving instructor authority (human-in-the-loop).

---

## 🚀 Features

- JWT-based authentication (Student / Instructor / Admin)
- Audio & video submission (MP3, WAV, MP4, AVI)
- WebRTC instructor recording
- AI-powered speech analysis:
  - Speech rate (WPM)
  - Pause detection
  - Filler words
  - Pronunciation scoring
  - Confidence & emotion analysis
  - Body language analysis
- Customizable grading rubrics
- Instructor override of AI suggestions
- Longitudinal performance tracking
- Class-level analytics dashboards
- Student discussion forum
- Email notification system
- WCAG 2.1 Level AA accessibility compliance

---

## 🛠 Tech Stack

### Frontend
- React 18
- JavaScript
- Redux Toolkit / Context API
- Tailwind CSS
- Axios
- WebRTC

### Backend
- NestJS (Node.js)
- Express
- JWT + Passport
- Swagger (OpenAPI)

### AI Service
- Python
- Speech-to-Text (Google STT / Whisper)
- NLP & acoustic feature extraction
- Emotion & confidence scoring

### Database
- MongoDB
- Mongoose ODM
- GridFS (file storage)

### DevOps
- Docker
- Docker Compose
- GitHub Actions
- Git
- Jenkins
