// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registered', reg))
            .catch(err => console.error('Service Worker registration failed', err));
    });
}

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSkeleton = document.getElementById('loadingSkeleton');
const errorMessage = document.getElementById('errorMessage');
const characterResult = document.getElementById('characterResult');
const favoritesSection = document.getElementById('favoritesSection');
const favoritesList = document.getElementById('favoritesList');

// Character Info Elements
const charNameEl = document.getElementById('charName');
const charLevelEl = document.getElementById('charLevel');
const charVocationEl = document.getElementById('charVocation');
const charWorldEl = document.getElementById('charWorld');
const charGuildEl = document.getElementById('charGuild');
const charStatusEl = document.getElementById('charStatus');
const charStatusTextEl = document.getElementById('charStatusText');
const charDeathsEl = document.getElementById('charDeaths');
const smartTipTextEl = document.getElementById('smartTipText');

// Action Buttons
const favoriteBtn = document.getElementById('favoriteBtn');
const favoriteIcon = document.getElementById('favoriteIcon');
const shareBtn = document.getElementById('shareBtn');

// State
let currentCharacter = null;
let favorites = JSON.parse(localStorage.getItem('tibia_favorites')) || [];

// Initialize
renderFavorites();

// Event Listeners
searchBtn.addEventListener('click', () => searchCharacter(searchInput.value));
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchCharacter(searchInput.value);
});
favoriteBtn.addEventListener('click', toggleFavorite);
shareBtn.addEventListener('click', shareCharacter);

// Main Search Function
async function searchCharacter(name) {
    if (!name.trim()) return;
    
    const formattedName = name.trim().replace(/ /g, '+');
    
    // UI State
    characterResult.classList.add('hidden');
    errorMessage.classList.add('hidden');
    loadingSkeleton.classList.remove('hidden');
    
    try {
        const response = await fetch(`https://api.tibiadata.com/v4/character/${formattedName}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (!data.character || !data.character.character || !data.character.character.name) {
            throw new Error('Character not found');
        }
        
        displayCharacter(data.character);
    } catch (error) {
        console.error('Error fetching character:', error);
        errorMessage.classList.remove('hidden');
    } finally {
        loadingSkeleton.classList.add('hidden');
    }
}

// Display Data
function displayCharacter(data) {
    const char = data.character;
    currentCharacter = {
        name: char.name,
        level: char.level,
        vocation: char.vocation,
        world: char.world
    };
    
    charNameEl.textContent = char.name;
    charLevelEl.textContent = char.level;
    charVocationEl.textContent = char.vocation;
    charWorldEl.textContent = char.world;
    charGuildEl.textContent = char.guild ? `${char.guild.rank} of ${char.guild.name}` : 'None';
    
    charStatusEl.className = 'w-3 h-3 rounded-full bg-gray-500';
    charStatusTextEl.textContent = 'Offline';

    // Deaths
    charDeathsEl.innerHTML = '';
    if (data.deaths && data.deaths.length > 0) {
        data.deaths.slice(0, 5).forEach(death => {
            const li = document.createElement('li');
            li.className = 'border-l-2 border-red-900 pl-3 py-1';
            li.innerHTML = `<span class="text-gray-400 text-xs">${new Date(death.time).toLocaleString()}</span><br>
                            <span class="text-gray-200">Killed at level ${death.level} by ${death.killers[0].name}</span>`;
            charDeathsEl.appendChild(li);
        });
    } else {
        charDeathsEl.innerHTML = '<li class="text-gray-500 italic">Nenhuma morte recente.</li>';
    }

    // Smart Tip
    generateSmartTip(char.level, char.vocation);

    // Update Favorite Icon
    updateFavoriteIcon();

    characterResult.classList.remove('hidden');
}

// Smart Tip Logic (Simulated AI)
function generateSmartTip(level, vocation) {
    let tip = "Explore novas áreas para ganhar experiência.";
    
    const voc = vocation.toLowerCase();
    
    if (level < 50) {
        if (voc.includes('knight')) tip = "Cace em Coryms (Venore/Port Hope) para boa XP e lucro.";
        else if (voc.includes('paladin')) tip = "Tarantulas (Task) ou Cyclops são ótimos para seu level.";
        else tip = "Cavernas de Rotworms ou Minotaurs (Darashia) usando wands/rods.";
    } else if (level < 100) {
        if (voc.includes('knight')) tip = "Mutated Humans (Yalahar) ou Roaring Lions (Darashia).";
        else if (voc.includes('paladin')) tip = "Muggy Plains (Lizards) ou Krailos Ruins.";
        else tip = "Water Elementals (Port Hope) ou Mother of Scarabs Lair.";
    } else {
        if (voc.includes('knight')) tip = "Sea Serpents ou Carlin Cults. Use exori rotation!";
        else if (voc.includes('paladin')) tip = "Grim Reapers (Yalahar) com Fire Walls, ou Exotic Cave.";
        else tip = "Lava Lurkers (XP) ou Glooth Bandits (Lucro).";
    }
    
    smartTipTextEl.textContent = `[AI Tip]: ${tip}`;
}

// Favorites Logic
function toggleFavorite() {
    if (!currentCharacter) return;
    
    const index = favorites.findIndex(f => f.name === currentCharacter.name);
    
    if (index > -1) {
        favorites.splice(index, 1); // Remove
    } else {
        favorites.push(currentCharacter); // Add
    }
    
    localStorage.setItem('tibia_favorites', JSON.stringify(favorites));
    updateFavoriteIcon();
    renderFavorites();
}

function updateFavoriteIcon() {
    if (!currentCharacter) return;
    const isFav = favorites.some(f => f.name === currentCharacter.name);
    if (isFav) {
        favoriteIcon.classList.remove('fa-regular');
        favoriteIcon.classList.add('fa-solid');
        favoriteIcon.classList.add('text-tibia-gold');
    } else {
        favoriteIcon.classList.remove('fa-solid');
        favoriteIcon.classList.remove('text-tibia-gold');
        favoriteIcon.classList.add('fa-regular');
    }
}

function renderFavorites() {
    favoritesList.innerHTML = '';
    
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="text-gray-500 text-sm italic">Nenhum favorito salvo.</p>';
        return;
    }
    
    favorites.forEach(char => {
        const div = document.createElement('div');
        div.className = 'bg-tibia-panel p-3 rounded border border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-800 transition';
        div.innerHTML = `
            <div>
                <div class="font-bold text-tibia-gold">${char.name}</div>
                <div class="text-xs text-gray-400">Lvl ${char.level} - ${char.vocation}</div>
            </div>
            <i class="fa-solid fa-chevron-right text-gray-600"></i>
        `;
        div.addEventListener('click', () => {
            searchInput.value = char.name;
            searchCharacter(char.name);
            window.scrollTo(0, 0);
        });
        favoritesList.appendChild(div);
    });
}

// Web Share API
async function shareCharacter() {
    if (!currentCharacter) return;
    
    const shareData = {
        title: `Tibia Character: ${currentCharacter.name}`,
        text: `Confira ${currentCharacter.name}, Level ${currentCharacter.level} ${currentCharacter.vocation} em ${currentCharacter.world}!`,
        url: window.location.href
    };
    
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        alert('Compartilhamento não suportado neste navegador. Copie a URL!');
    }
}