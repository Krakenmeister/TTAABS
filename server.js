const hostname = "localhost";
const port = 3000;

const http = require("http");
const express = require("express");
const fs = require("fs");
const parser = require("body-parser");
const app = (module.exports = require("express")());
const exec = require("child_process").exec;
const { execSync } = require("child_process");
const path = require("path");
const cookieParser = require("cookie-parser");
const process = require("process");

const server = require("http").Server(app);
const io = require("socket.io")(server);

const router = express.Router();
app.use(
  parser.urlencoded({
    extended: false,
    limit: "20mb",
  })
);
app.use(parser.json({ limit: "20mb" }));
app.use("/", express.static(path.join(__dirname, "/public")));
app.use("/", router);

let games = {};

const createGame = (req, res, next) => {
  let isUniqueCode = false;
  let code;

  while (!isUniqueCode) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    if (!games[`${code}`]) {
      isUniqueCode = true;
    }
  }

  let gameState = {
    players: {
      redOC: null,
      redIC: null,
      blueOC: null,
      redOC: null,
    },
  };
  games[`${code}`] = gameState;
  req.gameCode = code;
  next();
};

const joinGame = (req, res, next) => {
  if (!games[`${req.body.joinCode}`]) {
    req.access = "dne";
    return next();
  }

  let gameState = games[`${req.body.joinCode}`];

  console.log(gameState);

  // Check if the requested position is already filled
  if (gameState.players[`${req.body.joinPosition}`] !== null) {
    req.access = "occupied";
    return next();
  }

  // Check for duplicate name
  for (const playerType in gameState.players) {
    if (gameState.players[playerType] === req.body.joinName) {
      req.access = "duplicate";
      return next();
    }
  }

  // Add the player to the requested position
  gameState.players[`${req.body.joinPosition}`] = {
    name: req.body.joinName,
    hasJoined: false,
  };

  req.access = "granted";
  next();
};

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/html/home.html"));
});

router.get("/play", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/html/play.html"));
});

router.post("/host", createGame, (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ gameCode: req.gameCode }));
});

router.post("/join", joinGame, (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ access: req.access }));
});

router.post("/getCookies", (req, res) => {
  res.cookie("gameCode", req.body.gameCode);
  res.cookie("position", req.body.position);
  res.end();
});

io.on("connection", (socket) => {
  // socket.on("jointtaabs", (roomID, playerID) => {
  // });
});

module.exports = {
  router: router,
};

server.listen(port);
