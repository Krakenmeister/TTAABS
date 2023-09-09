let playerPosition = getCookie("position");
let gameCode = getCookie("gameCode");

class Battleship {
  constructor(x, y, angle, color) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 50, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

let socket = io();

socket.emit("joinGame", gameCode, playerPosition);
socket.on("updateLobby", (players) => {
  removeAllChildNodes(document.getElementById("gameWrapper"));

  let lobbyDisplay = document.createElement("div");
  lobbyDisplay.id = "lobbyDisplay";

  let codeTitle = document.createElement("div");
  codeTitle.id = "codeTitle";
  codeTitle.textContent = gameCode;

  let playerList = document.createElement("div");
  playerList.id = "playerList";

  for (let i = 0; i < 4; i++) {
    let playerListWrapper = document.createElement("div");
    playerListWrapper.className = "playerListWrapper";

    let playerListLabel = document.createElement("div");
    playerListLabel.className = "playerListLabel";
    switch (i) {
      case 0:
        playerListLabel.textContent = "Red OC:";
        break;
      case 1:
        playerListLabel.textContent = "Red IC:";
        break;
      case 2:
        playerListLabel.textContent = "Blue OC:";
        break;
      case 3:
        playerListLabel.textContent = "Blue IC:";
        break;
    }

    let playerListValue = document.createElement("div");
    playerListValue.className = "playerListValue";
    switch (i) {
      case 0:
        if (players["redOC"]) {
          playerListValue.textContent = players["redOC"].name;
        } else {
          playerListValue.textContent = "---";
        }
        break;
      case 1:
        if (players["redIC"]) {
          playerListValue.textContent = players["redIC"].name;
        } else {
          playerListValue.textContent = "---";
        }
        break;
      case 2:
        if (players["blueOC"]) {
          playerListValue.textContent = players["blueOC"].name;
        } else {
          playerListValue.textContent = "---";
        }
        break;
      case 3:
        if (players["blueIC"]) {
          playerListValue.textContent = players["blueIC"].name;
        } else {
          playerListValue.textContent = "---";
        }
        break;
    }

    playerListWrapper.appendChild(playerListLabel);
    playerListWrapper.appendChild(playerListValue);

    playerList.appendChild(playerListWrapper);
  }

  lobbyDisplay.appendChild(codeTitle);
  lobbyDisplay.appendChild(playerList);

  document.getElementById("gameWrapper").appendChild(lobbyDisplay);
});

let canvas;
let ctx;
let redShip;
let blueShip;
socket.on("startGame", (gameState) => {
  removeAllChildNodes(document.getElementById("gameWrapper"));

  redShip = new Battleship(
    gameState.redShip.x,
    gameState.redShip.y,
    gameState.redShip.angle,
    "red"
  );
  blueShip = new Battleship(
    gameState.blueShip.x,
    gameState.blueShip.y,
    gameState.blueShip.angle,
    "blue"
  );

  canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";
  canvas.width = 1000;
  canvas.height = 1000;
  ctx = canvas.getContext("2d");
  animate();

  if (playerPosition === "redOC" || playerPosition === "blueOC") {
  } else if (playerPosition === "redIC" || playerPosition === "blueIC") {
  }

  document.getElementById("gameWrapper").appendChild(canvas);
});

socket.on("updateGame", (gameState) => {
  redShip.x = gameState.redShip.x;
  redShip.y = gameState.redShip.y;
  blueShip.x = gameState.blueShip.x;
  blueShip.y = gameState.blueShip.y;
});

function animate() {
  requestAnimationFrame(animate);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  redShip.draw();
  blueShip.draw();
}
