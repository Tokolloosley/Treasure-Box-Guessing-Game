// ============================================
// COOKIE MANAGEMENT UTILITY
// ============================================
class CookieManager {
  static setCookie(name, value, days = 7) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; ${expires}; path=/; SameSite=Lax`;
  }

  static getCookie(name) {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(nameEQ)) {
        try {
          return JSON.parse(decodeURIComponent(cookie.substring(nameEQ.length)));
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  static deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  }
}

// ============================================
// SESSION STORAGE UTILITY
// ============================================
class SessionManager {
  static setSession(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  static getSession(key) {
    const value = sessionStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }

  static deleteSession(key) {
    sessionStorage.removeItem(key);
  }

  static clearSession() {
    sessionStorage.clear();
  }
}

// ============================================
// FORM VALIDATION UTILITY
// ============================================
class FormValidator {
  static validateSettings(settings) {
    const errors = [];

    if (!settings.playerName || settings.playerName.trim().length === 0) {
      errors.push("Player name is required.");
    }
    if (settings.playerName && settings.playerName.trim().length > 20) {
      errors.push("Player name must not exceed 20 characters.");
    }
    if (!["easy", "medium", "hard"].includes(settings.difficulty)) {
      errors.push("Invalid difficulty level selected.");
    }
    if (!["3", "4", "5"].includes(settings.gridSize)) {
      errors.push("Grid size must be 3x3, 4x4, or 5x5.");
    }
    if (!["treasure", "space", "mystery"].includes(settings.theme)) {
      errors.push("Invalid theme selected.");
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

// ============================================
// FEEDBACK SYSTEM
// ============================================
class FeedbackSystem {
  static showMessage(message, type = "info", duration = 3000) {
    const messageArea = document.getElementById("messageArea");
    if (messageArea) {
      messageArea.textContent = message;
      messageArea.className = `message-area feedback ${type}`;
      if (duration > 0) {
        setTimeout(() => {
          messageArea.textContent = "";
          messageArea.className = "message-area";
        }, duration);
      }
    }
  }

  static confirm(message) {
    return confirm(message);
  }

  static prompt(message, defaultValue = "") {
    return prompt(message, defaultValue);
  }

  static showError(error) {
    this.showMessage(`❌ ${error}`, "error", 4000);
  }

  static showSuccess(message) {
    this.showMessage(`✓ ${message}`, "success", 3000);
  }

  static showWarning(message) {
    this.showMessage(`⚠️ ${message}`, "warning", 3500);
  }

  static showInfo(message) {
    this.showMessage(`ℹ️ ${message}`, "info", 3000);
  }
}

// ============================================
// SETUP PAGE LOGIC
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  const setupForm = document.getElementById("setupForm");
  const previewText = document.getElementById("previewText");
  const startGameBtn = document.getElementById("startGameBtn");
  const openGameBtn = document.getElementById("openGameBtn");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const loadSettingsBtn = document.getElementById("loadSettingsBtn");
  const resetSettingsBtn = document.getElementById("resetSettingsBtn");
  const instructionsBtn = document.getElementById("instructionsBtn");

  if (setupForm) {
    // Load previously saved settings on page load
    loadPreviousSettings();

    // Update live preview
    setupForm.addEventListener("input", () => {
      const playerName = document.getElementById("playerName").value || "Anonymous";
      const difficulty = document.getElementById("difficulty").value;
      const gridSize = document.getElementById("gridSize").value;
      const theme = document.querySelector("input[name='theme']:checked").value;
      previewText.textContent = `🎮 Player: ${playerName} | 📊 Difficulty: ${difficulty} | 📦 Grid: ${gridSize}x${gridSize} | 🎨 Theme: ${theme}`;
    });

    // Save settings to both localStorage and cookies
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener("click", () => {
        const settings = {
          playerName: document.getElementById("playerName").value,
          difficulty: document.getElementById("difficulty").value,
          gridSize: document.getElementById("gridSize").value,
          theme: document.querySelector("input[name='theme']:checked").value,
          showHintCount: document.getElementById("showHintCount").checked,
          enableShield: document.getElementById("enableShield").checked,
          doubleReward: document.getElementById("doubleReward").checked,
        };

        // Validate settings
        const validation = FormValidator.validateSettings(settings);
        if (!validation.isValid) {
          FeedbackSystem.showError(validation.errors.join(" | "));
          return;
        }

        // Confirm save action
        if (FeedbackSystem.confirm("Are you sure you want to save these settings?")) {
          localStorage.setItem("treasureGameSettings", JSON.stringify(settings));
          CookieManager.setCookie("treasureGameSettings", settings, 30); // 30-day cookie
          SessionManager.setSession("lastSettings", settings);
          FeedbackSystem.showSuccess("Settings saved successfully!");
        }
      });
    }

    // Load settings from cookies, then localStorage, then sessionStorage
    if (loadSettingsBtn) {
      loadSettingsBtn.addEventListener("click", () => {
        let settings = CookieManager.getCookie("treasureGameSettings");
        if (!settings) {
          settings = JSON.parse(localStorage.getItem("treasureGameSettings"));
        }
        if (!settings) {
          settings = SessionManager.getSession("lastSettings");
        }

        if (settings) {
          populateForm(settings);
          FeedbackSystem.showSuccess("Settings loaded successfully!");
        } else {
          FeedbackSystem.showWarning("No saved settings found.");
        }
      });
    }

    // Reset settings with confirmation
    if (resetSettingsBtn) {
      resetSettingsBtn.addEventListener("click", () => {
        if (FeedbackSystem.confirm("Reset all settings to defaults?")) {
          setupForm.reset();
          previewText.textContent = "No settings selected yet.";
          FeedbackSystem.showSuccess("Settings reset.");
        }
      });
    }

    // Instructions
    if (instructionsBtn) {
      instructionsBtn.addEventListener("click", () => {
        window.location.href = "instructions.html";
      });
    }

    // Open game window
    if (openGameBtn) {
      openGameBtn.addEventListener("click", () => {
        const playerName = document.getElementById("playerName").value;
        if (!playerName || playerName.trim().length === 0) {
          FeedbackSystem.showError("Please enter a player name first!");
          return;
        }

        const settings = {
          playerName: document.getElementById("playerName").value,
          difficulty: document.getElementById("difficulty").value,
          gridSize: document.getElementById("gridSize").value,
          theme: document.querySelector("input[name='theme']:checked").value,
          showHintCount: document.getElementById("showHintCount").checked,
          enableShield: document.getElementById("enableShield").checked,
          doubleReward: document.getElementById("doubleReward").checked,
        };

        const validation = FormValidator.validateSettings(settings);
        if (!validation.isValid) {
          FeedbackSystem.showError(validation.errors.join(" | "));
          return;
        }

        // Save settings before opening game
        localStorage.setItem("treasureGameSettings", JSON.stringify(settings));
        CookieManager.setCookie("treasureGameSettings", settings, 30);
        SessionManager.setSession("lastSettings", settings);

        window.open("game.html", "_blank", "width=1000,height=900");
      });
    }
  }

  function populateForm(settings) {
    document.getElementById("playerName").value = settings.playerName;
    document.getElementById("difficulty").value = settings.difficulty;
    document.getElementById("gridSize").value = settings.gridSize;
    document.querySelector(`input[name='theme'][value='${settings.theme}']`).checked = true;
    document.getElementById("showHintCount").checked = settings.showHintCount;
    document.getElementById("enableShield").checked = settings.enableShield;
    document.getElementById("doubleReward").checked = settings.doubleReward;
  }

  function loadPreviousSettings() {
    let settings = CookieManager.getCookie("treasureGameSettings");
    if (!settings) {
      settings = JSON.parse(localStorage.getItem("treasureGameSettings"));
    }
    if (settings) {
      populateForm(settings);
    }
  }
});

// GAME PAGE LOGIC
let gameState = {};

const gameElements = {
  startBtn: document.getElementById("startBtn"),
  hintBtn: document.getElementById("hintBtn"),
  saveBtn: document.getElementById("saveBtn"),
  loadBtn: document.getElementById("loadBtn"),
  resetBtn: document.getElementById("resetBtn"),
  backBtn: document.getElementById("backBtn"),
  displayPlayer: document.getElementById("displayPlayer"),
  displayScore: document.getElementById("displayScore"),
  displayLives: document.getElementById("displayLives"),
  displayOpened: document.getElementById("displayOpened"),
  displayRewards: document.getElementById("displayRewards"),
  displayBestScore: document.getElementById("displayBestScore"),
  displayGridSize: document.getElementById("displayGridSize"),
  displayDifficulty: document.getElementById("displayDifficulty"),
  displayTheme: document.getElementById("displayTheme"),
  displaySafeLeft: document.getElementById("displaySafeLeft"),
  displayShield: document.getElementById("displayShield"),
  boxGrid: document.getElementById("boxGrid"),
  messageArea: document.getElementById("messageArea"),
  logArea: document.getElementById("logArea"),
  ruleArea: document.getElementById("ruleArea"),
  resultsArea: document.getElementById("resultsArea")
};

document.addEventListener("DOMContentLoaded", () => {
  // Event listeners
  if (gameElements.startBtn) {
    gameElements.startBtn.addEventListener("click", initGame);
  }
  if (gameElements.hintBtn) {
    gameElements.hintBtn.addEventListener("click", showHint);
  }
  if (gameElements.saveBtn) {
    gameElements.saveBtn.addEventListener("click", saveGame);
  }
  if (gameElements.loadBtn) {
    gameElements.loadBtn.addEventListener("click", loadGame);
  }
  if (gameElements.resetBtn) {
    gameElements.resetBtn.addEventListener("click", resetGame);
  }
  if (gameElements.backBtn) {
    gameElements.backBtn.addEventListener("click", () => {
      if (FeedbackSystem.confirm("Are you sure you want to close the game and return to settings?")) {
        window.close();
      }
    });
  }

  // Load game on window open if settings exist
  loadGameOnStart();
});

function loadGameOnStart() {
  const settings = CookieManager.getCookie("treasureGameSettings") ||
                   JSON.parse(localStorage.getItem("treasureGameSettings"));

  if (!settings) {
    FeedbackSystem.showWarning("No settings found. Configure the game first.");
    return;
  }

  // Store settings in session for quick access
  SessionManager.setSession("gameSettings", settings);
}

function initGame() {
  const settings = CookieManager.getCookie("treasureGameSettings") ||
                   JSON.parse(localStorage.getItem("treasureGameSettings")) ||
                   SessionManager.getSession("gameSettings");

  if (!settings) {
    FeedbackSystem.showError("No settings found. Please configure the game first.");
    return;
  }

  gameState = {
    playerName: settings.playerName || "Anonymous",
    difficulty: settings.difficulty,
    gridSize: parseInt(settings.gridSize),
    theme: settings.theme,
    showHintCount: settings.showHintCount,
    enableShield: settings.enableShield,
    doubleReward: settings.doubleReward,
    score: 0,
    lives: settings.difficulty === "easy" ? 5 : settings.difficulty === "medium" ? 3 : 2,
    opened: 0,
    rewards: 0,
    bestScore: parseInt(localStorage.getItem("treasureBestScore")) || 0,
    safeBoxes: [],
    trapBoxes: [],
    shieldUsed: false,
    startTime: Date.now(),
    gameActive: true,
    theme: settings.theme
  };

  // Save initial state to session
  SessionManager.setSession("currentGameState", gameState);

  updateUI();
  buildGrid();
  FeedbackSystem.showSuccess(`🎮 Game started! Find all the money, ${gameState.playerName}!`);
  logAction(`Game initialized: ${gameState.gridSize}x${gameState.gridSize} grid on ${gameState.difficulty} difficulty`);
}

function updateUI() {
  if (gameElements.displayPlayer) gameElements.displayPlayer.textContent = gameState.playerName;
  if (gameElements.displayScore) gameElements.displayScore.textContent = `$${gameState.score}`;
  if (gameElements.displayLives) gameElements.displayLives.textContent = gameState.lives;
  if (gameElements.displayOpened) gameElements.displayOpened.textContent = gameState.opened;
  if (gameElements.displayRewards) gameElements.displayRewards.textContent = gameState.rewards;
  if (gameElements.displayBestScore) gameElements.displayBestScore.textContent = `$${gameState.bestScore}`;
  if (gameElements.displayGridSize) gameElements.displayGridSize.textContent = `${gameState.gridSize}x${gameState.gridSize}`;
  if (gameElements.displayDifficulty) gameElements.displayDifficulty.textContent = gameState.difficulty;
  if (gameElements.displayTheme) gameElements.displayTheme.textContent = gameState.theme;
  if (gameElements.displayShield) gameElements.displayShield.textContent = gameState.enableShield ? (gameState.shieldUsed ? "Used ✓" : "Ready ⚡") : "N/A";
}

function buildGrid() {
  if (!gameElements.boxGrid) return;

  gameElements.boxGrid.innerHTML = "";
  const totalBoxes = gameState.gridSize * gameState.gridSize;
  const trapCount = gameState.difficulty === "easy" ? 
    Math.floor(totalBoxes * 0.2) : 
    gameState.difficulty === "medium" ? 
    Math.floor(totalBoxes * 0.3) : 
    Math.floor(totalBoxes * 0.4);

  const traps = new Set();
  while (traps.size < trapCount) {
    traps.add(Math.floor(Math.random() * totalBoxes));
  }

  for (let i = 0; i < totalBoxes; i++) {
    const box = document.createElement("button");
    box.className = "box";
    box.textContent = "?";
    box.dataset.index = i;
    box.addEventListener("click", () => openBox(i, box));
    gameElements.boxGrid.appendChild(box);

    if (traps.has(i)) {
      gameState.trapBoxes.push(i);
    } else {
      gameState.safeBoxes.push(i);
    }
  }

  if (gameElements.displaySafeLeft) {
    gameElements.displaySafeLeft.textContent = gameState.safeBoxes.length;
  }
}

function openBox(index, boxElement) {
  if (!gameState.gameActive || boxElement.disabled) return;

  const isTrap = gameState.trapBoxes.includes(index);

  if (isTrap) {
    if (gameState.enableShield && !gameState.shieldUsed) {
      gameState.shieldUsed = true;
      boxElement.textContent = "🛡️";
      boxElement.classList.add("shield-used");
      FeedbackSystem.showWarning("🛡️ Shield activated! Bomb avoided!");
      logAction(`Shield saved you from a 💣 bomb at box ${index}.`);
      if (gameElements.resultsArea) {
        gameElements.resultsArea.innerHTML += `<p>🛡️ Shield used at box ${index}</p>`;
      }
    } else {
      gameState.lives--;
      boxElement.textContent = "💣";
      boxElement.classList.add("bomb");
      FeedbackSystem.showError(`💣 BOOM! Hit a bomb! Lives left: ${gameState.lives}`);
      logAction(`Hit a 💣 bomb at box ${index}. Lives left: ${gameState.lives}`);
      if (gameElements.resultsArea) {
        gameElements.resultsArea.innerHTML += `<p>💣 Bomb hit at box ${index}. Lives: ${gameState.lives}</p>`;
      }
    }
  } else {
    const pointsEarned = gameState.doubleReward ? 20 : 10;
    gameState.score += pointsEarned;
    gameState.rewards++;
    boxElement.textContent = "💰";
    boxElement.classList.add("money");
    FeedbackSystem.showSuccess(`💰 Found $${pointsEarned}! Total: $${gameState.score}`);
    logAction(`Found 💰 money at box ${index}. Score: $${gameState.score}`);
    if (gameElements.resultsArea) {
      gameElements.resultsArea.innerHTML += `<p>💰 Money found at box ${index}. Score: $${gameState.score}</p>`;
    }
  }

  gameState.opened++;
  boxElement.disabled = true;

  updateUI();
  SessionManager.setSession("currentGameState", gameState);

  if (gameState.lives <= 0) {
    endGame("💀 Game Over! You ran out of lives!");
  } else if (gameState.rewards === gameState.safeBoxes.length) {
    endGame("🎉 Congratulations! You found all the money!");
  } else if (gameState.opened === gameState.gridSize * gameState.gridSize) {
    endGame("⏱️ All boxes opened!");
  }
}

function endGame(message) {
  gameState.gameActive = false;
  FeedbackSystem.showMessage(message, "final");

  logAction(`Game ended: ${message}`);

  if (gameState.score > 0) {
    if (gameState.score > gameState.bestScore) {
      gameState.bestScore = gameState.score;
      localStorage.setItem("treasureBestScore", gameState.score);
      CookieManager.setCookie("treasureBestScore", gameState.score, 365);
      updateUI();
      logAction(`🏆 NEW BEST SCORE: $${gameState.score}!`);
      if (gameElements.resultsArea) {
        gameElements.resultsArea.innerHTML += `<p style="color: gold; font-weight: bold;">🏆 NEW BEST SCORE: $${gameState.score}!</p>`;
      }
    }
  }

  document.querySelectorAll(".box").forEach(box => box.disabled = true);
}

function showHint() {
  if (!gameState.gameActive) {
    FeedbackSystem.showWarning("Game not active. Start a new game.");
    return;
  }

  if (gameState.showHintCount) {
    const safeLeft = gameState.safeBoxes.length - gameState.rewards;
    FeedbackSystem.showInfo(`💡 Hint: ${safeLeft} 💰 money box(es) remaining!`);
    logAction(`Hint used. Safe boxes left: ${safeLeft}`);
  } else {
    FeedbackSystem.showWarning("💡 Hints are disabled in settings.");
  }
}

function saveGame() {
  if (!gameState.playerName) {
    FeedbackSystem.showError("Start a game first!");
    return;
  }

  if (!gameState.gameActive) {
    FeedbackSystem.showWarning("Cannot save a finished game. Start a new game first.");
    return;
  }

  localStorage.setItem("treasureGameState", JSON.stringify(gameState));
  CookieManager.setCookie("treasureGameState", gameState, 1); // 1-day cookie
  SessionManager.setSession("currentGameState", gameState);

  if (FeedbackSystem.confirm("✓ Game state saved! Would you like to continue playing?")) {
    FeedbackSystem.showSuccess("Continuing...");
  }
  logAction("Game state saved to cookies and localStorage.");
}

function loadGame() {
  let savedState = CookieManager.getCookie("treasureGameState");
  if (!savedState) {
    savedState = JSON.parse(localStorage.getItem("treasureGameState"));
  }
  if (!savedState) {
    savedState = SessionManager.getSession("currentGameState");
  }

  if (savedState) {
    gameState = savedState;
    gameState.gameActive = true;
    updateUI();
    FeedbackSystem.showSuccess("📂 Game state loaded!");
    logAction("Game loaded from previous session.");
  } else {
    FeedbackSystem.showWarning("No saved game found.");
  }
}

function resetGame() {
  if (FeedbackSystem.confirm("Reset the current game? This cannot be undone.")) {
    gameState = {};
    if (gameElements.boxGrid) gameElements.boxGrid.innerHTML = "";
    if (gameElements.logArea) gameElements.logArea.innerHTML = "";
    if (gameElements.resultsArea) gameElements.resultsArea.innerHTML = "No results yet.";
    SessionManager.deleteSession("currentGameState");
    FeedbackSystem.showSuccess("Game reset!");
  }
}

function logAction(action) {
  if (gameElements.logArea) {
    const timestamp = new Date().toLocaleTimeString();
    gameElements.logArea.innerHTML += `<p><span class="timestamp">[${timestamp}]</span> ${action}</p>`;
    gameElements.logArea.scrollTop = gameElements.logArea.scrollHeight;
  }
}
