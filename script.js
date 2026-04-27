// ===============================
// AUTH FUNCTIONS (GLOBAL)
// ===============================
window.login = async function() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  
  if (!email || !password) {
    errorEl.textContent = 'Please fill all fields';
    return;
  }
  
  // ✅ Check if auth is ready
  if (typeof auth === 'undefined') {
    errorEl.textContent = 'Firebase not loaded. Please refresh.';
    return;
  }
  
  try {
    errorEl.textContent = 'Logging in...';
    await auth.signInWithEmailAndPassword(email, password);
    errorEl.textContent = '✅ Login successful!';
  } catch (e) {
    errorEl.textContent = e.message.replace('Firebase: ', '');
  }
};

window.register = async function() {
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  
  if (!email || !password) {
    errorEl.textContent = 'Please fill all fields';
    return;
  }
  
  if (password.length < 6) {
    errorEl.textContent = 'Password must be at least 6 characters';
    return;
  }
  
  if (typeof auth === 'undefined') {
    errorEl.textContent = 'Firebase not loaded. Please refresh.';
    return;
  }
  
  try {
    errorEl.textContent = 'Creating account...';
    await auth.createUserWithEmailAndPassword(email, password);
    errorEl.textContent = '✅ Account created!';
  } catch (e) {
    errorEl.textContent = e.message.replace('Firebase: ', '');
  }
};

window.showAuth = function() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'flex';
};

window.hideAuth = function() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.style.display = 'none';
};
// ===============================
// MAIN APP
// ===============================
alert("AS System Linked!");

document.addEventListener("DOMContentLoaded", function () {

  const box = document.getElementById("user-input");
  const btn = document.getElementById("send-btn");
  const asImg = document.getElementById("as-image");
  const micBtn = document.getElementById("mic-btn");
  const uploadBtn = document.getElementById("upload-btn");
  const fileInput = document.getElementById("file-upload");
  const themeBtn = document.getElementById("theme-toggle");
  const chatArea = document.getElementById("chat-container");

  const asMemory = {
    "hello": { text: "Hello bhai! Main AS hoon, batao kya sikhna hai?", image: "" },
    "hi": { text: "Hi bhai 😎 kya haal hai?", image: "" },
    "html": { text: "HTML web page ka structure banata hai.", image: "https://upload.wikimedia.org/wikipedia/commons/6/61/HTML5_logo_and_wordmark.svg" },
    "css": { text: "CSS website ko stylish banata hai.", image: "https://i.imgur.com/8hzvpa1.jpg" },
    "repair": { text: "Mobile repair ke liye soldering iron aur microscope useful hai.", image: "https://m.media-amazon.com/images/I/71u-m6IsqsL.jpg" }
  };

  let chatHistory = [];
  let currentUser = null;

  // Firebase Auth
  try {
    if (typeof auth !== 'undefined') {
      auth.onAuthStateChanged((user) => {
        if (user) {
          currentUser = user;
          hideAuth();
          loadChatHistory();
        } else {
          showAuth();
        }
      });
    }
  } catch (e) {
    console.log("Firebase offline");
  }

  // Load History
  async function loadChatHistory() {
    if (!db || !currentUser) return;
    const snapshot = await db.collection("chats")
      .where("userId", "==", currentUser.uid)
      .orderBy("timestamp", "asc")
      .get();

    if (!snapshot.empty) {
      document.getElementById("as-response").style.display = 'none';
      snapshot.forEach(doc => {
        renderMessage(doc.data().role, doc.data().content, false);
      });
    }
    chatArea.scrollTop = chatArea.scrollHeight;
  }

  // Save Message
  async function saveMessage(role, content) {
    if (!db || !currentUser) return;
    await db.collection("chats").add({
      userId: currentUser.uid,
      role: role,
      content: content,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  // Render Message
  function renderMessage(role, content, save = true) {
    const bubble = document.createElement("div");
    bubble.className = role === "user" ? "user-chat-bubble" : "as-chat-bubble";
    bubble.innerHTML = role === "user" ? "<strong>Tum:</strong> " + content : "<strong>AS:</strong> " + content;
    chatArea.appendChild(bubble);
    chatArea.scrollTop = chatArea.scrollHeight;
    if (save) saveMessage(role, content);
  }

  // Type Writer
  function typeWriter(element, text, i = 0) {
    if (i === 0) element.innerHTML = "<strong>AS:</strong> ";
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      setTimeout(() => typeWriter(element, text, i + 1), 30);
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }

  // Speech
  function speakText(text) {
    if ("speechSynthesis" in window) {
      let msg = new SpeechSynthesisUtterance(text);
      msg.lang = "hi-IN";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
    }
  }

  // Weather
  function getMausam() {
    if (!navigator.geolocation) {
      renderMessage("assistant", "GPS support nahi hai.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let url = `https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&appid=${API_KEYS.WEATHER}&units=metric&lang=hi`;
        fetch(url)
          .then(r => r.json())
          .then(d => {
            renderMessage("assistant", `Bhai ${d.name} me abhi ${Math.round(d.main.temp)}°C hai aur mausam ${d.weather[0].description} hai.`);
          })
          .catch(() => renderMessage("assistant", "Weather issue hai."));
      },
      () => renderMessage("assistant", "Location permission do.")
    );
  }

  // Groq AI
  async function askAI(sawal) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEYS.GROQ}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: sawal }],
        temperature: 0.7,
        max_tokens: 500
      })
    });
    const data = await res.json();
    return data.choices[0].message.content;
  }

  // Send Button
  btn.onclick = async function () {
    let input = box.value.trim();
    if (!input) return;

    renderMessage("user", input);
    box.value = "";

    if (input.toLowerCase().includes("weather") || input.toLowerCase().includes("mausam")) {
      getMausam();
      return;
    }

    const aiDiv = document.createElement("div");
    aiDiv.className = "as-chat-bubble";
    aiDiv.innerHTML = "<strong>AS:</strong> Soch raha hoon...";
    chatArea.appendChild(aiDiv);

    let jawab = "Bhai jawab nahi aa paya.";
    
    for (let key in asMemory) {
      if (input.toLowerCase().includes(key)) {
        jawab = asMemory[key].text;
        break;
      }
    }
    
    if (jawab === "Bhai jawab nahi aa paya.") {
      try { jawab = await askAI(input); } catch(e) {}
    }

    aiDiv.innerHTML = "<strong>AS:</strong> ";
    typeWriter(aiDiv, jawab);
    saveMessage("assistant", jawab);
  };

  box.addEventListener("keypress", (e) => {
    if (e.key === "Enter") btn.click();
  });

  themeBtn.onclick = () => {
    document.body.classList.toggle("light-mode");
    localStorage.setItem("theme", document.body.classList.contains("light-mode") ? "light" : "dark");
  };

  micBtn.onclick = () => {
    if (recognition) recognition.start();
    else alert("Voice not supported.");
  };

  let recognition = null;
  if ("webkitSpeechRecognition" in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.onresult = (e) => {
      box.value = e.results[0][0].transcript;
      btn.click();
    };
  }

  uploadBtn.onclick = () => fileInput.click();
  fileInput.onchange = async function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    renderMessage("user", "📎 File uploaded");
    const summary = await askAI(`Summary: ${text.substring(0, 2000)}`);
    renderMessage("assistant", summary);
  };

});