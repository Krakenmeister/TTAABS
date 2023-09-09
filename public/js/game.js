let playerPosition = getCookie("position");
let gameCode = getCookie("gameCode");

let socket = io();

socket.emit("joinGame", gameCode, playerPosition);

let gameCanvas;
if (playerPosition === "redOC" || playerPosition === "blueOC") {
  gameCanvas = document.createElement("canvas");
  gameCanvas.id = "gameCanvas";
} else if (playerPosition === "redIC" || playerPosition === "blueIC") {
  gameCanvas = document.createElement("canvas");
  gameCanvas.id = "gameCanvas";
}
