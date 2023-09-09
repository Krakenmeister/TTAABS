let playerPosition = getCookie("position");
let gameCode = getCookie("gameCode");

console.log(playerPosition);
console.log(gameCode);

class Battleship {
  constructor(x, y, angle, color) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.color = color;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, 30, 0, Math.PI * 2, false);
    ctx.fillStyle = this.color;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      this.x + 10 * Math.cos(this.angle),
      this.y + 10 * Math.sin(this.angle),
      5,
      0,
      Math.PI * 2,
      false
    );
    ctx.fillStyle = "black";
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
let mouseOnCanvas = false;
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

  if (playerPosition === "redOC") {
    // Red mouse events
    window.addEventListener("mousedown", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (
        event.clientX > 0 &&
        event.clientX < canvasWidth &&
        event.clientY > 0 &&
        event.clientY < canvasHeight
      ) {
        mouseOnCanvas = true;
        let forwardVector = [-Math.sin(redShip.angle), Math.cos(redShip.angle)];
        let targetVector = [
          event.clientX * (1000 / canvasWidth) - redShip.x,
          event.clientY * (1000 / canvasHeight) - redShip.y,
        ];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] +
            forwardVector[1] * targetVector[1]) /
          Math.sqrt(
            targetVector[0] * targetVector[0] +
              targetVector[1] * targetVector[1]
          );
        console.log(targetAngularVelocity);
        socket.emit("updateRed", gameCode, targetAngularVelocity);
      } else {
        mouseOnCanvas = false;
      }
    });
    window.addEventListener("mousemove", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (!mouseOnCanvas) {
        return;
      }

      if (
        event.clientX > 0 &&
        event.clientX < canvasWidth &&
        event.clientY > 0 &&
        event.clientY < canvasHeight
      ) {
        let forwardVector = [-Math.sin(redShip.angle), Math.cos(redShip.angle)];
        let targetVector = [
          event.clientX * (1000 / canvasWidth) - redShip.x,
          event.clientY * (1000 / canvasHeight) - redShip.y,
        ];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] +
            forwardVector[1] * targetVector[1]) /
          Math.sqrt(
            targetVector[0] * targetVector[0] +
              targetVector[1] * targetVector[1]
          );
        console.log(targetAngularVelocity);
        socket.emit("updateRed", gameCode, targetAngularVelocity);
      } else {
        mouseOnCanvas = false;
        socket.emit("updateRed", gameCode, 0);
      }
    });
    window.addEventListener("mouseup", (event) => {
      mouseOnCanvas = false;
      socket.emit("updateRed", gameCode, 0);
    });

    // Red touch events
    window.addEventListener("touchstart", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      let touch = event.touches[0] || event.changedTouches[0];
      let touchX = touch.pageX;
      let touchY = touch.pageY;

      if (
        touchX > 0 &&
        touchX < canvasWidth &&
        touchY > 0 &&
        touchY < canvasHeight
      ) {
        mouseOnCanvas = true;
        let forwardVector = [-Math.sin(redShip.angle), Math.cos(redShip.angle)];
        let targetVector = [
          touchX * (1000 / canvasWidth) - redShip.x,
          touchY * (1000 / canvasHeight) - redShip.y,
        ];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] +
            forwardVector[1] * targetVector[1]) /
          Math.sqrt(
            targetVector[0] * targetVector[0] +
              targetVector[1] * targetVector[1]
          );
        console.log(targetAngularVelocity);
        socket.emit("updateRed", gameCode, targetAngularVelocity);
      } else {
        mouseOnCanvas = false;
      }
    });
    window.addEventListener("touchmove", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (!mouseOnCanvas) {
        return;
      }

      let touch = event.touches[0] || event.changedTouches[0];
      let touchX = touch.pageX;
      let touchY = touch.pageY;

      if (
        touchX > 0 &&
        touchX < canvasWidth &&
        touchY > 0 &&
        touchY < canvasHeight
      ) {
        let forwardVector = [-Math.sin(redShip.angle), Math.cos(redShip.angle)];
        let targetVector = [
          touchX * (1000 / canvasWidth) - redShip.x,
          touchY * (1000 / canvasHeight) - redShip.y,
        ];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] +
            forwardVector[1] * targetVector[1]) /
          Math.sqrt(
            targetVector[0] * targetVector[0] +
              targetVector[1] * targetVector[1]
          );
        console.log(targetAngularVelocity);
        socket.emit("updateRed", gameCode, targetAngularVelocity);
      } else {
        mouseOnCanvas = false;
        socket.emit("updateRed", gameCode, 0);
      }
    });
    window.addEventListener("touchend", (event) => {
      mouseOnCanvas = false;
      socket.emit("updateRed", gameCode, 0);
    });
  } else if (playerPosition === "blueOC") {
    // Blue mouse events
    window.addEventListener("mousedown", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (
        event.clientX > 0 &&
        event.clientX < canvasWidth &&
        event.clientY > 0 &&
        event.clientY < canvasHeight
      ) {
        mouseOnCanvas = true;
        let forwardVector = [
          -Math.sin(blueShip.angle),
          Math.cos(blueShip.angle),
        ];
        let targetVector = [
          event.clientX * (1000 / canvasWidth) - blueShip.x,
          event.clientY * (1000 / canvasHeight) - blueShip.y,
        ];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] +
            forwardVector[1] * targetVector[1]) /
          Math.sqrt(
            targetVector[0] * targetVector[0] +
              targetVector[1] * targetVector[1]
          );
        console.log(targetAngularVelocity);
        socket.emit("updateBlue", gameCode, targetAngularVelocity);
      } else {
        mouseOnCanvas = false;
      }
    });
    window.addEventListener("mousemove", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (!mouseOnCanvas) {
        return;
      }

      if (
        event.clientX > 0 &&
        event.clientX < canvasWidth &&
        event.clientY > 0 &&
        event.clientY < canvasHeight
      ) {
        let forwardVector = [
          -Math.sin(blueShip.angle),
          Math.cos(blueShip.angle),
        ];
        let targetVector = [
          event.clientX * (1000 / canvasWidth) - blueShip.x,
          event.clientY * (1000 / canvasHeight) - blueShip.y,
        ];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] +
            forwardVector[1] * targetVector[1]) /
          Math.sqrt(
            targetVector[0] * targetVector[0] +
              targetVector[1] * targetVector[1]
          );
        console.log(targetAngularVelocity);
        socket.emit("updateBlue", gameCode, targetAngularVelocity);
      } else {
        mouseOnCanvas = false;
        socket.emit("updateBlue", gameCode, 0);
      }
    });
    window.addEventListener("mouseup", (event) => {
      mouseOnCanvas = false;
      socket.emit("updateBlue", gameCode, 0);
    });

    // Blue touch events
    window.addEventListener("touchstart", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      let touch = event.touches[0] || event.changedTouches[0];
      let touchX = touch.pageX;
      let touchY = touch.pageY;

      if (
        touchX > 0 &&
        touchX < canvasWidth &&
        touchY > 0 &&
        touchY < canvasHeight
      ) {
        mouseOnCanvas = true;
        let forwardVector = [
          Math.cos(blueShip.angle),
          Math.sin(blueShip.angle),
        ];
        let targetVector = [
          touchX * (1000 / canvasWidth) - blueShip.x,
          touchY * (1000 / canvasHeight) - blueShip.y,
        ];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] +
            forwardVector[1] * targetVector[1]) /
          Math.sqrt(
            targetVector[0] * targetVector[0] +
              targetVector[1] * targetVector[1]
          );
        console.log(targetAngularVelocity);
        socket.emit("updateBlue", gameCode, targetAngularVelocity);
      } else {
        mouseOnCanvas = false;
      }
    });
    window.addEventListener("touchmove", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (!mouseOnCanvas) {
        return;
      }

      let touch = event.touches[0] || event.changedTouches[0];
      let touchX = touch.pageX;
      let touchY = touch.pageY;

      if (
        touchX > 0 &&
        touchX < canvasWidth &&
        touchY > 0 &&
        touchY < canvasHeight
      ) {
        let forwardVector = [
          Math.cos(blueShip.angle),
          Math.sin(blueShip.angle),
        ];
        let targetVector = [
          touchX * (1000 / canvasWidth) - blueShip.x,
          touchY * (1000 / canvasHeight) - blueShip.y,
        ];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] +
            forwardVector[1] * targetVector[1]) /
          Math.sqrt(
            targetVector[0] * targetVector[0] +
              targetVector[1] * targetVector[1]
          );
        console.log(targetAngularVelocity);
        socket.emit("updateBlue", gameCode, targetAngularVelocity);
      } else {
        mouseOnCanvas = false;
        socket.emit("updateBlue", gameCode, 0);
      }
    });
    window.addEventListener("touchend", (event) => {
      mouseOnCanvas = false;
      socket.emit("updateBlue", gameCode, 0);
    });
  } else if (playerPosition === "redIC" || playerPosition === "blueIC") {
  }

  document.getElementById("gameWrapper").appendChild(canvas);
});

socket.on("updateGame", (gameState) => {
  redShip.x = gameState.redShip.x;
  redShip.y = gameState.redShip.y;
  redShip.angle = gameState.redShip.angle;
  blueShip.x = gameState.blueShip.x;
  blueShip.y = gameState.blueShip.y;
  blueShip.angle = gameState.blueShip.angle;
});

function animate() {
  requestAnimationFrame(animate);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  redShip.draw();
  blueShip.draw();
}
