const GAME_DURATION_SECONDS = 60;
const MIN_FACTOR = 2;
const MAX_FACTOR = 9;
const MAX_INPUT_LENGTH = 2;
const FEEDBACK_CLEAR_DELAY = 420;

const keypadLayout = [
  { value: "1", hint: "" },
  { value: "2", hint: "ABC" },
  { value: "3", hint: "DEF" },
  { value: "4", hint: "GHI" },
  { value: "5", hint: "JKL" },
  { value: "6", hint: "MNO" },
  { value: "7", hint: "PQRS" },
  { value: "8", hint: "TUV" },
  { value: "9", hint: "WXYZ" },
  { value: "backspace", label: "지우기", kind: "action" },
  { value: "0", hint: "+" },
  { value: "submit", label: "확인", kind: "submit" },
];

const app = document.querySelector("#app");

const state = {
  screen: "start",
  timeLeft: GAME_DURATION_SECONDS,
  input: "",
  totalAttempts: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  currentProblem: null,
  lastProblemKey: "",
  feedback: "idle",
  pressedKey: "",
};

let timerId = 0;
let feedbackTimeoutId = 0;

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createProblem() {
  let left = MIN_FACTOR;
  let right = MIN_FACTOR;
  let key = "";

  do {
    left = randomBetween(MIN_FACTOR, MAX_FACTOR);
    right = randomBetween(MIN_FACTOR, MAX_FACTOR);
    key = `${left}x${right}`;
  } while (key === state.lastProblemKey);

  state.lastProblemKey = key;

  return {
    left,
    right,
    answer: left * right,
    key,
  };
}

function resetFeedback() {
  window.clearTimeout(feedbackTimeoutId);
  feedbackTimeoutId = window.setTimeout(() => {
    state.feedback = "idle";
    render();
  }, FEEDBACK_CLEAR_DELAY);
}

function nextProblem() {
  state.currentProblem = createProblem();
  state.input = "";
}

function stopTimer() {
  window.clearInterval(timerId);
  timerId = 0;
}

function finishGame() {
  stopTimer();
  window.clearTimeout(feedbackTimeoutId);
  state.feedback = "idle";
  state.screen = "result";
  render();
}

function goToStartScreen() {
  stopTimer();
  window.clearTimeout(feedbackTimeoutId);
  state.screen = "start";
  state.timeLeft = GAME_DURATION_SECONDS;
  state.input = "";
  state.totalAttempts = 0;
  state.correctAnswers = 0;
  state.wrongAnswers = 0;
  state.currentProblem = null;
  state.lastProblemKey = "";
  state.feedback = "idle";
  state.pressedKey = "";
  render();
}

function startGame() {
  stopTimer();
  window.clearTimeout(feedbackTimeoutId);

  state.screen = "play";
  state.timeLeft = GAME_DURATION_SECONDS;
  state.input = "";
  state.totalAttempts = 0;
  state.correctAnswers = 0;
  state.wrongAnswers = 0;
  state.feedback = "idle";
  state.pressedKey = "";
  state.lastProblemKey = "";
  nextProblem();
  render();

  timerId = window.setInterval(() => {
    state.timeLeft -= 1;

    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      finishGame();
      return;
    }

    render();
  }, 1000);
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(1, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function getFeedbackLabel() {
  if (state.feedback === "correct") {
    return "정답";
  }

  if (state.feedback === "wrong") {
    return "틀림";
  }

  return "도전 중";
}

function handleDigitInput(digit) {
  if (state.screen !== "play" || state.timeLeft <= 0) {
    return;
  }

  if (state.input.length >= MAX_INPUT_LENGTH) {
    return;
  }

  state.input += digit;
  render();
}

function handleBackspace() {
  if (state.screen !== "play" || state.timeLeft <= 0) {
    return;
  }

  if (!state.input) {
    return;
  }

  state.input = state.input.slice(0, -1);
  render();
}

function handleSubmit() {
  if (state.screen !== "play" || state.timeLeft <= 0 || !state.input) {
    return;
  }

  const submittedAnswer = Number(state.input);
  const isCorrect = submittedAnswer === state.currentProblem.answer;

  state.totalAttempts += 1;

  if (isCorrect) {
    state.correctAnswers += 1;
    state.feedback = "correct";
  } else {
    state.wrongAnswers += 1;
    state.feedback = "wrong";
  }

  nextProblem();
  render();
  resetFeedback();
}

function pressKey(value) {
  state.pressedKey = value;
  render();
  window.setTimeout(() => {
    if (state.pressedKey === value) {
      state.pressedKey = "";
      render();
    }
  }, 120);

  if (/^\d$/.test(value)) {
    handleDigitInput(value);
    return;
  }

  if (value === "backspace") {
    handleBackspace();
    return;
  }

  if (value === "submit") {
    handleSubmit();
  }
}

function handleKeyboardInput(event) {
  if (state.screen !== "play") {
    return;
  }

  if (/^\d$/.test(event.key)) {
    event.preventDefault();
    pressKey(event.key);
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    pressKey("backspace");
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    pressKey("submit");
  }
}

function renderStartScreen() {
  return `
    <section class="screen">
      <div class="stack start-layout">
        <span class="eyebrow">1분 두뇌 워밍업</span>
        <div class="stack">
          <h1 class="hero-title">구구단<br />타임어택</h1>
          <p class="hero-text">
            60초 동안 랜덤 구구단 문제를 최대한 많이 풀어보세요.
            답은 옛날 전화기 느낌 숫자패드로 입력합니다.
          </p>
        </div>

        <div class="hero-metrics">
          <article class="metric-card">
            <span class="metric-label">게임 시간</span>
            <strong class="metric-value">1분</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">문제 범위</span>
            <strong class="metric-value">2단-9단</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">오답 처리</span>
            <strong class="metric-value">바로 다음</strong>
          </article>
        </div>

        <div class="rules-grid">
          <article class="rule-card">
            <h2>규칙 1</h2>
            <p>문제는 매번 랜덤으로 바뀌고 같은 문제가 연속으로 나오지 않습니다.</p>
          </article>
          <article class="rule-card">
            <h2>규칙 2</h2>
            <p>숫자를 누르고 확인을 누르면 바로 정답 또는 틀림을 판정합니다.</p>
          </article>
          <article class="rule-card">
            <h2>규칙 3</h2>
            <p>틀리면 멈추지 않고 곧바로 다음 문제로 넘어갑니다.</p>
          </article>
        </div>

        <button class="primary-button" type="button" data-action="start">
          1분 시작
        </button>
      </div>
    </section>
  `;
}

function renderPlayScreen() {
  const feedbackClass =
    state.feedback === "correct"
      ? "is-correct"
      : state.feedback === "wrong"
        ? "is-wrong"
        : "is-idle";

  const keypadButtons = keypadLayout
    .map((key) => {
      const isDigit = /^\d$/.test(key.value);
      const primary = isDigit ? key.value : key.label;
      const secondary = isDigit ? key.hint : key.value === "submit" ? "ENTER" : "";
      const pressed = state.pressedKey === key.value ? " is-pressed" : "";
      const kind = key.kind || "digit";

      return `
        <button
          class="keypad-button${pressed}"
          type="button"
          data-key="${key.value}"
          data-kind="${kind}"
          aria-label="${primary}"
        >
          <span class="keypad-primary">${primary}</span>
          ${secondary ? `<span class="keypad-secondary">${secondary}</span>` : ""}
        </button>
      `;
    })
    .join("");

  const inputValue = state.input
    ? `<span class="input-value">${state.input}</span>`
    : '<span class="input-value input-placeholder">__</span>';

  return `
    <section class="screen">
      <div class="stack play-layout">
        <div class="topbar">
          <div class="stack topbar-info">
            <span class="pill">남은 시간 ${formatTime(state.timeLeft)}</span>
            <span class="helper-text">숫자패드 또는 키보드 숫자키로 입력할 수 있어요.</span>
          </div>
          <div class="topbar-actions">
            <span class="status-chip ${feedbackClass}">${getFeedbackLabel()}</span>
            <button
              class="close-button"
              type="button"
              data-action="close-game"
              aria-label="게임 종료"
            >
              ×
            </button>
          </div>
        </div>

        <div class="play-main">
          <div class="stack">
            <div class="prompt-row">
              <article class="problem-card">
                <div class="problem-caption">
                  <span>랜덤 구구단</span>
                  <span>답은 두 자리까지</span>
                </div>
                <p class="problem-expression">${state.currentProblem.left} × ${state.currentProblem.right}</p>
                <p class="screen-copy">빠르게 보고, 빠르게 누르세요.</p>
              </article>

              <article class="input-card">
                <span class="input-label">지금 입력한 답</span>
                <div class="input-display">${inputValue}</div>
              </article>
            </div>

            <article class="score-card">
              <h2 class="section-title">현재 기록</h2>
              <div class="score-grid">
                <div class="record-card">
                  <span class="record-label">시도</span>
                  <strong class="record-number">${state.totalAttempts}</strong>
                </div>
                <div class="record-card">
                  <span class="record-label">정답</span>
                  <strong class="record-number">${state.correctAnswers}</strong>
                </div>
                <div class="record-card">
                  <span class="record-label">오답</span>
                  <strong class="record-number">${state.wrongAnswers}</strong>
                </div>
              </div>
            </article>
          </div>

          <article class="keypad-panel">
            <h2 class="section-title">전화기 숫자패드</h2>
            <p class="helper-text">지우기는 한 칸 삭제, 확인은 답 제출입니다.</p>
            <div class="keypad">
              ${keypadButtons}
            </div>
          </article>
        </div>
      </div>
    </section>
  `;
}

function renderResultScreen() {
  return `
    <section class="screen">
      <div class="stack result-layout">
        <article class="result-hero">
          <span class="eyebrow">게임 종료</span>
          <h1 class="result-score">${state.correctAnswers}문제 정답</h1>
          <p class="result-copy">
            1분 동안 총 ${state.totalAttempts}문제를 시도했고,
            틀린 문제는 ${state.wrongAnswers}개였습니다.
          </p>
        </article>

        <div class="result-metrics">
          <article class="result-card">
            <span class="result-label">총 시도</span>
            <strong class="result-value">${state.totalAttempts}</strong>
          </article>
          <article class="result-card">
            <span class="result-label">정답</span>
            <strong class="result-value">${state.correctAnswers}</strong>
          </article>
          <article class="result-card">
            <span class="result-label">오답</span>
            <strong class="result-value">${state.wrongAnswers}</strong>
          </article>
          <article class="result-card">
            <span class="result-label">정답률</span>
            <strong class="result-value">
              ${state.totalAttempts ? Math.round((state.correctAnswers / state.totalAttempts) * 100) : 0}%
            </strong>
          </article>
        </div>

        <div class="result-actions">
          <button class="primary-button" type="button" data-action="go-home">처음으로</button>
        </div>
      </div>
    </section>
  `;
}

function render() {
  if (state.screen === "start") {
    app.innerHTML = renderStartScreen();
    return;
  }

  if (state.screen === "play") {
    app.innerHTML = renderPlayScreen();
    return;
  }

  app.innerHTML = renderResultScreen();
}

document.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  const keyTarget = event.target.closest("[data-key]");

  if (actionTarget) {
    const action = actionTarget.dataset.action;

    if (action === "start") {
      startGame();
    } else if (action === "close-game" || action === "go-home") {
      goToStartScreen();
    }

    return;
  }

  if (keyTarget) {
    pressKey(keyTarget.dataset.key);
  }
});

document.addEventListener("keydown", handleKeyboardInput);

render();
