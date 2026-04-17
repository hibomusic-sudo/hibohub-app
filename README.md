
# Hibo Hub | Official Deployment Guide

This is your professional Somali AI Music and Video creation app. Follow these steps to publish it officially and connect it to your GitHub.

## 1. GitHub Integration (Connect your code)
To connect your project to GitHub and keep it updated:
1. Create a new repository on [GitHub](https://github.com/new) called `hibohub`.
2. Open your terminal in the project folder and run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Hibo Hub"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/hibohub.git
   git push -u origin main
   ```

## 2. Official Publication (Firebase App Hosting)
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Build > App Hosting**.
3. Click **Get Started** and connect your GitHub repository (`hibohub`).
4. **CRITICAL:** Grant access to your GEMINI_API_KEY secret so the AI works in production:
   ```bash
   firebase apphosting:secrets:grantaccess GEMINI_API_KEY
   ```

## 3. Custom Domain
In the App Hosting dashboard, click **Connect Domain** to link your official website (e.g., `www.hibohub.com`).

## 4. Local Development
- Run `npm install`.
- Set up your `.env` file with `GEMINI_API_KEY`.
- Run `npm run dev` to start the app locally.

Congratulations on launching Hibo Hub!
