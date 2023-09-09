let playerPosition = getCookie("position");
let gameCode = getCookie("gameCode");

let socket = io();

socket.emit("joinGame", gameCode, playerPosition);

let canvas;
let ctx;
socket.on("startGame", () => {
  canvas = document.createElement("canvas");
  canvas.id = "gameCanvas";
  canvas.width = 1000;
  canvas.height = 1000;
  ctx = gameCanvas.getContext("2d");
  ctx.fillStyle = "blue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (playerPosition === "redOC" || playerPosition === "blueOC") {
  } else if (playerPosition === "redIC" || playerPosition === "blueIC") {
  }
});
