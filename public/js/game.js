let playerPosition = getCookie("position");
let gameCode = getCookie("gameCode");

console.log(playerPosition);
console.log(gameCode);

function getTeam() {
  if (playerPosition === "redOC" || playerPosition === "redIC") {
    return 0;
  }
  return 1;
}

function getDamage() {
  console.log(parseInt(document.getElementById("damageInput").value));
  return parseInt(document.getElementById("damageInput").value);
}

function getRange() {
  return 150;
}

function drawMissile(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2, false);
  ctx.fillStyle = "black";
  ctx.fill();
}

function drawFuel(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2, false);
  ctx.fillStyle = "yellow";
  ctx.fill();
}

class Battleship {
  constructor(x, y, angle, color) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.color = color;
  }

  draw() {
    const img = new Image();
    img.src = this.color === "red" ? "/media/images/ship_red.png" : "/media/images/ship_blue.png";
    img.onload = () => {
      ctx.save(); // Save the current state of the canvas
      ctx.translate(this.x + 16, this.y + 50); // Translate to the object's position
      ctx.rotate(this.angle + Math.PI/2); // Rotate the canvas by the object's angle
      ctx.drawImage(img, -30, -93, 32, 100); // Draw the image centered at the object's position
      ctx.restore(); // Restore the canvas to its previous state
    };
    // ctx.beginPath();
    // ctx.arc(this.x, this.y, 30, 0, Math.PI * 2, false);
    // ctx.fillStyle = this.color;
    // ctx.fill();

    // ctx.beginPath();
    // ctx.arc(this.x + 10 * Math.cos(this.angle), this.y + 10 * Math.sin(this.angle), 5, 0, Math.PI * 2, false);
    // ctx.fillStyle = "black";
    // ctx.fill();
  }
}

let missiles = [];
let fuels = [];

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
let mouseOnCanvas = -1;
let mouseX;
let mouseY;
let uiWrapper;
let gameWinner = -1;
let winTime = -1;
socket.on("startGame", (gameState) => {
  removeAllChildNodes(document.getElementById("gameWrapper"));

  redShip = new Battleship(gameState.redShip.x, gameState.redShip.y, gameState.redShip.angle, "red");
  blueShip = new Battleship(gameState.blueShip.x, gameState.blueShip.y, gameState.blueShip.angle, "blue");

  canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";
  canvas.width = 1000;
  canvas.height = 1000;
  ctx = canvas.getContext("2d");

  uiWrapper = document.createElement("div");
  uiWrapper.id = "uiWrapper";
  uiWrapper.style.backgroundColor = "lightgray";
  uiWrapper.style.position = "fixed";
  uiWrapper.style.right = 0;
  uiWrapper.style.top = 0;
  uiWrapper.style.width = `${window.innerWidth - window.innerHeight}px`;
  uiWrapper.style.height = "100vh";
  uiWrapper.style.display = "flex";
  uiWrapper.style.flexDirection = "column";

  window.addEventListener("resize", () => {
    if (document.getElementById("uiWrapper")) {
      document.getElementById("uiWrapper").style.width = `${window.innerWidth - window.innerHeight}px`;
    }
  });

  animate();

  if (playerPosition === "redOC") {
    let messageBox = document.createElement("div");
    messageBox.id = "messageBox";

    let controlBox = document.createElement("div");
    controlBox.id = "controlBox";

    let damageWrapper = document.createElement("div");
    damageWrapper.id = "damageWrapper";

    let damageLabel = document.createElement("div");
    damageLabel.textContent = "Missile damage:";
    damageLabel.id = "damageLabel";

    let damageInput = document.createElement("input");
    damageInput.type = "range";
    damageInput.id = "damageInput";
    damageInput.name = "damageInput";
    damageInput.min = "0";
    damageInput.max = "100";
    damageInput.step = "1";

    damageWrapper.appendChild(damageLabel);
    damageWrapper.appendChild(damageInput);

    let powerWrapper = document.createElement("div");
    powerWrapper.id = "powerWrapper";

    let powerDisplay = document.createElement("div");
    powerDisplay.id = "powerDisplay";
    powerDisplay.style.width = `${gameState.redShip.power}%`;

    powerWrapper.appendChild(powerDisplay);

    let healthWrapper = document.createElement("div");
    healthWrapper.id = "healthWrapper";

    let healthDisplay = document.createElement("div");
    healthDisplay.id = "healthDisplay";
    healthDisplay.style.width = `${gameState.redShip.health}%`;

    healthWrapper.appendChild(healthDisplay);

    controlBox.appendChild(damageWrapper);
    controlBox.appendChild(powerWrapper);
    controlBox.appendChild(healthWrapper);

    uiWrapper.appendChild(messageBox);
    uiWrapper.appendChild(controlBox);

    // Red mouse events
    window.addEventListener("mousedown", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (event.clientX > 0 && event.clientX < canvasWidth && event.clientY > 0 && event.clientY < canvasHeight) {
        mouseOnCanvas = Date.now();
        mouseX = event.clientX;
        mouseY = event.clientY;
      } else {
        mouseOnCanvas = -1;
      }
    });
    window.addEventListener("mousemove", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (mouseOnCanvas === -1) {
        return;
      }

      if (event.clientX > 0 && event.clientX < canvasWidth && event.clientY > 0 && event.clientY < canvasHeight) {
        mouseX = event.clientX;
        mouseY = event.clientY;
      } else {
        mouseOnCanvas = -1;
        socket.emit("updateRed", gameCode, 0);
      }
    });
    window.addEventListener("mouseup", (event) => {
      if (Date.now() - mouseOnCanvas > 200) {
        socket.emit("updateRed", gameCode, 0);
      } else {
        let canvasWidth = window.innerHeight;
        let canvasHeight = window.innerHeight;

        let angle = Math.atan((mouseY * (1000 / canvasHeight) - redShip.y) / (mouseX * (1000 / canvasHeight) - redShip.x));
        if (mouseX * (1000 / canvasHeight) < redShip.x) {
          angle += Math.PI;
        }
        socket.emit("fire", gameCode, getTeam(), angle, getDamage(), getRange());
      }
      mouseOnCanvas = -1;
    });

    // Red touch events
    window.addEventListener("touchstart", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      let touch = event.touches[0] || event.changedTouches[0];
      let touchX = touch.pageX;
      let touchY = touch.pageY;

      if (touchX > 0 && touchX < canvasWidth && touchY > 0 && touchY < canvasHeight) {
        mouseX = touchX;
        mouseY = touchY;
        mouseOnCanvas = Date.now();
      } else {
        mouseOnCanvas = -1;
      }
    });
    window.addEventListener("touchmove", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (mouseOnCanvas === -1) {
        return;
      }

      let touch = event.touches[0] || event.changedTouches[0];
      let touchX = touch.pageX;
      let touchY = touch.pageY;

      if (touchX > 0 && touchX < canvasWidth && touchY > 0 && touchY < canvasHeight) {
        mouseX = touchX;
        mouseY = touchY;
      } else {
        mouseOnCanvas = -1;
        socket.emit("updateRed", gameCode, 0);
      }
    });
    window.addEventListener("touchend", (event) => {
      if (Date.now() - mouseOnCanvas > 200) {
        socket.emit("updateRed", gameCode, 0);
      } else {
        let canvasWidth = window.innerHeight;
        let canvasHeight = window.innerHeight;

        let angle = Math.atan((mouseY * (1000 / canvasHeight) - redShip.y) / (mouseX * (1000 / canvasHeight) - redShip.x));
        if (mouseX * (1000 / canvasHeight) < redShip.x) {
          angle += Math.PI;
        }
        socket.emit("fire", gameCode, getTeam(), angle, getDamage(), getRange());
      }
      mouseOnCanvas = -1;
    });
  } else if (playerPosition === "blueOC") {
    let messageBox = document.createElement("div");
    messageBox.id = "messageBox";

    let controlBox = document.createElement("div");
    controlBox.id = "controlBox";

    let damageWrapper = document.createElement("div");
    damageWrapper.id = "damageWrapper";

    let damageLabel = document.createElement("div");
    damageLabel.textContent = "Missile damage:";
    damageLabel.id = "damageLabel";

    let damageInput = document.createElement("input");
    damageInput.type = "range";
    damageInput.id = "damageInput";
    damageInput.name = "damageInput";
    damageInput.min = "0";
    damageInput.max = "100";
    damageInput.step = "1";

    damageWrapper.appendChild(damageLabel);
    damageWrapper.appendChild(damageInput);

    let powerWrapper = document.createElement("div");
    powerWrapper.id = "powerWrapper";

    let powerDisplay = document.createElement("div");
    powerDisplay.id = "powerDisplay";
    powerDisplay.style.width = `${gameState.blueShip.power}%`;

    powerWrapper.appendChild(powerDisplay);

    let healthWrapper = document.createElement("div");
    healthWrapper.id = "healthWrapper";

    let healthDisplay = document.createElement("div");
    healthDisplay.id = "healthDisplay";
    healthDisplay.style.width = `${gameState.redShip.health}%`;

    healthWrapper.appendChild(healthDisplay);

    controlBox.appendChild(damageWrapper);
    controlBox.appendChild(powerWrapper);
    controlBox.appendChild(healthWrapper);

    uiWrapper.appendChild(messageBox);
    uiWrapper.appendChild(controlBox);

    // Blue mouse events
    window.addEventListener("mousedown", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (event.clientX > 0 && event.clientX < canvasWidth && event.clientY > 0 && event.clientY < canvasHeight) {
        mouseX = event.clientX;
        mouseY = event.clientY;
        mouseOnCanvas = Date.now();
      } else {
        mouseOnCanvas = -1;
      }
    });
    window.addEventListener("mousemove", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (mouseOnCanvas === -1) {
        return;
      }

      if (event.clientX > 0 && event.clientX < canvasWidth && event.clientY > 0 && event.clientY < canvasHeight) {
        mouseX = event.clientX;
        mouseY = event.clientY;
      } else {
        mouseOnCanvas = -1;
        socket.emit("updateBlue", gameCode, 0);
      }
    });
    window.addEventListener("mouseup", (event) => {
      if (Date.now() - mouseOnCanvas > 200) {
        socket.emit("updateBlue", gameCode, 0);
      } else {
        let canvasWidth = window.innerHeight;
        let canvasHeight = window.innerHeight;

        let angle = Math.atan((mouseY * (1000 / canvasHeight) - blueShip.y) / (mouseX * (1000 / canvasHeight) - blueShip.x));
        if (mouseX * (1000 / canvasHeight) < blueShip.x) {
          angle += Math.PI;
        }
        socket.emit("fire", gameCode, getTeam(), angle, getDamage(), getRange());
      }
      mouseOnCanvas = -1;
    });

    // Blue touch events
    window.addEventListener("touchstart", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      let touch = event.touches[0] || event.changedTouches[0];
      let touchX = touch.pageX;
      let touchY = touch.pageY;

      if (touchX > 0 && touchX < canvasWidth && touchY > 0 && touchY < canvasHeight) {
        mouseX = touchX;
        mouseY = touchY;
        mouseOnCanvas = Date.now();
      } else {
        mouseOnCanvas = -1;
      }
    });
    window.addEventListener("touchmove", (event) => {
      let canvasWidth = window.innerHeight;
      let canvasHeight = window.innerHeight;

      if (mouseOnCanvas === -1) {
        return;
      }

      let touch = event.touches[0] || event.changedTouches[0];
      let touchX = touch.pageX;
      let touchY = touch.pageY;

      if (touchX > 0 && touchX < canvasWidth && touchY > 0 && touchY < canvasHeight) {
        mouseX = touchX;
        mouseY = touchY;
      } else {
        mouseOnCanvas = -1;
        socket.emit("updateBlue", gameCode, 0);
      }
    });
    window.addEventListener("touchend", (event) => {
      if (Date.now() - mouseOnCanvas > 200) {
        socket.emit("updateBlue", gameCode, 0);
      } else {
        let canvasWidth = window.innerHeight;
        let canvasHeight = window.innerHeight;

        let angle = Math.atan((mouseY * (1000 / canvasHeight) - blueShip.y) / (mouseX * (1000 / canvasHeight) - blueShip.x));
        if (mouseX * (1000 / canvasHeight) < blueShip.x) {
          angle += Math.PI;
        }
        socket.emit("fire", gameCode, getTeam(), angle, getDamage(), getRange());
      }
      mouseOnCanvas = -1;
    });
  } else if (playerPosition === "redIC" || playerPosition === "blueIC") {
    uiWrapper.innerHTML = `
        <div id="chatWrapper">
            <div id="messageWrapper"></div>
            <div id="messageInputWrapper">
                <input type="text" id="messageInput" name="messageInput">
                <div id="messageInputBtnAlly">Ally</div>
                <div id="messageInputBtnEnemy">Enemy</div>
            </div>
        </div>
    `;
  }

  document.getElementById("gameWrapper").appendChild(canvas);
  document.getElementById("gameWrapper").appendChild(uiWrapper);

  if (playerPosition === "redIC" || playerPosition == "blueIC") {
    document.getElementById("messageInputBtnAlly").addEventListener("click", () => {
      if (document.getElementById("messageInput").value === "") {
        return;
      }
      socket.emit("message", gameCode, getTeam(), getTeam(), document.getElementById("messageInput").value);
      document.getElementById("messageInput").value = "";
    });
    document.getElementById("messageInputBtnEnemy").addEventListener("click", () => {
      if (document.getElementById("messageInput").value === "") {
        return;
      }
      socket.emit("message", gameCode, getTeam(), (getTeam() + 1) % 2, document.getElementById("messageInput").value);
      document.getElementById("messageInput").value = "";
    });
    document.getElementById("messageInput").addEventListener("keypress", (event) => {
      if (event.key === "Enter" && document.getElementById("messageInput").value !== "") {
        if (event.shiftKey) {
          socket.emit("message", gameCode, getTeam(), (getTeam() + 1) % 2, document.getElementById("messageInput").value);
        } else {
          socket.emit("message", gameCode, getTeam(), getTeam(), document.getElementById("messageInput").value);
        }
        document.getElementById("messageInput").value = "";
      }
    });
  }
});

socket.on("message", (author, receiver, message) => {
  console.log(author);
  console.log(receiver);
  console.log(message);
  if ((playerPosition === "redOC" && receiver === 0) || (playerPosition === "blueOC" && receiver === 1)) {
    let messageElement = document.createElement("div");
    messageElement.className = "messageElement";

    let messageRevealButton = document.createElement("div");
    messageRevealButton.className = "messageRevealButton";
    messageRevealButton.textContent = "Unknown:";
    if (author === receiver) {
      messageRevealButton.addEventListener("click", () => {
        if (messageRevealButton.textContent !== "Unknown:") {
          return;
        }

        axios.post("/canReveal", { gameCode: gameCode, team: getTeam() }).then((res) => {
          if (res.data.canReveal === true) {
            messageRevealButton.textContent = "Ally:";
            socket.emit("revealMessage", gameCode, getTeam());
          }
        });
      });
    } else {
      messageRevealButton.addEventListener("click", () => {
        if (messageRevealButton.textContent !== "Unknown:") {
          return;
        }

        axios.post("/canReveal", { gameCode: gameCode, team: getTeam() }).then((res) => {
          if (res.data.canReveal === true) {
            messageRevealButton.textContent = "Enemy:";
            socket.emit("revealMessage", gameCode, getTeam());
          }
        });
      });
    }

    let messageContent = document.createElement("div");
    messageContent.className = "messageContent";
    messageContent.textContent = message;

    messageElement.appendChild(messageRevealButton);
    messageElement.appendChild(messageContent);

    document.getElementById("messageBox").appendChild(messageElement);
    document.getElementById("messageBox").scrollTop = document.getElementById("messageBox").scrollHeight;
  }
});

socket.on("updateGame", (gameState) => {
  redShip.x = gameState.redShip.x;
  redShip.y = gameState.redShip.y;
  redShip.angle = gameState.redShip.angle;
  blueShip.x = gameState.blueShip.x;
  blueShip.y = gameState.blueShip.y;
  blueShip.angle = gameState.blueShip.angle;

  missiles = [];
  for (let i = 0; i < gameState.missiles.length; i++) {
    missiles.push(gameState.missiles[i]);
  }

  fuels = [];
  for (let i = 0; i < gameState.fuels.length; i++) {
    fuels.push(gameState.fuels[i]);
  }

  if (playerPosition === "redOC") {
    document.getElementById("powerDisplay").style.width = `${gameState.redShip.power}%`;
    document.getElementById("healthDisplay").style.width = `${gameState.redShip.health}%`;
  } else if (playerPosition === "blueOC") {
    document.getElementById("powerDisplay").style.width = `${gameState.blueShip.power}%`;
    document.getElementById("healthDisplay").style.width = `${gameState.blueShip.health}%`;
  }
});

socket.on("gameWin", (winner) => {
  gameWinner = winner;
  winTime = Date.now();
  setTimeout(function () {
    alert("game win");
  }, 3000);
});

function animate() {
  requestAnimationFrame(animate);

  if (mouseOnCanvas !== -1) {
    if (Date.now() - mouseOnCanvas > 200) {
      if (playerPosition === "redOC") {
        let canvasWidth = window.innerHeight;
        let canvasHeight = window.innerHeight;

        let forwardVector = [-Math.sin(redShip.angle), Math.cos(redShip.angle)];
        let targetVector = [mouseX * (1000 / canvasWidth) - redShip.x, mouseY * (1000 / canvasHeight) - redShip.y];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] + forwardVector[1] * targetVector[1]) /
          Math.sqrt(targetVector[0] * targetVector[0] + targetVector[1] * targetVector[1]);
        console.log(targetAngularVelocity);
        socket.emit("updateRed", gameCode, targetAngularVelocity);
      } else if (playerPosition === "blueOC") {
        let canvasWidth = window.innerHeight;
        let canvasHeight = window.innerHeight;

        let forwardVector = [-Math.sin(blueShip.angle), Math.cos(blueShip.angle)];
        let targetVector = [mouseX * (1000 / canvasWidth) - blueShip.x, mouseY * (1000 / canvasHeight) - blueShip.y];

        let targetAngularVelocity =
          (forwardVector[0] * targetVector[0] + forwardVector[1] * targetVector[1]) /
          Math.sqrt(targetVector[0] * targetVector[0] + targetVector[1] * targetVector[1]);
        console.log(targetAngularVelocity);
        socket.emit("updateBlue", gameCode, targetAngularVelocity);
      }
    }
  }

  // ctx.fillStyle = "white";
  // ctx.fillRect(0, 0, canvas.width, canvas.height);

  var img = new Image();
  img.src = "/media/images/canvas_bg.jpg";

  img.onload = function () {
    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  if (playerPosition !== "blueOC") {
    if (gameWinner !== 1) {
      redShip.draw();
    }
  }
  if (playerPosition !== "redOC") {
    if (gameWinner !== 0) {
      blueShip.draw();
    }
  }
  if (gameWinner === 0) {
    // Draw sinking blue ship
  } else if (gameWinner === 1) {
    // Draw sinking red ship
  }

  for (let i = 0; i < missiles.length; i++) {
    if (!(missiles[i].team === 0 && playerPosition === "blueOC") && !(missiles[i].team === 1 && playerPosition === "redOC")) {
      drawMissile(missiles[i].x, missiles[i].y);
    }
  }

  for (let i = 0; i < fuels.length; i++) {
    if (playerPosition === "redIC" || playerPosition === "blueIC") {
      drawFuel(fuels[i].x, fuels[i].y);
    }
  }
}
