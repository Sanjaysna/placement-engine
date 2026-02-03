# 🚀 Placement Engine: Full-Stack Prep Automation

A serverless, automated prep system designed to help students master DSA and Aptitude for the TCS NQT (Ninja/Digital/Prime) exams.

## 🛠️ The Tech Stack
- **Frontend:** HTML5, Tailwind CSS (Hosted via Google Apps Script Web App)
- **Backend:** Google Apps Script (JavaScript / Vercel-style Serverless Functions)
- **Database:** Google Sheets API (Persistence Layer)
- **Automation:** Time-driven Cron Triggers (8:00 AM Daily Dispatch)

## ⚙️ Key Features
- **Dynamic Landing Page:** Users can subscribe via a modern UI.
- **Analytics Engine:** Tracks "Solved/Failed" status via URL parameters and calculates real-time accuracy.
- **Automated Dispatch:** Sends 4 curated questions every morning based on user progress.
- **Data Pipeline:** Seamlessly imports structured CSV question banks.

## 📂 Project Structure
- `/src`: Contains the core GAS logic and the Tailwind-powered frontend.
- `/data`: Sample CSV question banks used to seed the database.

## 🚀 How it Works
1. A user signs up on the **Landing Page**.
2. Their email is stored in the **Cloud Database (Google Sheets)**.
3. Every morning, a **Serverless Trigger** executes `sendDailyPrepEmail()`.
4. The system calculates the user's current day and accuracy before dispatching a custom HTML email.