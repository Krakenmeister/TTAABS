let playerPosition = getCookie("position");
let gameCode = getCookie("gameCode");

console.log(playerPosition);
console.log(gameCode);

let socket = io();

// Load all images before joining game so that there is no delay in drawing them to canvas
let missileImg, redShipImg, blueShipImg, fuelImg;
let missilePromise = loadImage("/media/images/missile_short.png");
let redShipPromise = loadImage("/media/images/ship_red.png");
let blueShipPromise = loadImage("/media/images/ship_blue.png");
let fuelPromise = loadImage("/media/images/gascan.png");

let backgroundImages = [];
let backgroundPromises = [];
for (let i = 0; i < 750; i++) {
  backgroundPromises.push(loadImage(`/media/images/waterbackground/${i + 1}.png`));
}

Promise.all(backgroundPromises).then((imgs) => {
  backgroundImages = imgs;
  Promise.all([missilePromise, redShipPromise, blueShipPromise, fuelPromise]).then(([img1, img2, img3, img4]) => {
    missileImg = img1;
    redShipImg = img2;
    blueShipImg = img3;
    fuelImg = img4;
    socket.emit("joinGame", gameCode, playerPosition);
  });
});

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
  return 55;
}

function drawMissile(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  ctx.drawImage(missileImg, -5, -15, 10, 30);
  ctx.restore();
}

function drawFuel(x, y) {
  ctx.save();
  ctx.translate(x, y);
  // ctx.rotate(angle + Math.PI / 2);
  ctx.drawImage(fuelImg, -12, -14, 24, 28);
  ctx.restore();

  // ctx.beginPath();
  // ctx.arc(x, y, 10, 0, Math.PI * 2, false);
  // ctx.fillStyle = "yellow";
  // ctx.fill();
}

class Battleship {
  constructor(x, y, angle, color) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.color = color;
  }

  draw() {
    ctx.save(); // Save the current state of the canvas
    ctx.translate(this.x, this.y); // Translate to the object's position
    ctx.rotate(this.angle + Math.PI / 2); // Rotate the canvas by the object's angle
    ctx.drawImage(this.color === "red" ? redShipImg : blueShipImg, -16, -50, 32, 100); // Draw the image centered at the object's position
    ctx.restore(); // Restore the canvas to its previous state
  }
}

let missiles = [];
let fuels = [];

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
          playerListValue.textContent = "Player Ready";
        } else {
          playerListValue.textContent = "---";
        }
        break;
      case 1:
        if (players["redIC"]) {
          playerListValue.textContent = "Player Ready";
        } else {
          playerListValue.textContent = "---";
        }
        break;
      case 2:
        if (players["blueOC"]) {
          playerListValue.textContent = "Player Ready";
        } else {
          playerListValue.textContent = "---";
        }
        break;
      case 3:
        if (players["blueIC"]) {
          playerListValue.textContent = "Player Ready";
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
let pingLoop = -1;
let ambienceLoop = -1;
let backgroundFrame;
let frameDirection;
socket.on("startGame", async (gameState, narrativeMessages) => {
  if (narrativeMessages) {
    removeAllChildNodes(document.getElementById("gameWrapper"));
    document.getElementById("gameWrapper").style.backgroundColor = "black";

    let narrativeWrapper = document.createElement("div");
    narrativeWrapper.id = "narrativeWrapper";

    let narrativeMessage1 = document.createElement("div");
    let narrativeMessage2 = document.createElement("div");
    let narrativeMessage3 = document.createElement("div");
    let narrativeMessage4 = document.createElement("div");

    narrativeWrapper.appendChild(narrativeMessage1);
    narrativeWrapper.appendChild(narrativeMessage2);
    narrativeWrapper.appendChild(narrativeMessage3);
    narrativeWrapper.appendChild(narrativeMessage4);

    document.getElementById("gameWrapper").appendChild(narrativeWrapper);

    await printMessageToElement(narrativeMessage1, narrativeMessages[0]);
    await delay(500);
    await printMessageToElement(narrativeMessage2, narrativeMessages[1]);
    await delay(500);
    await printMessageToElement(narrativeMessage3, narrativeMessages[2]);
    await delay(750);
    await printMessageToElement(narrativeMessage4, narrativeMessages[3 + getTeam()]);
    await delay(2000);
  }

  gameWinner = -1;
  winTime = -1;
  pingLoop = -1;
  ambienceLoop = -1;

  playPing();
  playAmbience();
  pingLoop = setInterval(playPing, 5000);
  ambienceLoop = setInterval(playAmbience, 320000);

  socket.emit("greenLight", gameCode);

  removeAllChildNodes(document.getElementById("gameWrapper"));
  document.getElementById("gameWrapper").style.color = "white";

  redShip = new Battleship(gameState.redShip.x, gameState.redShip.y, gameState.redShip.angle, "red");
  blueShip = new Battleship(gameState.blueShip.x, gameState.blueShip.y, gameState.blueShip.angle, "blue");

  canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";
  canvas.width = 1000;
  canvas.height = 1000;
  ctx = canvas.getContext("2d");

  uiWrapper = document.createElement("div");
  uiWrapper.id = "uiWrapper";
  uiWrapper.style.backgroundColor = "black";
  uiWrapper.style.color = "#39FF14";
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

  backgroundFrame = 0;
  frameDirection = 1;
  animate();

  if (playerPosition === "redOC") {
    let messageBox = document.createElement("div");
    messageBox.id = "messageBox";

    let controlBox = document.createElement("div");
    controlBox.id = "controlBox";

    let damageWrapper = document.createElement("div");
    damageWrapper.id = "damageWrapper";

    let damageLabel = document.createElement("div");
    damageLabel.textContent = "Missile power:";
    damageLabel.id = "damageLabel";

    let damageInput = document.createElement("input");
    damageInput.type = "range";
    damageInput.id = "damageInput";
    damageInput.name = "damageInput";
    damageInput.min = "20";
    damageInput.max = "100";
    damageInput.step = "1";
    damageInput.value = "100";
    damageInput.style.background = `linear-gradient(to right, #39ff14 100%, white 100%)`;
    damageInput.addEventListener("input", (event) => {
      const tempSliderValue = event.target.value;
      const tempSliderMax = event.target.max;
      const tempSliderMin = event.target.min;
      const progress = ((tempSliderValue - tempSliderMin) / (tempSliderMax - tempSliderMin)) * 100;

      document.getElementById("damageAmount").textContent = tempSliderValue;

      document.getElementById("damageInput").style.background = `linear-gradient(to right, #39ff14 ${progress}%, white ${progress}%)`;
    });

    let damageAmount = document.createElement("div");
    damageAmount.textContent = "100";
    damageAmount.id = "damageAmount";

    damageWrapper.appendChild(damageLabel);
    damageWrapper.appendChild(damageInput);
    damageWrapper.appendChild(damageAmount);

    let powerWrapper = document.createElement("div");
    powerWrapper.id = "powerWrapper";

    let powerLabel = document.createElement("div");
    powerLabel.id = "powerLabel";
    powerLabel.textContent = "Power:";

    let powerDisplayWrapper = document.createElement("div");
    powerDisplayWrapper.id = "powerDisplayWrapper";

    let powerDisplay = document.createElement("div");
    powerDisplay.id = "powerDisplay";
    powerDisplay.style.width = `${gameState.blueShip.power}%`;

    powerDisplayWrapper.appendChild(powerDisplay);

    powerWrapper.appendChild(powerLabel);
    powerWrapper.appendChild(powerDisplayWrapper);

    let healthWrapper = document.createElement("div");
    healthWrapper.id = "healthWrapper";

    let healthLabel = document.createElement("div");
    healthLabel.id = "healthLabel";
    healthLabel.textContent = "Health:";

    let healthDisplayWrapper = document.createElement("div");
    healthDisplayWrapper.id = "healthDisplayWrapper";

    let healthDisplay = document.createElement("div");
    healthDisplay.id = "healthDisplay";
    healthDisplay.style.width = `${gameState.redShip.health}%`;

    healthDisplayWrapper.appendChild(healthDisplay);

    healthWrapper.appendChild(healthLabel);
    healthWrapper.appendChild(healthDisplayWrapper);

    let roleWrapper = document.createElement("div");
    roleWrapper.id = "roleWrapper";
    roleWrapper.textContent = "Red Operations Commander";

    controlBox.appendChild(damageWrapper);
    controlBox.appendChild(powerWrapper);
    controlBox.appendChild(healthWrapper);
    controlBox.appendChild(roleWrapper);

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
    damageLabel.textContent = "Missile power:";
    damageLabel.id = "damageLabel";

    let damageInput = document.createElement("input");
    damageInput.type = "range";
    damageInput.id = "damageInput";
    damageInput.name = "damageInput";
    damageInput.min = "20";
    damageInput.max = "100";
    damageInput.step = "1";
    damageInput.value = "100";
    damageInput.style.background = `linear-gradient(to right, #39ff14 100%, white 100%)`;
    damageInput.addEventListener("input", (event) => {
      const tempSliderValue = event.target.value;
      const tempSliderMax = event.target.max;
      const tempSliderMin = event.target.min;
      const progress = ((tempSliderValue - tempSliderMin) / (tempSliderMax - tempSliderMin)) * 100;

      document.getElementById("damageAmount").textContent = tempSliderValue;

      document.getElementById("damageInput").style.background = `linear-gradient(to right, #39ff14 ${progress}%, white ${progress}%)`;
    });

    let damageAmount = document.createElement("div");
    damageAmount.textContent = "100";
    damageAmount.id = "damageAmount";

    damageWrapper.appendChild(damageLabel);
    damageWrapper.appendChild(damageInput);
    damageWrapper.appendChild(damageAmount);

    let powerWrapper = document.createElement("div");
    powerWrapper.id = "powerWrapper";

    let powerLabel = document.createElement("div");
    powerLabel.id = "powerLabel";
    powerLabel.textContent = "Power:";

    let powerDisplayWrapper = document.createElement("div");
    powerDisplayWrapper.id = "powerDisplayWrapper";

    let powerDisplay = document.createElement("div");
    powerDisplay.id = "powerDisplay";
    powerDisplay.style.width = `${gameState.blueShip.power}%`;

    powerDisplayWrapper.appendChild(powerDisplay);

    powerWrapper.appendChild(powerLabel);
    powerWrapper.appendChild(powerDisplayWrapper);

    let healthWrapper = document.createElement("div");
    healthWrapper.id = "healthWrapper";

    let healthLabel = document.createElement("div");
    healthLabel.id = "healthLabel";
    healthLabel.textContent = "Health:";

    let healthDisplayWrapper = document.createElement("div");
    healthDisplayWrapper.id = "healthDisplayWrapper";

    let healthDisplay = document.createElement("div");
    healthDisplay.id = "healthDisplay";
    healthDisplay.style.width = `${gameState.redShip.health}%`;

    healthDisplayWrapper.appendChild(healthDisplay);

    healthWrapper.appendChild(healthLabel);
    healthWrapper.appendChild(healthDisplayWrapper);

    let roleWrapper = document.createElement("div");
    roleWrapper.id = "roleWrapper";
    roleWrapper.textContent = "Blue Operations Commander";

    controlBox.appendChild(damageWrapper);
    controlBox.appendChild(powerWrapper);
    controlBox.appendChild(healthWrapper);
    controlBox.appendChild(roleWrapper);

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
            <div id="roleWrapper">${playerPosition === "redIC" ? "Red Intelligence Commander" : "Blue Intelligence Commander"}</div>
            <div id="messageInputWrapper">
                <input type="text" id="messageInput" name="messageInput" placeholder="Enter to Ally, Shift+Enter to Enemy">
                <div id="messageInputBtnAlly">Ally</div>
                <div id="messageInputBtnEnemy">Enemy</div>
            </div>
            <div id="messageWrapper"></div>
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

    document.getElementById("messageBox").prepend(messageElement);
    document.getElementById("messageBox").scrollTop = document.getElementById("messageBox").scrollHeight;

    // printMessageToElement(messageContent, message);
  } else if (playerPosition === "redIC" || playerPosition === "blueIC") {
    let messageElement = document.createElement("div");
    messageElement.className = "messageElement";

    let messageInfo = document.createElement("div");
    messageInfo.className = "messageInfo";
    let messageInfoString = "";
    if (author === getTeam()) {
      messageInfoString += "You";
    } else {
      messageInfoString += "Enemy";
    }
    messageInfoString += " to ";
    if (receiver === getTeam()) {
      messageInfoString += "Ally";
    } else {
      messageInfoString += "Enemy";
    }
    messageInfoString += ":";
    messageInfo.textContent = messageInfoString;

    let messageContent = document.createElement("div");
    messageContent.className = "messageContent";
    messageContent.textContent = message;

    messageElement.appendChild(messageInfo);
    messageElement.appendChild(messageContent);

    document.getElementById("messageWrapper").prepend(messageElement);
    document.getElementById("messageWrapper").scrollTop = document.getElementById("messageWrapper").scrollHeight;

    // printMessageToElement(messageContent, message);
  }
});

socket.on("fireDud", (team) => {
  if (team === 0 && playerPosition === "redOC") {
    document.getElementById("powerDisplay").className = "blink";
    setTimeout(() => {
      document.getElementById("powerDisplay").className = "";
    }, 1000);
    dud.play();
  } else if (team === 1 && playerPosition === "blueOC") {
    document.getElementById("powerDisplay").className = "blink";
    setTimeout(() => {
      document.getElementById("powerDisplay").className = "";
    }, 1000);
    dud.play();
  }
});

socket.on("fireSuccess", (team, damage) => {
  if (
    (playerPosition === "redOC" && team === 0) ||
    (playerPosition === "blueOC" && team === 1) ||
    playerPosition === "redIC" ||
    playerPosition === "blueIC"
  ) {
    missile.volume = damage / 100;
    missile.load();
    missile.play();
  }
});

socket.on("hit", (team) => {
  if (
    (playerPosition === "redOC" && team === 0) ||
    (playerPosition === "blueOC" && team === 1) ||
    playerPosition === "redIC" ||
    playerPosition === "blueIC"
  ) {
    damage.load();
    damage.play();
  }
});

socket.on("miss", (x, y) => {
  if (playerPosition === "redIC" || playerPosition === "blueIC") {
    miss.load();
    miss.play();
  }
  bigDisturb(x, y);
});

async function bigDisturb(x, y) {
  for (let i = 0; i < 10; i++) {
    disturb(x, y);
    await delay(10);
  }
}

socket.on("fuel", (team) => {
  if (
    (playerPosition === "redOC" && team === 0) ||
    (playerPosition === "blueOC" && team === 1) ||
    playerPosition === "redIC" ||
    playerPosition === "blueIC"
  ) {
    power.load();
    power.play();
  }
});

const disturbArea = 5;
socket.on("updateGame", (gameState) => {
  redShip.x = gameState.redShip.x;
  redShip.y = gameState.redShip.y;
  redShip.angle = gameState.redShip.angle;
  redShip.health = gameState.redShip.health;
  blueShip.x = gameState.blueShip.x;
  blueShip.y = gameState.blueShip.y;
  blueShip.angle = gameState.blueShip.angle;
  blueShip.health = gameState.blueShip.health;

  disturb(redShip.x + 2 * disturbArea * Math.random() - disturbArea, redShip.y + 2 * disturbArea * Math.random() - disturbArea);
  disturb(blueShip.x + 2 * disturbArea * Math.random() - disturbArea, blueShip.y + 2 * disturbArea * Math.random() - disturbArea);

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
  if (pingLoop != -1) {
    clearInterval(pingLoop);
  }
  if (ambienceLoop != -1) {
    clearInterval(ambienceLoop);
  }
  gameWinner = winner;
  winTime = Date.now();

  let blackoutX, blackoutY;
  if (winner === 0) {
    blackoutX = blueShip.x * (window.innerHeight / 1000);
    blackoutY = blueShip.y * (window.innerHeight / 1000);
  } else if (winner === 1) {
    blackoutX = redShip.x * (window.innerHeight / 1000);
    blackoutY = redShip.y * (window.innerHeight / 1000);
  }
  blackout(blackoutX, blackoutY);

  setTimeout(() => {
    removeAllChildNodes(document.getElementById("gameWrapper"));
    if (document.getElementById("blackoutCanvas")) {
      document.getElementById("blackoutCanvas").remove();
    }

    let winnerElement = document.createElement("div");
    winnerElement.id = "winnerElement";
    if (gameWinner === 0) {
      winnerElement.textContent = "Red Team Wins!";
    } else if (gameWinner === 1) {
      winnerElement.textContent = "Blue Team Wins!";
    }

    document.getElementById("gameWrapper").appendChild(winnerElement);
  }, 5000);
});

let waterWidth = 1000;
let waterHeight = 1000;
let waterHalfWidth = waterWidth >> 1;
let waterHalfHeight = waterHeight >> 1;
let waterSize = waterWidth * (waterHeight + 2) * 2;
let oldind = waterWidth;
let newind = waterWidth * (waterHeight + 3);
let riprad = 5;
let ripplemap = [];
let last_map = [];
let ripple;
let waterTexture;

for (var i = 0; i < waterSize; i++) {
  last_map[i] = ripplemap[i] = 0;
}

function disturb(dx, dy) {
  dx <<= 0;
  dy <<= 0;

  for (let j = dy - riprad; j < dy + riprad; j++) {
    for (let k = dx - riprad; k < dx + riprad; k++) {
      ripplemap[oldind + j * waterWidth + k] += 128;
    }
  }
}

function newframe() {
  let a, b, data, cur_pixel, new_pixel, old_data;

  let t = oldind;
  oldind = newind;
  newind = t;
  let i = 0;

  // create local copies of variables to decrease
  // scope lookup time in Firefox
  let _width = waterWidth,
    _height = waterHeight,
    _ripplemap = ripplemap,
    _last_map = last_map,
    _rd = ripple.data,
    _td = waterTexture.data,
    _half_width = waterHalfWidth,
    _half_height = waterHalfHeight;

  for (let y = 0; y < _height; y++) {
    for (let x = 0; x < _width; x++) {
      let _newind = newind + i,
        _mapind = oldind + i;
      data = (_ripplemap[_mapind - _width] + _ripplemap[_mapind + _width] + _ripplemap[_mapind - 1] + _ripplemap[_mapind + 1]) >> 1;

      data -= _ripplemap[_newind];
      data -= data >> 5;

      _ripplemap[_newind] = data;

      //where data=0 then still, where data>0 then wave
      data = 1024 - data;

      old_data = _last_map[i];
      _last_map[i] = data;

      if (old_data != data) {
        //offsets
        a = ((((x - _half_width) * data) / 1024) << 0) + _half_width;
        b = ((((y - _half_height) * data) / 1024) << 0) + _half_height;

        //bounds check
        if (a >= _width) a = _width - 1;
        if (a < 0) a = 0;
        if (b >= _height) b = _height - 1;
        if (b < 0) b = 0;

        new_pixel = (a + b * _width) * 4;
        cur_pixel = i * 4;

        _rd[cur_pixel] = _td[new_pixel];
        _rd[cur_pixel + 1] = _td[new_pixel + 1];
        _rd[cur_pixel + 2] = _td[new_pixel + 2];
      }

      ++i;
    }
  }
}

function animate() {
  if (gameWinner !== -1) {
    return;
  }
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
        targetAngularVelocity = (targetAngularVelocity / Math.abs(targetAngularVelocity)) * Math.sqrt(Math.abs(targetAngularVelocity));
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
        targetAngularVelocity = (targetAngularVelocity / Math.abs(targetAngularVelocity)) * Math.sqrt(Math.abs(targetAngularVelocity));
        console.log(targetAngularVelocity);
        socket.emit("updateBlue", gameCode, targetAngularVelocity);
      }
    }
  }

  backgroundFrame = backgroundFrame + frameDirection;
  if (backgroundFrame >= 749 || backgroundFrame <= 0) {
    frameDirection *= -1;
  }

  ctx.save();
  ctx.drawImage(backgroundImages[backgroundFrame], 0, 0, canvas.width, canvas.height);
  ctx.restore();

  let fogData = ctx.getImageData(0, 0, waterWidth, waterHeight);

  waterTexture = ctx.getImageData(0, 0, waterWidth, waterHeight);
  ripple = ctx.getImageData(0, 0, waterWidth, waterHeight);
  newframe();
  ctx.putImageData(ripple, 0, 0);

  redShip.draw();
  blueShip.draw();

  for (let i = 0; i < fuels.length; i++) {
    if (playerPosition === "redIC" || playerPosition === "blueIC") {
      drawFuel(fuels[i].x, fuels[i].y);
    }
  }

  for (let i = 0; i < missiles.length; i++) {
    drawMissile(missiles[i].x, missiles[i].y, missiles[i].angle);
  }

  if (gameWinner !== -1) {
    return;
  }

  if (playerPosition === "redOC") {
    let foggedData = ctx.getImageData(0, 0, waterWidth, waterHeight);
    for (let i = 0; i < fogData.data.length; i += 4) {
      let pixelX = (i / 4) % fogData.width;
      let pixelY = Math.floor(i / 4 / fogData.width);
      if (Math.sqrt((pixelX - redShip.x) * (pixelX - redShip.x) + (pixelY - redShip.y) * (pixelY - redShip.y)) > 100) {
        foggedData.data[i] = fogData.data[i] / 2;
        foggedData.data[i + 1] = fogData.data[i + 1] / 2;
        foggedData.data[i + 2] = fogData.data[i + 2] / 2;
      }
    }
    ctx.putImageData(foggedData, 0, 0);
  } else if (playerPosition === "blueOC") {
    let foggedData = ctx.getImageData(0, 0, waterWidth, waterHeight);
    for (let i = 0; i < fogData.data.length; i += 4) {
      let pixelX = (i / 4) % fogData.width;
      let pixelY = Math.floor(i / 4 / fogData.width);
      if (Math.sqrt((pixelX - blueShip.x) * (pixelX - blueShip.x) + (pixelY - blueShip.y) * (pixelY - blueShip.y)) > 100) {
        foggedData.data[i] = fogData.data[i] / 2;
        foggedData.data[i + 1] = fogData.data[i + 1] / 2;
        foggedData.data[i + 2] = fogData.data[i + 2] / 2;
      }
    }
    ctx.putImageData(foggedData, 0, 0);
  }
  for (let i = 0; i < missiles.length; i++) {
    if (!(missiles[i].team === 0 && playerPosition === "blueOC") && !(missiles[i].team === 1 && playerPosition === "redOC")) {
      drawMissile(missiles[i].x, missiles[i].y, missiles[i].angle);
    }
  }
}
