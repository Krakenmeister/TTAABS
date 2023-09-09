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
const worldWidth = 1000;
const worldHeight = 1000;

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
      blueIC: null,
    },
    redShip: null,
    blueShip: null,
    missiles: [],
    fuels: [],
    civilians: [],
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

  // Check if the requested position is already filled
  if (gameState.players[`${req.body.joinPosition}`] !== null) {
    req.access = "occupied";
    return next();
  }

  // Check for duplicate name
  for (const playerType in gameState.players) {
    if (gameState.players[playerType]) {
      if (gameState.players[playerType].name === req.body.joinName) {
        req.access = "duplicate";
        return next();
      }
    }
  }

  // Add the player to the requested position
  gameState.players[`${req.body.joinPosition}`] = {
    name: req.body.joinName,
    hasJoined: false,
  };

  req.access = "granted";

  for (const playerType in gameState.players) {
    if (gameState.players[playerType] === null) {
    }
  }
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

router.post("/setCookies", (req, res) => {
  res.cookie("gameCode", req.body.gameCode);
  res.cookie("position", req.body.position);
  res.end();
});

io.on("connection", (socket) => {
  socket.on("joinGame", (gameCode, position) => {
    let gameState = games[`${gameCode}`];
    gameState.players[`${position}`].hasJoined = true;

    let allJoined = true;
    for (const playerType in gameState.players) {
      if (gameState.players[playerType]) {
        if (!gameState.players[playerType].hasJoined) {
          allJoined = false;
        }
      } else {
        allJoined = false;
      }
    }

    socket.join(gameCode);
    if (allJoined) {
      gameState.redShip = {
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        speed: 1,
        angle: Math.random() * 2 * Math.PI,
        angularVelocity: 0,
        targetAngularVelocity: 0,
        angularAcceleration: 0.01,
      };

      gameState.blueShip = {
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        speed: 1,
        angle: Math.random() * 2 * Math.PI,
        angularVelocity: 0,
        targetAngularVelocity: 0,
        angularAcceleration: 0.01,
      };

      io.in(gameCode).emit("startGame", gameState);
    } else {
      io.in(gameCode).emit("updateLobby", gameState.players);
    }
  });
});

setInterval(() => {
  for (let gameCode in games) {
    let gameState = games[`${gameCode}`];

    if (gameState.redShip === null) {
      return;
    }

    // Update red ship
    gameState.redShip.x +=
      gameState.redShip.speed * Math.cos(gameState.redShip.angle);
    gameState.redShip.y +=
      gameState.redShip.speed * Math.sin(gameState.redShip.angle);

    if (gameState.redShip.x > worldWidth) {
      gameState.redShip.x -= worldWidth;
    } else if (gameState.redShip.x < 0) {
      gameState.redShip.x += worldWidth;
    }
    if (gameState.redShip.y > worldHeight) {
      gameState.redShip.y -= worldHeight;
    } else if (gameState.redShip.y < 0) {
      gameState.redShip.y += worldHeight;
    }

    gameState.redShip.angle += gameState.redShip.angularVelocity;
    if (
      Math.abs(
        gameState.redShip.targetAngularVelocity -
          gameState.redShip.angularVelocity
      ) < gameState.redShip.angularAcceleration
    ) {
      gameState.redShip.angularVelocity =
        gameState.redShip.targetAngularVelocity;
    } else {
      gameState.redShip.angularVelocity +=
        (gameState.redShip.angularAcceleration *
          (gameState.redShip.targetAngularVelocity -
            gameState.redShip.angularVelocity)) /
        Math.abs(
          gameState.redShip.targetAngularVelocity -
            gameState.redShip.angularVelocity
        );
    }

    // Update blue ship
    gameState.blueShip.x +=
      gameState.blueShip.speed * Math.cos(gameState.blueShip.angle);
    gameState.blueShip.y +=
      gameState.blueShip.speed * Math.sin(gameState.blueShip.angle);

    if (gameState.blueShip.x > worldWidth) {
      gameState.blueShip.x -= worldWidth;
    } else if (gameState.blueShip.x < 0) {
      gameState.blueShip.x += worldWidth;
    }
    if (gameState.blueShip.y > worldHeight) {
      gameState.blueShip.y -= worldHeight;
    } else if (gameState.blueShip.y < 0) {
      gameState.blueShip.y += worldHeight;
    }

    gameState.blueShip.angle += gameState.blueShip.angularVelocity;
    if (
      Math.abs(
        gameState.blueShip.targetAngularVelocity -
          gameState.blueShip.angularVelocity
      ) < gameState.blueShip.angularAcceleration
    ) {
      gameState.blueShip.angularVelocity =
        gameState.blueShip.targetAngularVelocity;
    } else {
      gameState.blueShip.angularVelocity +=
        (gameState.blueShip.angularAcceleration *
          (gameState.blueShip.targetAngularVelocity -
            gameState.blueShip.angularVelocity)) /
        Math.abs(
          gameState.blueShip.targetAngularVelocity -
            gameState.blueShip.angularVelocity
        );
    }

    console.log("Red ship: " + JSON.stringify(gameState.redShip));
    console.log("Blue ship: " + JSON.stringify(gameState.blueShip));

    io.to(gameCode).emit("updateGame", gameState);
  }
}, 15);

module.exports = {
  router: router,
};

server.listen(port);
