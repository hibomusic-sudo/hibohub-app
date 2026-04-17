
# Hibo Hub | Official Deployment Guide

This is your professional Somali AI Music and Video creation app. Follow these steps to publish it officially.

## 1. Local Setup
- Download the code.
- Run `npm install`.
- Set up your `.env` file with `GEMINI_API_KEY`.

## 2. GitHub Integration
To connect your project to GitHub:
1. Create a new repository on [GitHub](https://github.com/new).
2. Run these commands in your terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Hibo Hub"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

## 3. Official Publication (Firebase App Hosting)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project.
3. Navigate to **Build > App Hosting**.
4. Click **Get Started** and connect your GitHub repository.
5. **CRITICAL:** Grant access to your GEMINI_API_KEY secret:
   ```bash
   firebase apphosting:secrets:grantaccess GEMINI_API_KEY
   ```

## 4. Custom Domain
In the App Hosting dashboard, you can click "Connect Domain" to link your official website (e.g., `www.hibohub.com`).

Congratulations on launching Hibo Hub!
