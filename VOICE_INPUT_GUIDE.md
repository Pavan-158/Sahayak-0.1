# 🎤 Voice Input - How to Enable

## Why Voice Input Isn't Working

The browser's Speech Recognition API (which powers voice input) **requires a secure connection (HTTPS or localhost)** for privacy and security reasons. This is a browser security rule that cannot be bypassed.

When you see the app in a preview environment (HTTP), voice input is blocked by the browser.

## ✅ Solution: Run Locally

Voice input **WILL work** when you run the app on your own computer. Here's how:

### Step 1: Install Node.js
Download and install from [nodejs.org](https://nodejs.org/) (LTS version)

### Step 2: Clone/Download the Project
```bash
# Navigate to the project folder
cd sahayak
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Run the Development Server
```bash
npm run dev
```

### Step 5: Open in Browser
Open your browser and go to:
```
http://localhost:5173
```

### Step 6: Use Voice Input
1. Go to "Ask Sahayak" chat
2. Click the 🎤 microphone button
3. Allow microphone access when prompted
4. Speak in your chosen language (English, Hindi, Tamil, etc.)
5. Your speech will be transcribed and sent as a message!

## 🌐 Browser Support

| Browser | Voice Input | Notes |
|---------|-------------|-------|
| **Chrome** | ✅ Full Support | Best for Indian languages |
| **Edge** | ✅ Full Support | Uses same engine as Chrome |
| **Safari** | ⚠️ Partial | Limited language support |
| **Firefox** | ❌ Not Supported | No speech recognition API |

## 🇮🇳 Supported Languages

Voice input supports these Indian languages (in Chrome/Edge):
- English (en-IN)
- Hindi (hi-IN)
- Bengali (bn-IN)
- Telugu (te-IN)
- Tamil (ta-IN)
- Marathi (mr-IN)
- Gujarati (gu-IN)
- Kannada (kn-IN)
- Malayalam (ml-IN)
- Punjabi (pa-IN)

## 🔧 Troubleshooting

### "Microphone access denied"
- Click the lock icon in the address bar
- Go to Site Settings
- Set Microphone to "Allow"
- Refresh the page

### "Speech recognition not supported"
- Use Google Chrome or Microsoft Edge
- Make sure you're on localhost or HTTPS

### "No speech detected"
- Speak clearly and at normal volume
- Make sure your microphone is working
- Try in a quiet environment

## 📱 For Tech Expo Demo

For the best demo experience:
1. Run the app locally on a laptop
2. Use Chrome browser
3. Connect external speakers for audio output
4. Use a good quality microphone
5. Test all features before the demo

## 💡 Alternative: Type in Any Language

Even without voice input, you can:
- Type questions in any Indian language using your system's language keyboard
- The chatbot understands and responds appropriately
- All features work perfectly via typing

---

**Need help?** Check the main README.md for complete setup instructions.
