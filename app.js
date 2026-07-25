document.addEventListener("DOMContentLoaded", () => {
  const homeScreen = document.getElementById("homeScreen");
  const gameScreen = document.getElementById("gameScreen");
  const colourCountSelect = document.getElementById("colourCount");
  const tubeCountSelect = document.getElementById("tubeCount");
  const startBtn = document.getElementById("startBtn");
  const backBtn = document.getElementById("backBtn");
  const undoBtn = document.getElementById("undoBtn");
  const restartBtn = document.getElementById("restartBtn");
  const tubeContainer = document.getElementById("tubeContainer");
  const setupMessage = document.getElementById("setupMessage");
  const gameMessage = document.getElementById("gameMessage");

  const colourPool = [
    "#e89a8f",
    "#f0a44b",
    "#f2d35e",
    "#b7df5e",
    "#57c97b",
    "#55d6c2",
    "#48b8d8",
    "#6f8fe8",
    "#8f6be8",
    "#c06be8",
    "#e66db2",
    "#c48c68",
    "#9ed9d2",
    "#f5b7c8",
    "#7fd7a0",
    "#e6c98a"
  ];

  let tubes = [];
  let selectedTubeIndex = null;
  let currentColours = 4;
  let currentTubes = 6;
  let moveHistory = [];
  let startingTubes = [];

  function createLevel(colourCount, tubeCount) {
    const filledTubes = colourCount;
    const chunksPerColour = 4;
    const allChunks = [];

    for (let i = 0; i < colourCount; i++) {
      for (let j = 0; j < chunksPerColour; j++) {
        allChunks.push(colourPool[i]);
      }
    }

    shuffleArray(allChunks);

    const newTubes = [];

    for (let i = 0; i < filledTubes; i++) {
      newTubes.push(allChunks.splice(0, 4));
    }

    while (newTubes.length < tubeCount) {
      newTubes.push([]);
    }

    return newTubes;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function renderTubes() {
    tubeContainer.innerHTML = "";

    tubes.forEach((tube, index) => {
      const tubeEl = document.createElement("div");
      tubeEl.className = "tube";

      if (selectedTubeIndex === index) {
        tubeEl.classList.add("selected");
      }

      tubeEl.addEventListener("click", () => handleTubeClick(index));

      tube.forEach((colour) => {
        const chunk = document.createElement("div");
        chunk.className = "chunk";
        chunk.style.background = colour;
        tubeEl.appendChild(chunk);
      });

      tubeContainer.appendChild(tubeEl);
    });
  }

  function handleTubeClick(index) {
    gameMessage.textContent = "";

    if (selectedTubeIndex === null) {
      if (tubes[index].length === 0) {
        return;
      }
      selectedTubeIndex = index;
      renderTubes();
      return;
    }

    if (selectedTubeIndex === index) {
      selectedTubeIndex = null;
      renderTubes();
      return;
    }

    moveChunk(selectedTubeIndex, index);
    selectedTubeIndex = null;
    renderTubes();
    checkWin();
  }

  function moveChunk(fromIndex, toIndex) {
    const fromTube = tubes[fromIndex];
    const toTube = tubes[toIndex];

    if (fromTube.length === 0) {
      return;
    }

    if (toTube.length >= 4) {
      gameMessage.textContent = "That tube is full.";
      return;
    }

    const movingColour = fromTube[fromTube.length - 1];
    const topColour = toTube[toTube.length - 1];

    if (toTube.length === 0 || topColour === movingColour) {
      moveHistory.push(JSON.parse(JSON.stringify(tubes)));
      toTube.push(fromTube.pop());
    } else {
      gameMessage.textContent = "You can only place a chunk on the same colour or an empty tube.";
    }
  }

  function checkWin() {
    const won = tubes.every((tube) => {
      if (tube.length === 0) return true;
      if (tube.length !== 4) return false;
      return tube.every((colour) => colour === tube[0]);
    });

    if (won) {
      gameMessage.textContent = "You win!";
    }
  }

  function startGame() {
    const colourCount = parseInt(colourCountSelect.value);
    const tubeCount = parseInt(tubeCountSelect.value);

    if (tubeCount < colourCount + 2) {
      setupMessage.textContent = "Tubes must be at least 2 more than colours.";
      return;
    }

    setupMessage.textContent = "";
    currentColours = colourCount;
    currentTubes = tubeCount;
    tubes = createLevel(colourCount, tubeCount);
    startingTubes = JSON.parse(JSON.stringify(tubes));
    moveHistory = [];
    selectedTubeIndex = null;
    gameMessage.textContent = "";

    homeScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    renderTubes();
  }

  function goHome() {
    gameScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
    selectedTubeIndex = null;
    gameMessage.textContent = "";
  }

function restartGame() {
  tubes = createLevel(currentColours, currentTubes);
  startingTubes = JSON.parse(JSON.stringify(tubes));
  moveHistory = [];
  selectedTubeIndex = null;
  gameMessage.textContent = "";
  renderTubes();
}

  function undoMove() {
    if (moveHistory.length === 0) {
      gameMessage.textContent = "Nothing to undo.";
      return;
    }

    tubes = moveHistory.pop();
    selectedTubeIndex = null;
    gameMessage.textContent = "";
    renderTubes();
  }

  startBtn.addEventListener("click", startGame);
  backBtn.addEventListener("click", goHome);
  restartBtn.addEventListener("click", restartGame);
  undoBtn.addEventListener("click", undoMove);
});