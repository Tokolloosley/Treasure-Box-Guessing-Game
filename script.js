// SETUP
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
    // Update live preview
    setupForm.addEventListener("input", () => {
      const playerName = document.getElementById("playerName").value || "Anonymous";
      const difficulty = document.getElementById("difficulty").value;
      const gridSize = document.getElementById("gridSize").value;
      const theme = document.querySelector("input[name='theme']:checked").value;
      previewText.textContent = `Player: ${playerName}, Difficulty: ${difficulty}, Grid: ${gridSize}x${gridSize}, Theme: ${theme}`;
    });

    // Save settings to localStorage
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
      localStorage.setItem("treasureGameSettings", JSON.stringify(settings));
      alert("Settings saved!");
    });

    // Load settings from localStorage
    loadSettingsBtn.addEventListener("click", () => {
      const settings = JSON.parse(localStorage.getItem("treasureGameSettings"));
      if (settings) {
        document.getElementById("playerName").value = settings.playerName;
        document.getElementById("difficulty").value = settings.difficulty;
        document.getElementById("gridSize").value = settings.gridSize;
        document.querySelector(`input[name='theme'][value='${settings.theme}']`).checked = true;
        document.getElementById("showHintCount").checked = settings.showHintCount;
        document.getElementById("enableShield").checked = settings.enableShield;
        document.getElementById("doubleReward").checked = settings.doubleReward;
        alert("Settings loaded!");
      } else {
        alert("No saved settings found.");
      }
    });

    // Reset settings
    resetSettingsBtn.addEventListener("click", () => {
      setupForm.reset();
      previewText.textContent = "No settings selected yet.";
    });

    // Instructions
    instructionsBtn.addEventListener("click", () => {
      alert("Open boxes to find rewards. Avoid traps. Use shield wisely!");
    });

    // Open game window
    openGameBtn.addEventListener("click", () => {
      window.open("game.html", "_blank", "width=800,height=600");
    });
  }
});

//game logic
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const hintBtn = document.getElementById("hintBtn");
  const saveBtn = document.getElementById("saveBtn");
  const loadBtn = document.getElementById("loadBtn");
  const resetBtn = document.getElementById("resetBtn");
  const backBtn = document.getElementById("backBtn");

  const displayPlayer = document.getElementById("displayPlayer");
  const displayScore = document.getElementById("displayScore");
  const displayLives = document.getElementById("displayLives");
  const displayOpened = document.getElementById("displayOpened");
  const displayRewards = document.getElementById("displayRewards");
  const displayBestScore = document.getElementById("displayBestScore");

  const displayGridSize = document.getElementById("displayGridSize");
  const displayDifficulty = document.getElementById("displayDifficulty");
  const displayTheme = document.getElementById("displayTheme");
  const displaySafeLeft = document.getElementById("displaySafeLeft");
  const displayShield = document.getElementById("displayShield");

  const boxGrid = document.getElementById("boxGrid");
  const messageArea = document.getElementById("messageArea");
  const logArea = document.getElementById("logArea");
});


  let gameState = {};

  function initGame() {
    const settings = JSON.parse(localStorage.getItem("treasureGameSettings"));
    if (!settings) {
      alert("No settings found. Please configure the game first.");
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
    };
  
    // Update UI
    displayPlayer.textContent = gameState.playerName;
    displayScore.textContent = gameState.score;
    displayLives.textContent = gameState.lives;
    displayOpened.textContent = gameState.opened;
    displayRewards.textContent = gameState.rewards;
    displayBestScore.textContent = gameState.bestScore;
    displayGridSize.textContent = `${gameState.gridSize} x ${gameState.gridSize}`;
    displayDifficulty.textContent = gameState.difficulty;
    displayTheme.textContent = gameState.theme;
    displayShield.textContent = gameState.enableShield ? "Available" : "None";

    // Build grid
    boxGrid.innerHTML = "";
    const totalBoxes = gameState.gridSize * gameState.gridSize;
    const trapCount = gameState.difficulty === "easy" ? Math.floor(totalBoxes * 0.2) :
                      gameState.difficulty === "medium" ? Math.floor(totalBoxes * 0.3) :
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
      boxGrid.appendChild(box);
      if (traps.has(i)) {
        gameState.trapBoxes.push(i);
      } else {
        gameState.safeBoxes.push(i);
      }
    }

    displaySafeLeft.textContent = gameState.safeBoxes.length;
    messageArea.textContent = "Game started! Pick a box.";
    logArea.innerHTML = "";
  }

  function openBox(index, boxElement) {
    if (gameState.trapBoxes.includes(index)) {
      if (gameState.enableShield && !gameState.shieldUsed) {
        gameState.shieldUsed = true;
        displayShield.textContent = "Used";
        messageArea.textContent = "Trap avoided with shield!";
        logArea.innerHTML += `<p>Shield saved you from a trap at box ${index}.</p>`;
      } else {
        gameState.lives--;
        messageArea.textContent = "You hit a trap!";
        logArea.innerHTML += `<p>Trap at box ${index}. Lives left: ${gameState.lives}</p>`;
      }
    } else {
      gameState.score += gameState.doubleReward ? 20 : 10;
      gameState.rewards++;
      messageArea.textContent = "You found treasure!";
      logArea.innerHTML += `<p>Treasure at box ${index}. Score: ${gameState.score}</p>`;
    }

    gameState.opened++;
    boxElement.disabled = true;
    boxElement.textContent = "✓";

    // Update stats
    displayScore.textContent = gameState.score;
    displayLives.textContent = gameState.lives;
    displayOpened.textContent = gameState.opened;
    displayRewards.textContent = gameState.rewards;
    displaySafeLeft.textContent = gameState.safeBoxes.length - gameState.rewards;

    if (gameState.lives <= 0) {
      endGame("Game Over! You lost all lives.");
    } else if (gameState.rewards === gameState.safeBoxes.length) {
      endGame("Congratulations! You found all treasures.");
    }
  }

  function endGame(message) {
    messageArea.textContent = message;
    if (gameState.score) {
      if (gameState.score > gameState.bestScore) {
        localStorage.setItem("treasureBestScore", gameState.score);
        displayBestScore.textContent = gameState.score;
        logArea.innerHTML += `<p>New best score: ${gameState.score}!</p>`;
      }
    };
    // Disable all boxes
    document.querySelectorAll(".box").forEach(box => box.disabled = true);
  }

  startBtn.addEventListener("click", initGame);
  hintBtn.addEventListener("click", () => {
    if (gameState.showHintCount) {
      messageArea.textContent = `Hints: ${gameState.safeBoxes.length - gameState.rewards} safe boxes left.`;
    } else {
      messageArea.textContent = "Hints are disabled in settings.";
    } 
  });

  saveBtn.addEventListener("click", () => {
    localStorage.setItem("treasureGameState", JSON.stringify(gameState));
    alert("Game state saved!");
  });
  loadBtn.addEventListener("click", () => {
    const savedState = localStorage.getItem("treasureGameState");
    if (savedState) {
      gameState = JSON.parse(savedState);
      initGame();
    } else {
      alert("No saved game found.");
    }
  });
