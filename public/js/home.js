function goHome() {
  removeAllChildNodes(document.getElementById("homeWrapper"));

  let title = document.createElement("div");
  title.id = "homeTitle";
  title.textContent = "Two Truths and a Battleship";

  let contentWrapper = document.createElement("div");
  contentWrapper.id = "homeContentWrapper";

  let playBtn = document.createElement("div");
  playBtn.id = "homePlayBtn";
  playBtn.classList.add("button");
  playBtn.textContent = "Play";
  playBtn.addEventListener("click", goPlay);

  let aboutBtn = document.createElement("div");
  aboutBtn.id = "homeAboutBtn";
  aboutBtn.textContent = "About";
  aboutBtn.addEventListener("click", goAbout);
  aboutBtn.classList.add("button");

  contentWrapper.appendChild(playBtn);
  contentWrapper.appendChild(aboutBtn);

  document.getElementById("homeWrapper").appendChild(title);
  document.getElementById("homeWrapper").appendChild(contentWrapper);
}

function goPlay() {
  removeAllChildNodes(document.getElementById("homeWrapper"));

  let title = document.createElement("div");
  title.id = "homeTitle";
  title.textContent = "Two Truths and a Battleship";

  let contentWrapper = document.createElement("div");
  contentWrapper.id = "homeContentWrapper";

  let hostBtn = document.createElement("div");
  hostBtn.id = "homeHostBtn";
  hostBtn.classList.add("button");
  hostBtn.textContent = "Host";
  hostBtn.addEventListener("click", () => {
    axios.post("/host", {}).then((res) => {
      removeAllChildNodes(document.getElementById("homeWrapper"));

      let codeDisplay = document.createElement("div");
      codeDisplay.id = "codeDisplay";
      codeDisplay.innerHTML = `
        <div id="codeTitle">Room code: ${res.data.gameCode}</div>
        <div class="inputWrapper">
            <div>Role: </div>
            <select name="joinPosition" id="joinPosition">
                <option value="redOC">Red Operations Commander</option>
                <option value="redIC">Red Intelligence Commander</option>
                <option value="blueOC">Blue Operations Commander</option>
                <option value="blueIC">Blue Intelligence Commander</option>
            </select>
        </div>
        <div id="joinBtnWrapper">
            <div id="joinBtn" class="button">Join</div>
            <div id="homeBtn" class="button">Back</div>
        </div>
      `;

      document.getElementById("homeWrapper").appendChild(codeDisplay);
      document.getElementById("joinBtn").addEventListener("click", () => {
        let code;
        if (document.getElementById("joinCode")) {
          code = document.getElementById("joinCode").value;
        } else {
          code = document.getElementById("codeTitle").innerHTML.replace(/\D/g, "");
        }
        let position = document.getElementById("joinPosition").value;
        axios
          .post("/join", {
            joinCode: code,
            joinPosition: position,
          })
          .then((res) => {
            if (res.data.access === "dne") {
              alert("Game does not exist");
            } else if (res.data.access === "occupied") {
              alert("Selected position is already filled");
            } else if (res.data.access === "duplicate") {
              alert("That name is already taken");
            } else if (res.data.access === "granted") {
              axios.post("/setCookies", { gameCode: code, position: position }).then((res) => {
                window.location.href = "/play";
              });
            }
          });
      });
      document.getElementById("homeBtn").addEventListener("click", goHome);
    });
  });

  let joinBtn = document.createElement("div");
  joinBtn.id = "homeJoinBtn";
  joinBtn.classList.add("button");
  joinBtn.textContent = "Join";
  joinBtn.addEventListener("click", () => {
    removeAllChildNodes(document.getElementById("homeWrapper"));

    let joinDisplay = document.createElement("div");
    joinDisplay.id = "joinDisplay";
    joinDisplay.innerHTML = `
        <div class="inputWrapper">
            <div>Room Code:</div>
            <input type="text" id="joinCode" name="joinCode">
        </div>
        <div class="inputWrapper">
            <div>Role: </div>
            <select name="joinPosition" id="joinPosition">
                <option value="redOC">Red Operations Commander</option>
                <option value="redIC">Red Intelligence Commander</option>
                <option value="blueOC">Blue Operations Commander</option>
                <option value="blueIC">Blue Intelligence Commander</option>
            </select>
        </div>
        <div id="joinBtnWrapper">
            <div id="joinBtn" class="button">Join</div>
            <div id="homeBtn" class="button">Back</div>
        </div>
    `;

    document.getElementById("homeWrapper").appendChild(joinDisplay);
    document.getElementById("joinBtn").addEventListener("click", () => {
      let code;
      if (document.getElementById("joinCode")) {
        code = document.getElementById("joinCode").value;
      } else {
        code = document.getElementById("codeTitle").innerHTML.replace(/\D/g, "");
      }
      let position = document.getElementById("joinPosition").value;
      axios
        .post("/join", {
          joinCode: code,
          joinPosition: position,
        })
        .then((res) => {
          if (res.data.access === "dne") {
            alert("Game does not exist");
          } else if (res.data.access === "occupied") {
            alert("Selected position is already filled");
          } else if (res.data.access === "duplicate") {
            alert("That name is already taken");
          } else if (res.data.access === "granted") {
            axios.post("/setCookies", { gameCode: code, position: position }).then((res) => {
              window.location.href = "/play";
            });
          }
        });
    });
    document.getElementById("homeBtn").addEventListener("click", goHome);
  });

  let homeBtn = document.createElement("div");
  homeBtn.id = "homeBtn";
  homeBtn.classList.add("button");
  homeBtn.textContent = "Back";
  homeBtn.addEventListener("click", goHome);

  contentWrapper.appendChild(hostBtn);
  contentWrapper.appendChild(joinBtn);
  contentWrapper.appendChild(homeBtn);

  document.getElementById("homeWrapper").appendChild(title);
  document.getElementById("homeWrapper").appendChild(contentWrapper);
}

function goAbout() {
  removeAllChildNodes(document.getElementById("homeWrapper"));

  let title = document.createElement("div");
  title.id = "homeTitle";
  title.textContent = "Two Truths and a Battleship";

  let contentWrapper = document.createElement("div");
  contentWrapper.id = "homeContentWrapper";
  contentWrapper.style.flexDirection = "column";

  let aboutText = document.createElement("div");
  aboutText.id = "homeAboutText";
  aboutText.innerHTML = `<h1>About</h1>This is a submission for the Armed Forces Game Jam 2023.`;

  let homeBtn = document.createElement("div");
  homeBtn.id = "homeBtn";
  homeBtn.classList.add("button");
  homeBtn.textContent = "Back";
  homeBtn.addEventListener("click", goHome);

  contentWrapper.appendChild(aboutText);
  contentWrapper.appendChild(homeBtn);

  document.getElementById("homeWrapper").appendChild(title);
  document.getElementById("homeWrapper").appendChild(contentWrapper);
}

goHome();
