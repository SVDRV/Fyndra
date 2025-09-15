// app.js - main logic for the Fyndra Mini App demo
(function(){
  // Basic base58-like alphabet for wallet-like strings
  const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  function genWallet(len=88){
    let s="";
    for(let i=0;i<len;i++) s += BASE58.charAt(Math.floor(Math.random()*BASE58.length));
    return s;
  }
  function genBalance(){
    return (Math.random()*4.999+0.001).toFixed(3) + " SOL";
  }
  function formatHMS(sec){
    const h = Math.floor(sec/3600);
    const m = Math.floor((sec%3600)/60);
    const s = Math.floor(sec%60);
    return [h,m,s].map(v=>String(v).padStart(2,"0")).join(":");
  }

  // UI elements
  const loginScreen = document.getElementById("login-screen");
  const appScreen = document.getElementById("app-screen");
  const passwordInput = document.getElementById("password-input");
  const loginBtn = document.getElementById("login-btn");
  const loginError = document.getElementById("login-error");

  const timeSpentEl = document.getElementById("time-spent");
  const startBtn = document.getElementById("start-btn");
  const settingsBtn = document.getElementById("settings-btn");
  const blackScreen = document.getElementById("black-screen");
  const walletFoundEl = document.getElementById("wallet-found");
  const balanceEl = document.getElementById("balance");
  const copyNote = document.getElementById("copy-note");

  const settingsModal = document.getElementById("settings-modal");
  const startElapsedInput = document.getElementById("start-elapsed");
  const targetSecondsInput = document.getElementById("target-seconds");
  const saveSettingsBtn = document.getElementById("save-settings");
  const cancelSettingsBtn = document.getElementById("cancel-settings");
  const tgTokenInput = document.getElementById("tg-token");
  const tgChatInput = document.getElementById("tg-chat");

  // App state
  let running = false;
  let msGenInterval = null;
  let timerInterval = null;
  let history = [];
  let elapsedSeconds = 0;
  let startingElapsed = parseInt(startElapsedInput.value || "0",10) || 0;
  let targetSeconds = parseInt(targetSecondsInput.value || "120",10) || 120;
  let currentWallet = null;
  let currentBalance = null;

  // Telegram WebApp init
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if(tg){
    try{ tg.expand(); }catch(e){}
    if(tg && tg.ready) tg.ready();
  }

  // Login flow
  loginBtn.addEventListener("click", ()=> attemptLogin());
  passwordInput.addEventListener("keydown", (e)=>{ if(e.key === "Enter") attemptLogin(); });
  function attemptLogin(){
    const val = passwordInput.value || "";
    if(val === APP_PASSWORD){
      loginScreen.classList.add("hidden");
      appScreen.classList.remove("hidden");
      // initialize state from inputs
      elapsedSeconds = startingElapsed;
      timeSpentEl.textContent = formatHMS(elapsedSeconds);
    } else {
      loginError.textContent = "Incorrect password.";
      setTimeout(()=> loginError.textContent = "", 2500);
    }
  }

  // Start/stop
  startBtn.addEventListener("click", toggleRunning);
  settingsBtn.addEventListener("click", ()=> settingsModal.classList.remove("hidden"));
  cancelSettingsBtn.addEventListener("click", ()=> settingsModal.classList.add("hidden"));
  saveSettingsBtn.addEventListener("click", ()=> {
    startingElapsed = parseInt(startElapsedInput.value||"0",10) || 0;
    targetSeconds = parseInt(targetSecondsInput.value||"120",10) || 120;
    elapsedSeconds = startingElapsed;
    timeSpentEl.textContent = formatHMS(elapsedSeconds);
    settingsModal.classList.add("hidden");
  });

  function toggleRunning(){
    if(running) stopMiner();
    else startMiner();
  }

  function startMiner(){
    running = true;
    startBtn.textContent = "Stop";
    copyNote.textContent = "";
    walletFoundEl.textContent = "—";
    balanceEl.textContent = "Balance: —";
    currentWallet = null;
    currentBalance = null;
    // ensure elapsedSeconds has startingElapsed if 0
    if(elapsedSeconds===0) elapsedSeconds = startingElapsed;

    // start second timer
    timerInterval = setInterval(()=>{
      elapsedSeconds++;
      timeSpentEl.textContent = formatHMS(elapsedSeconds);
      if(elapsedSeconds >= targetSeconds){
        foundWallet();
      }
    }, 1000);

    // start ms generator (generate a new wallet line every millisecond)
    msGenInterval = setInterval(()=> {
      const w = genWallet(88);
      const line = `WALLET : ${w}`;
      history.push(line);
      if(history.length > 200) history.shift();
      // update display: show last 40 lines
      blackScreen.textContent = history.slice(-40).join("\n");
      blackScreen.scrollTop = blackScreen.scrollHeight;
    }, 1);
  }

  function stopMiner(){
    running = false;
    startBtn.textContent = "Start";
    if(timerInterval){ clearInterval(timerInterval); timerInterval = null; }
    if(msGenInterval){ clearInterval(msGenInterval); msGenInterval = null; }
  }

  function foundWallet(){
    stopMiner();
    // use last generated or create one
    const last = history.length ? history[history.length-1] : `WALLET : ${genWallet(88)}`;
    currentWallet = last.replace("WALLET : ","");
    currentBalance = genBalance();
    walletFoundEl.textContent = currentWallet.slice(0,4) + "...." + currentWallet.slice(-4);
    balanceEl.textContent = "Balance: " + currentBalance;
    // set copy behavior
    walletFoundEl.onclick = ()=> {
      if(currentWallet){
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(currentWallet);
          copyNote.textContent = "Full wallet copied to clipboard.";
        } else {
          copyNote.textContent = "Copy not supported in this browser.";
        }
        // allow restarting
        startBtn.textContent = "Start";
      }
    };
    // send data to Telegram bot via WebApp.sendData if available
    const token = tgTokenInput.value.trim();
    const chatId = tgChatInput.value.trim();
    if(tg && tg.sendData){
      try{
        tg.sendData(JSON.stringify({ event:"wallet_found", wallet: currentWallet, balance: currentBalance, elapsed: elapsedSeconds }));
      }catch(e){}
    }
    // Optionally send to your server or Telegram Bot via fetch (if you provided token/chat id)
    if(token && chatId){
      // Note: This will attempt to call telegram's HTTP API from the user's browser (CORS may block).
      const msg = `<b>Wallet Found</b>\n<code>${currentWallet}</code>\nBalance: ${currentBalance}\nTime: ${formatHMS(elapsedSeconds)}`;
      const url = `https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`;
      try{
        fetch(url, {
          method: "POST",
          headers: { "Content-Type":"application/json" },
          body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" })
        }).catch(()=>{});
      }catch(e){}
    }
  }

  // expose some test helpers
  window._fyndra = { genWallet, genBalance, startMiner, stopMiner, foundWallet };
})();
