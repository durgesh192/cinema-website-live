window.addEventListener('load', () => {
    const searchInput = document.getElementById("search");
    const aiInput = document.getElementById("userInput");
    if(searchInput) searchInput.value = "";
    if(aiInput) aiInput.value = "";
});

let currentBannerIndex = 0;
let bannerInterval;

fetch("/api/banners")
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      renderBanners(data);
      startBannerAutoScroll(data.length);
    }
  }).catch(err => console.log("Banner Error:", err));

function renderBanners(banners) {
  const wrapper = document.getElementById("bannerWrapper");
  if(!wrapper) return;
  wrapper.innerHTML = banners.map(b => `
    <div class="banner-slide">
      <img src="${b.image || b.img}" alt="${b.title}">
      <div class="hero-gradient"></div>
      <div class="banner-content">
        <h2>${b.title}</h2>
        <p>${b.desc}</p>
        <div class="hero-buttons">
          <a href="${b.link || '#'}" class="play-btn" target="_blank">▶ Watch Now</a>
          <a href="/watch.html" class="party-btn" target="_blank">👥 Start Watch Party</a>
        </div>
      </div>
    </div>
  `).join('');
}

function moveBanner(direction) {
  const wrapper = document.getElementById("bannerWrapper");
  if (!wrapper || wrapper.children.length === 0) return;
  currentBannerIndex += direction;
  if (currentBannerIndex >= wrapper.children.length) currentBannerIndex = 0;
  if (currentBannerIndex < 0) currentBannerIndex = wrapper.children.length - 1;
  wrapper.style.transform = `translateX(-${currentBannerIndex * 100}%)`;
  clearInterval(bannerInterval);
  startBannerAutoScroll(wrapper.children.length);
}

function startBannerAutoScroll(totalBanners) {
  bannerInterval = setInterval(() => { moveBanner(1); }, 4000);
}

// SKELETON LOADERS & MOVIE LOGIC
let allMovies = [];
const grid = document.getElementById("moviesGrid");

if(grid) {
    grid.innerHTML = Array(6).fill(`
        <div class="movie-card" style="background:#222; animation: pulse 1.5s infinite;">
            <div style="height:280px; background:#333;"></div>
            <div style="padding:15px;"><div style="height:15px; background:#444; width:80%; margin-bottom:10px;"></div><div style="height:30px; background:#444; border-radius:5px;"></div></div>
        </div>
    `).join('');
}

fetch("/api/movies")
  .then(res => res.json())
  .then(data => {
    allMovies = Array.isArray(data) ? data : [];
    setTimeout(() => { renderMovies(allMovies); }, 800); // Shimmer effect delay
  }).catch(err => console.error("Movies API Error:", err));

function renderMovies(moviesToRender) {
  if(!grid) return;
  grid.innerHTML = "";
  if (moviesToRender.length === 0) {
    grid.innerHTML = "<p style='color:#888;'>No movies found.</p>";
    return;
  }
  
  moviesToRender.forEach(m => {
    let actionButton = `<a href="${m.link || '#'}" class="download-btn" target="_blank">⬇ Watch / Download</a>`;
    if (m.category && m.category.toLowerCase().includes("live")) {
        actionButton = `<a href="${m.link || '#'}" class="download-btn live-btn" target="_blank">🔴 Watch Live</a>`;
    } 

    const posterSrc = m.poster || m.img || m.image || 'https://via.placeholder.com/300x400?text=No+Poster';

    const card = document.createElement("div");
    card.className = "movie-card";
    card.innerHTML = `
      <img src="${posterSrc}" alt="${m.title}" onerror="this.src='https://via.placeholder.com/300x400?text=Image+Missing'">
      <div class="card-content">
        <h3 class="card-title">${m.title}</h3>
        <span style="color:#aaa; font-size:12px;">${m.category || 'Movie'}</span>
        ${actionButton}
      </div>
    `;
    grid.appendChild(card);
  });
}

const searchInputDOM = document.getElementById("search");
if(searchInputDOM) {
    searchInputDOM.addEventListener("input", function(e) {
      const text = e.target.value.toLowerCase();
      const filtered = allMovies.filter(m => (m.title || "").toLowerCase().includes(text));
      renderMovies(filtered);
      document.getElementById('resetBtn').style.display = text.length > 0 ? 'block' : 'none';
    });
}

// AI LOGIC
const geminiApiKey = "AQ.Ab8RN6LpMtImUJ-vlXYz7scFzDdlKpeLSpSNP1IFJJVzZr69rg"; 
async function callGeminiAPI(promptText) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (err) { return ""; }
}

const aiModal = document.getElementById('aiModal');
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');

function openAIModal() { aiModal.style.display = 'flex'; }
function closeAIModal() { aiModal.style.display = 'none'; }
function appendMessage(text) { chatBox.innerHTML += `<div style="margin-top:10px; color:#fff; background:#222; padding:10px; border-radius:8px;">${text}</div>`; chatBox.scrollTop = chatBox.scrollHeight; }

async function processAIFilter() {
    const text = userInput.value.trim();
    if (!text) return;
    appendMessage(`<b>Aap:</b> ${text}`);
    userInput.value = ''; 
    appendMessage('<i>✨ Scanning Database...</i>');
    const dbString = JSON.stringify(allMovies.map(m => ({ id: m._id, title: m.title, category: m.category })));
    const prompt = `User request: "${text}". CINEMA DB: ${dbString}. Find matches. Return ONLY JSON array of '_id' strings. Example: ["id1"]. If none match, return [].`;
    const aiResponse = await callGeminiAPI(prompt);
    try {
        const matchedIds = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
        if (Array.isArray(matchedIds)) {
            const filteredMovies = allMovies.filter(m => matchedIds.includes(m._id));
            renderMovies(filteredMovies); 
            appendMessage('✅ Filter complete!');
            document.getElementById('resetBtn').style.display = 'block';
            setTimeout(closeAIModal, 2000); 
        }
    } catch (e) { appendMessage('❌ Samajh nahi aaya.'); }
}

function resetAIFilter() {
    renderMovies(allMovies);
    document.getElementById('resetBtn').style.display = 'none';
    const searchInput = document.getElementById("search");
    if(searchInput) searchInput.value = "";
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
function startVoiceSearch() {
    if (!SpeechRecognition) return alert("Please use Chrome browser.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.onstart = () => { userInput.placeholder = "Listening..."; document.getElementById('micBtn').style.background = "#ff1f2e"; };
    recognition.onresult = (e) => { userInput.value = e.results[0][0].transcript; processAIFilter(); };
    recognition.onend = () => { document.getElementById('micBtn').style.background = "#222"; userInput.placeholder = "Likh kar search karein..."; };
    recognition.start();
}