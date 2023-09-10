let ping = new Audio("./media/audio/ping.mp3");
let ambience = new Audio("./media/audio/ambience.mp3");
let damage = new Audio("./media/audio/damage.mp3");
let missile = new Audio("./media/audio/missile.mp3");
let dud = new Audio("./media/audio/dud.mp3");
let miss = new Audio("./media/audio/miss.mp3");
let power = new Audio("./media/audio/power.mp3");
let win = new Audio("./media/audio/win.mp3");

let musicloop1 = new Audio("./media/audio/musicloop1.mp3");
let musicloop2 = new Audio("./media/audio/musicloop2.mp3");
let musicloop3 = new Audio("./media/audio/musicloop3.mp3");
let musicloops = [musicloop1, musicloop2, musicloop3];

ping.volume = 0.05;
ambience.volume = 0.25;
power.volume = 0.25;

function playPing() {
  ping.play();
}

function playAmbience() {
  ambience.play();
}

function playDamage() {
  damage.play();
}

function playMissile() {
  missile.play();
}

function playDud() {
  dud.play();
}

function playPower() {
  power.play();
}

function playWin() {
  win.play();
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function verifyName(name) {
  if (name.length > 13) {
    alert("Please pick a shorter name.");
    return false;
  }
  for (let i = 0; i < name.length; i++) {
    let ascii = name.charCodeAt(i);
    if (!(ascii > 47 && ascii < 58) && !(ascii > 64 && ascii < 91) && !(ascii > 96 && ascii < 123)) {
      alert("Please use valid characters in name.");
      return false;
    }
  }
  return true;
}

function getCookie(name) {
  let nameEQ = name + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) == 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

const delay = (delayInms) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

async function printMessageToElement(element, message, printSpeed = 25) {
  if (!element) {
    return;
  }
  let printedMessage = "";
  for (let i = 0; i < message.length; i++) {
    if (!element) {
      return;
    }
    printedMessage += message[i];
    let thisPrintedMessage = printedMessage;
    if (i != message.length - 1) {
      thisPrintedMessage += "_";
    }
    element.textContent = thisPrintedMessage;
    await delay(printSpeed);
  }
  return;
}

const setRandomInterval = (intervalFunction, minDelay, maxDelay) => {
  let timeout;

  const runInterval = () => {
    const timeoutFunction = () => {
      intervalFunction();
      runInterval();
    };

    const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;

    timeout = setTimeout(timeoutFunction, delay);
  };

  runInterval();

  return {
    clear() {
      clearTimeout(timeout);
    },
  };
};

const loadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (err) => reject(err));
    img.src = url;
  });
};

async function blackout(x, y, pauseRadius = 80, pauseTime = 2000) {
  let blackoutCanvas = document.createElement("canvas");
  blackoutCanvas.id = "blackoutCanvas";
  blackoutCanvas.width = window.innerWidth;
  blackoutCanvas.height = window.innerHeight;
  blackoutCanvas.style.width = window.innerWidth;
  blackoutCanvas.style.height = window.innerHeight;
  blackoutCanvas.style.position = "fixed";
  blackoutCanvas.style.left = "0";
  blackoutCanvas.style.top = "0";
  blackoutCanvas.style.zIndex = "1000";

  document.getElementsByTagName("body")[0].appendChild(blackoutCanvas);

  let blackoutCtx = blackoutCanvas.getContext("2d");
  blackoutCtx.fillStyle = "rgba(0, 0, 0, 0)";
  blackoutCtx.fillRect(0, 0, blackoutCtx.width, blackoutCtx.height);
  blackoutCtx.fillStyle = "black";

  let circleRadius = window.innerWidth;
  while (circleRadius > pauseRadius) {
    blackoutCtx.beginPath();
    blackoutCtx.arc(x, y, circleRadius, 0, 2 * Math.PI);
    blackoutCtx.rect(window.innerWidth, 0, -window.innerWidth, window.innerHeight);
    blackoutCtx.fill();

    circleRadius *= 0.97;
    circleRadius -= 1;

    await delay(15);
  }
  win.play();
  await delay(pauseTime);
  while (circleRadius > 0) {
    blackoutCtx.beginPath();
    blackoutCtx.arc(x, y, circleRadius, 0, 2 * Math.PI);
    blackoutCtx.rect(window.innerWidth, 0, -window.innerWidth, window.innerHeight);
    blackoutCtx.fill();

    circleRadius -= 1;

    await delay(15);
  }
  blackoutCtx.fillRect(0, 0, blackoutCtx.width, blackoutCtx.height);
}
