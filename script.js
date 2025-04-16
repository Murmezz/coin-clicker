:root {
  --text-color: #ffffff;
  --bg-color: #121212;
  --container-bg: #1e1e1e;
  --coin-shadow: 0 8px 15px rgba(0, 0, 0, 0.4);
  --highlight-color: #ffffff;
  --border-color: #333;
  --button-bg: #7c4dff;
  --button-hover: #5e35b1;
  --header-bg: #673ab7;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Arial', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background: var(--bg-color);
  color: var(--text-color);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.container {
  text-align: center;
  background: var(--container-bg);
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  width: 95%;
  max-width: 420px;
  border: 1px solid var(--border-color);
  position: relative;
  margin: 10px 0;
}

.balance {
  font-size: 28px;
  margin-bottom: 20px;
  color: var(--text-color);
  font-weight: bold;
}

.buttons-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 25px;
  width: 100%;
}

.button-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.first-row {
  margin-bottom: 0;
}

.second-row {
  margin-top: 0;
}

.nav-button {
  background: linear-gradient(135deg, var(--button-bg) 0%, var(--button-hover) 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 16px 10px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  flex: 1;
  min-width: 0;
}

.wide-button {
  flex: 1;
  min-width: 0;
  border-radius: 30px;
}

.nav-button:active {
  transform: scale(0.95);
}

.coin-container {
  width: 280px;
  height: 280px;
  margin: 0 auto 25px;
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  -webkit-mask-image: -webkit-radial-gradient(white, black);
}

.coin-button {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-image: url('https://i.postimg.cc/5yCLJbrb/1000048704.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-shadow: var(--coin-shadow);
  transition: transform 0.3s ease;
  position: relative;
  z-index: 1;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.coin-button:active {
  box-shadow: none; /* убираем тень */
  transform: scale(0.95); /* легкое уменьшение при клике */
}

.stats {
  margin-top: 15px;
  font-size: 22px;
  color: var(--text-color);
  font-weight: bold;
}

.floating-numbers-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1000;
}

.floating-number {
  position: absolute;
  color: var(--highlight-color);
  font-size: 32px;
  font-weight: bold;
  opacity: 1;
  transform: translate(0, 0);
  animation: floatNumber 0.7s linear forwards;
  user-select: none;
  will-change: transform, opacity;
  z-index: 1001;
  text-shadow: 0 2px 5px rgba(0,0,0,0.5);
}

@keyframes floatNumber {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
  50% {
    opacity: 0;
    transform: translate(calc(var(--target-x) * 0.6), calc(var(--target-y) * 0.6)) scale(0.7);
  }
  100% {
    opacity: 0;
    transform: translate(var(--target-x), var(--target-y)) scale(0.5);
  }
}

#pages-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  z-index: 10000;
  display: none;
}

.page {
  width: 100%;
  min-height: 100%;
  background: var(--container-bg);
  padding-top: 60px;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: var(--header-bg);
  padding: 15px;
  display: flex;
  align-items: center;
  z-index: 10001;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.back-button {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 28px;
  cursor: pointer;
  margin-right: 15px;
  padding: 5px;
}

.page-title {
  color: var(--text-color);
  margin: 0;
  font-size: 22px;
  font-weight: bold;
}

.page-content {
  color: var(--text-color);
  font-size: 18px;
  line-height: 1.6;
  padding: 20px;
  text-align: center;
}

@media (max-width: 400px) {
  .nav-button {
    padding: 14px 8px;
    font-size: 16px;
  }
  
  .coin-container {
    width: 250px;
    height: 250px;
  }
}