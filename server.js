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
const revealCost = 33;
const shipSpeed = 0.5;
// const shipAcceleration = 0.008;
const fuelSpawnChance = 0.0003;

const createGame = (req, res, next) => {
  let isUniqueCode = false;
  let code;

  while (!isUniqueCode) {
    const characters = "0123456789";
    code = "";
    for (let i = 0; i < 4; i++) {
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

  // Add the player to the requested position
  gameState.players[`${req.body.joinPosition}`] = {
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

router.post("/canReveal", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  let gameState = games[`${req.body.gameCode}`];
  if (!gameState) {
    res.end(JSON.stringify({ canReveal: false }));
  } else {
    if (req.body.team === 0) {
      res.end(JSON.stringify({ canReveal: gameState.redShip.power > revealCost }));
    } else if (req.body.team === 1) {
      res.end(JSON.stringify({ canReveal: gameState.blueShip.power > revealCost }));
    }
  }
});

io.on("connection", (socket) => {
  socket.on("joinGame", (gameCode, position) => {
    let gameState = games[`${gameCode}`];
    if (!gameState) {
      return;
    }
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
    /*if (allJoined && gameState.redShip) {
      return;
    }*/
    if (allJoined) {
      gameState.redShip = {
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        speed: shipSpeed,
        angle: Math.random() * 2 * Math.PI,
        angularVelocity: 0,
        targetAngularVelocity: 0,
        health: 100,
        power: 100,
      };

      gameState.blueShip = {
        x: Math.random() * worldWidth,
        y: Math.random() * worldHeight,
        speed: shipSpeed,
        angle: Math.random() * 2 * Math.PI,
        angularVelocity: 0,
        targetAngularVelocity: 0,
        health: 100,
        power: 100,
      };

      io.in(gameCode).emit("startGame", gameState);
    } else {
      io.in(gameCode).emit("updateLobby", gameState.players);
    }
  });
  socket.on("updateRed", (gameCode, targetAngularVelocity) => {
    let gameState = games[`${gameCode}`];
    if (!gameState) {
      return;
    }
    if (!gameState.redShip) {
      return;
    }
    gameState.redShip.targetAngularVelocity = targetAngularVelocity;
  });
  socket.on("updateBlue", (gameCode, targetAngularVelocity) => {
    let gameState = games[`${gameCode}`];
    if (!gameState) {
      return;
    }
    if (!gameState.blueShip) {
      return;
    }
    gameState.blueShip.targetAngularVelocity = targetAngularVelocity;
  });
  socket.on("fire", (gameCode, team, angle, damage, range) => {
    let gameState = games[`${gameCode}`];
    if (!gameState) {
      return;
    }

    let x, y, actualDamage;
    if (team === 0) {
      x = gameState.redShip.x;
      y = gameState.redShip.y;
      actualDamage = Math.max(Math.floor((parseInt(damage) / 100) * gameState.redShip.power), 1);
      gameState.redShip.power -= actualDamage;
    } else {
      x = gameState.blueShip.x;
      y = gameState.blueShip.y;
      actualDamage = Math.max(Math.floor((parseInt(damage) / 100) * gameState.blueShip.power), 1);
      gameState.blueShip.power -= actualDamage;
    }

    let newMissile = {
      x: x,
      y: y,
      team: team,
      angle: angle,
      maxTimer: range,
      timer: 0,
      damage: damage,
      speed: 3,
    };
    gameState.missiles.push(newMissile);
  });
  socket.on("message", (gameCode, author, receiver, message) => {
    io.to(gameCode).emit("message", author, receiver, message);
  });
  socket.on("revealMessage", (gameCode, team) => {
    let gameState = games[`${gameCode}`];
    if (!gameState) {
      return;
    }

    if (team === 0) {
      gameState.redShip.power = Math.max(0, gameState.redShip.power - revealCost);
    } else if (team === 1) {
      gameState.blueShip.power = Math.max(0, gameState.blueShip.power - revealCost);
    }
  });
});

setInterval(() => {
  for (let gameCode in games) {
    let gameState = games[`${gameCode}`];

    if (gameState.redShip === null) {
      return;
    }

    //Spawn new fuels
    if (Math.random() < fuelSpawnChance) {
      gameState.fuels.push({ x: Math.random() * worldWidth, y: Math.random() * worldHeight });
    }

    gameState.redShip.power = Math.min(100, gameState.redShip.power + 0.02);
    gameState.blueShip.power = Math.min(100, gameState.blueShip.power + 0.02);

    // Update missiles
    for (let i = 0; i < gameState.missiles.length; i++) {
      gameState.missiles[i].x += gameState.missiles[i].speed * Math.cos(gameState.missiles[i].angle);
      gameState.missiles[i].y += gameState.missiles[i].speed * Math.sin(gameState.missiles[i].angle);
      if (gameState.missiles[i].x > worldWidth) {
        gameState.missiles[i].x -= worldWidth;
      } else if (gameState.missiles[i].x < 0) {
        gameState.missiles[i].x += worldWidth;
      }
      if (gameState.missiles[i].y > worldHeight) {
        gameState.missiles[i].y -= worldHeight;
      } else if (gameState.missiles[i].y < 0) {
        gameState.missiles[i].y += worldHeight;
      }
      gameState.missiles[i].timer += 1;
      if (gameState.missiles[i].timer >= gameState.missiles[i].maxTimer) {
        gameState.missiles.splice(i, 1);
        i--;
      }
    }

    // Update red ship
    gameState.redShip.x += gameState.redShip.speed * Math.cos(gameState.redShip.angle);
    gameState.redShip.y += gameState.redShip.speed * Math.sin(gameState.redShip.angle);

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

    gameState.redShip.angle += gameState.redShip.angularVelocity / 100;
    gameState.redShip.angularVelocity = gameState.redShip.targetAngularVelocity;
    // if (Math.abs(gameState.redShip.targetAngularVelocity - gameState.redShip.angularVelocity) < gameState.redShip.angularAcceleration) {
    //   gameState.redShip.angularVelocity = gameState.redShip.targetAngularVelocity;
    // } else {
    //   gameState.redShip.angularVelocity +=
    //     (gameState.redShip.angularAcceleration * (gameState.redShip.targetAngularVelocity - gameState.redShip.angularVelocity)) /
    //     Math.abs(gameState.redShip.targetAngularVelocity - gameState.redShip.angularVelocity);
    // }

    // Update blue ship
    gameState.blueShip.x += gameState.blueShip.speed * Math.cos(gameState.blueShip.angle);
    gameState.blueShip.y += gameState.blueShip.speed * Math.sin(gameState.blueShip.angle);

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

    gameState.blueShip.angle += gameState.blueShip.angularVelocity / 100;
    gameState.blueShip.angularVelocity = gameState.blueShip.targetAngularVelocity;
    // if (Math.abs(gameState.blueShip.targetAngularVelocity - gameState.blueShip.angularVelocity) < gameState.blueShip.angularAcceleration) {
    //   gameState.blueShip.angularVelocity = gameState.blueShip.targetAngularVelocity;
    // } else {
    //   gameState.blueShip.angularVelocity +=
    //     (gameState.blueShip.angularAcceleration * (gameState.blueShip.targetAngularVelocity - gameState.blueShip.angularVelocity)) /
    //     Math.abs(gameState.blueShip.targetAngularVelocity - gameState.blueShip.angularVelocity);
    // }

    // Detect collisions
    for (let i = 0; i < gameState.missiles.length; i++) {
      if (
        gameState.missiles[i].team === 1 &&
        Math.sqrt(
          (gameState.missiles[i].x - gameState.redShip.x) * (gameState.missiles[i].x - gameState.redShip.x) +
            (gameState.missiles[i].y - gameState.redShip.y) * (gameState.missiles[i].y - gameState.redShip.y)
        ) < 50
      ) {
        gameState.redShip.health -= gameState.missiles[i].damage;
        gameState.missiles.splice(i, 1);
        i--;
      } else if (
        gameState.missiles[i].team === 0 &&
        Math.sqrt(
          (gameState.missiles[i].x - gameState.blueShip.x) * (gameState.missiles[i].x - gameState.blueShip.x) +
            (gameState.missiles[i].y - gameState.blueShip.y) * (gameState.missiles[i].y - gameState.blueShip.y)
        ) < 50
      ) {
        gameState.blueShip.health -= gameState.missiles[i].damage;
        gameState.missiles.splice(i, 1);
        i--;
      }
    }
    for (let i = 0; i < gameState.fuels.length; i++) {
      if (
        Math.sqrt(
          (gameState.fuels[i].x - gameState.redShip.x) * (gameState.fuels[i].x - gameState.redShip.x) +
            (gameState.fuels[i].y - gameState.redShip.y) * (gameState.fuels[i].y - gameState.redShip.y)
        ) < 50
      ) {
        gameState.redShip.power = 100;
        gameState.fuels.splice(i, 1);
      } else if (
        Math.sqrt(
          (gameState.fuels[i].x - gameState.blueShip.x) * (gameState.fuels[i].x - gameState.blueShip.x) +
            (gameState.fuels[i].y - gameState.blueShip.y) * (gameState.fuels[i].y - gameState.blueShip.y)
        ) < 50
      ) {
        gameState.blueShip.power = 100;
        gameState.fuels.splice(i, 1);
      }
    }

    // Check for win
    if (gameState.redShip.health <= 0) {
      io.to(gameCode).emit("gameWin", 1);
      gameState.redShip = null;
      gameState.blueShip = null;

      setTimeout(function () {
        io.in(gameCode).emit("rematch");
        setTimeout(function () {
          gameState.redShip = {
            x: Math.random() * worldWidth,
            y: Math.random() * worldHeight,
            speed: shipSpeed,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            targetAngularVelocity: 0,
            // angularAcceleration: shipAcceleration,
            health: 100,
            power: 100,
          };

          gameState.blueShip = {
            x: Math.random() * worldWidth,
            y: Math.random() * worldHeight,
            speed: shipSpeed,
            angle: Math.random() * 2 * Math.PI,
            angularVelocity: 0,
            targetAngularVelocity: 0,
            // angularAcceleration: shipAcceleration,
            health: 100,
            power: 100,
          };

          gameState.missiles = [];
          gameState.fuels = [];
          gameState.civilians = [];

          console.log(gameState);
          io.in(gameCode).emit("startGame", gameState);
        }, 3000);
      }, 3000);
    } else if (gameState.blueShip.health <= 0) {
      io.to(gameCode).emit("gameWin", 1);
      delete games[`${gameCode}`];

      setTimeout(function () {
        io.in(gameCode).disconnectSockets(true);
      }, 3000);
    } else {
      io.to(gameCode).emit("updateGame", gameState);
    }

    //console.log("Red ship: " + JSON.stringify(gameState.redShip));
    //console.log("Blue ship: " + JSON.stringify(gameState.blueShip));
  }
}, 15);

module.exports = {
  router: router,
};

server.listen(port);
