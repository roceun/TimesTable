const TIMES_TABLE_DURATION_SECONDS = 60;
const FRACTION_DURATION_SECONDS = 300;
const MIN_FACTOR = 2;
const MAX_FACTOR = 9;
const TIMES_TABLE_INPUT_LENGTH = 2;
const FRACTION_INPUT_LENGTH = 3;
const FEEDBACK_CLEAR_DELAY = 420;

const MODES = {
  timestable: {
    id: "timestable",
    label: "구구단",
    durationSeconds: TIMES_TABLE_DURATION_SECONDS,
    eyebrow: "1분 두뇌 워밍업",
    title: "구구단\n타임어택",
    description:
      "60초 동안 랜덤 구구단 문제를 최대한 많이 풀어보세요. 빠르게 보고, 빠르게 답을 입력해 기록에 도전하세요.",
    metricValue: "2단-9단",
    metricHint: "두 자리 답",
    helper: "숫자패드 또는 키보드 숫자키로 입력할 수 있어요.",
    caption: "랜덤 구구단",
    inputLabel: "지금 입력한 답",
    inputHint: "답은 두 자리까지",
    screenCopy: "빠르게 보고, 빠르게 누르세요.",
    answerFormat: "숫자",
    rules: [
      "문제는 매번 랜덤으로 바뀌고 같은 문제가 연속으로 나오지 않습니다.",
      "숫자를 누르고 확인을 누르면 바로 정답 또는 틀림을 판정합니다.",
      "틀리면 멈추지 않고 곧바로 다음 문제로 넘어갑니다.",
    ],
  },
  fraction: {
    id: "fraction",
    label: "분수 덧셈·뺄셈",
    durationSeconds: FRACTION_DURATION_SECONDS,
    eyebrow: "새 연산 모드",
    title: "분수\n덧셈·뺄셈",
    description:
      "분수의 덧셈과 뺄셈을 단계별로 연습해보세요. 초급부터 고급까지 차근차근 올라가며 익힐 수 있어요.",
    metricValue: "초급-고급",
    metricHint: "분자·분모 입력",
    helper: "숫자패드로 값을 넣고, 분자와 분모 칸을 눌러 위치를 바꿀 수 있어요.",
    caption: "랜덤 분수 연산",
    inputLabel: "지금 입력한 답",
    inputHint: "분자와 분모를 모두 입력",
    screenCopy: "분자와 분모를 차분히 보고 답을 눌러보세요.",
    answerFormat: "분자 / 분모",
    rules: [
      "분수 모드에서는 초급, 중급, 고급 중 하나를 고를 수 있습니다.",
      "분자와 분모를 따로 입력하며, 뺄셈은 음수가 나오지 않게 출제됩니다.",
      "초급은 초등학교 3학년 수준으로, 쉬운 다른 분모와 배수 관계 중심입니다.",
      "중급은 4학년 수준, 고급은 5학년 수준으로 통분과 기약분수 부담이 커집니다.",
    ],
  },
};

const FRACTION_LEVELS = {
  beginner: {
    id: "beginner",
    label: "초급",
    description: "초3 수준, 쉬운 다른 분모와 동치분수",
    denominatorMin: 2,
    denominatorMax: 12,
    sameDenominatorOnly: false,
    allowEasyEquivalentDenominators: true,
    allowEquivalentAnswers: true,
    requireReducedAnswer: false,
    keepAdditionProper: true,
  },
  intermediate: {
    id: "intermediate",
    label: "중급",
    description: "초4 수준, 다른 분모 4-18과 기약분수",
    denominatorMin: 4,
    denominatorMax: 18,
    sameDenominatorOnly: false,
    allowEasyEquivalentDenominators: false,
    allowEquivalentAnswers: false,
    requireReducedAnswer: true,
    keepAdditionProper: true,
  },
  advanced: {
    id: "advanced",
    label: "고급",
    description: "초5 수준, 다른 분모 6-36과 큰 계산",
    denominatorMin: 6,
    denominatorMax: 36,
    sameDenominatorOnly: false,
    allowEasyEquivalentDenominators: false,
    allowEquivalentAnswers: false,
    requireReducedAnswer: true,
    keepAdditionProper: false,
  },
};

const keypadLayout = [
  { value: "1", hint: "" },
  { value: "2", hint: "" },
  { value: "3", hint: "" },
  { value: "4", hint: "" },
  { value: "5", hint: "" },
  { value: "6", hint: "" },
  { value: "7", hint: "" },
  { value: "8", hint: "" },
  { value: "9", hint: "" },
  { value: "backspace", label: "지우기", kind: "action" },
  { value: "0", hint: "" },
  { value: "submit", label: "확인", kind: "submit" },
];

const app = document.querySelector("#app");

const state = {
  screen: "start",
  selectedMode: "timestable",
  selectedLevel: "beginner",
  timeLeft: TIMES_TABLE_DURATION_SECONDS,
  input: "",
  fractionInput: {
    numerator: "",
    denominator: "",
  },
  activeFractionField: "numerator",
  totalAttempts: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  currentProblem: null,
  lastProblemKey: "",
  feedback: "idle",
  feedbackAnswerMarkup: "",
  pressedKey: "",
};

let timerId = 0;
let feedbackTimeoutId = 0;
let lastPointerHandledAt = 0;

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const temp = a % b;
    a = b;
    b = temp;
  }

  return a || 1;
}

function reduceFraction(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor,
  };
}

function compareFractions(left, right) {
  return left.numerator * right.denominator - right.numerator * left.denominator;
}

function addFractions(left, right) {
  return reduceFraction(
    left.numerator * right.denominator + right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function subtractFractions(left, right) {
  return reduceFraction(
    left.numerator * right.denominator - right.numerator * left.denominator,
    left.denominator * right.denominator,
  );
}

function createProperFraction(minDenominator, maxDenominator) {
  const denominator = randomBetween(minDenominator, maxDenominator);
  const numerator = randomBetween(1, denominator - 1);

  return { numerator, denominator };
}

function createFractionWithDenominator(denominator) {
  return {
    numerator: randomBetween(1, denominator - 1),
    denominator,
  };
}

function createBeginnerRightFraction(left, operator) {
  const divisors = [];

  for (let candidate = 2; candidate < left.denominator; candidate += 1) {
    if (left.denominator % candidate === 0) {
      divisors.push(candidate);
    }
  }

  if (!divisors.length) {
    return createFractionWithDenominator(left.denominator);
  }

  const chosenDenominator = divisors[randomBetween(0, divisors.length - 1)];

  if (operator === "+") {
    return createFractionWithDenominator(chosenDenominator);
  }

  const maxNumerator = Math.min(chosenDenominator - 1, Math.floor((left.numerator * chosenDenominator - 1) / left.denominator));

  if (maxNumerator < 1) {
    return createFractionWithDenominator(left.denominator);
  }

  return {
    numerator: randomBetween(1, maxNumerator),
    denominator: chosenDenominator,
  };
}

function formatFraction({ numerator, denominator }) {
  return `${numerator}/${denominator}`;
}

function renderFractionMarkup(fraction, extraClass = "") {
  return `
    <span class="math-fraction${extraClass ? ` ${extraClass}` : ""}" aria-label="${fraction.denominator}분의 ${fraction.numerator}">
      <span class="math-fraction-top">${fraction.numerator}</span>
      <span class="math-fraction-line" aria-hidden="true"></span>
      <span class="math-fraction-bottom">${fraction.denominator}</span>
    </span>
  `;
}

function renderAnswerMarkup(problem) {
  if (problem.type === "fraction") {
    return renderFractionMarkup(problem.answer, "math-fraction-answer");
  }

  return `<span class="feedback-answer-number">${problem.answer}</span>`;
}

function isFractionMode() {
  return state.selectedMode === "fraction";
}

function getActiveMode() {
  return MODES[state.selectedMode];
}

function getActiveLevel() {
  return FRACTION_LEVELS[state.selectedLevel];
}

function getMaxInputLength() {
  return isFractionMode() ? FRACTION_INPUT_LENGTH : TIMES_TABLE_INPUT_LENGTH;
}

function getGameDurationSeconds() {
  return getActiveMode().durationSeconds;
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

function createTimesTableProblem() {
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
    type: "timestable",
    left,
    right,
    prompt: `${left} × ${right}`,
    answer: left * right,
    key,
  };
}

function createFractionProblem() {
  const level = getActiveLevel();
  while (true) {
    const operator = Math.random() < 0.5 ? "+" : "-";
    let left = createProperFraction(level.denominatorMin, level.denominatorMax);
    let right;

    if (level.sameDenominatorOnly) {
      right = createFractionWithDenominator(left.denominator);
    } else if (level.allowEasyEquivalentDenominators) {
      right = createBeginnerRightFraction(left, operator);
    } else {
      right = createProperFraction(level.denominatorMin, level.denominatorMax);
    }
    let answer;

    if (operator === "+") {
      if (level.sameDenominatorOnly) {
        const maxNumerator = left.denominator - left.numerator - 1;

        if (maxNumerator < 1) {
          continue;
        }

        right = { numerator: randomBetween(1, maxNumerator), denominator: left.denominator };
      }

      answer = addFractions(left, right);

      if (
        level.keepAdditionProper &&
        compareFractions(answer, { numerator: 1, denominator: 1 }) >= 0
      ) {
        continue;
      }
    } else {
      if (compareFractions(left, right) <= 0) {
        [left, right] = [right, left];
      }

      answer = subtractFractions(left, right);

      if (answer.numerator <= 0) {
        continue;
      }
    }

    const key = `${formatFraction(left)}${operator}${formatFraction(right)}=${formatFraction(answer)}`;

    if (key === state.lastProblemKey) {
      continue;
    }

    state.lastProblemKey = key;

    return {
      type: "fraction",
      operator,
      left,
      right,
      prompt: `${formatFraction(left)} ${operator} ${formatFraction(right)}`,
      answer,
      key,
    };
  }
}

function createProblem() {
  if (isFractionMode()) {
    return createFractionProblem();
  }

  return createTimesTableProblem();
}

function clearInputs() {
  state.input = "";
  state.fractionInput.numerator = "";
  state.fractionInput.denominator = "";
  state.activeFractionField = "numerator";
}

function resetFeedback() {
  window.clearTimeout(feedbackTimeoutId);
  feedbackTimeoutId = window.setTimeout(() => {
    state.feedback = "idle";
    state.feedbackAnswerMarkup = "";
    render();
  }, FEEDBACK_CLEAR_DELAY);
}

function nextProblem() {
  state.currentProblem = createProblem();
  clearInputs();
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
  state.timeLeft = getGameDurationSeconds();
  clearInputs();
  state.totalAttempts = 0;
  state.correctAnswers = 0;
  state.wrongAnswers = 0;
  state.currentProblem = null;
  state.lastProblemKey = "";
  state.feedback = "idle";
  state.feedbackAnswerMarkup = "";
  state.pressedKey = "";
  render();
}

function confirmCloseGame() {
  if (state.screen !== "play") {
    goToStartScreen();
    return;
  }

  const shouldClose = window.confirm("지금 게임을 종료하고 처음 화면으로 돌아갈까요?");

  if (shouldClose) {
    goToStartScreen();
  }
}

function startGame() {
  stopTimer();
  window.clearTimeout(feedbackTimeoutId);

  state.screen = "play";
  state.timeLeft = getGameDurationSeconds();
  clearInputs();
  state.totalAttempts = 0;
  state.correctAnswers = 0;
  state.wrongAnswers = 0;
  state.feedback = "idle";
  state.feedbackAnswerMarkup = "";
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

function setMode(mode) {
  state.selectedMode = mode;
  state.timeLeft = getGameDurationSeconds();
  clearInputs();
  render();
}

function setLevel(level) {
  state.selectedLevel = level;
  render();
}

function setActiveFractionField(field) {
  state.activeFractionField = field;
  render();
}

function handleDigitInput(digit) {
  if (state.screen !== "play" || state.timeLeft <= 0) {
    return;
  }

  if (!isFractionMode()) {
    if (state.input.length >= getMaxInputLength()) {
      return;
    }

    state.input += digit;
    render();
    return;
  }

  const activeField = state.activeFractionField;
  const currentValue = state.fractionInput[activeField];

  if (currentValue.length >= getMaxInputLength()) {
    return;
  }

  if (currentValue === "0") {
    state.fractionInput[activeField] = digit;
  } else {
    state.fractionInput[activeField] += digit;
  }

  render();
}

function handleBackspace() {
  if (state.screen !== "play" || state.timeLeft <= 0) {
    return;
  }

  if (!isFractionMode()) {
    if (!state.input) {
      return;
    }

    state.input = state.input.slice(0, -1);
    render();
    return;
  }

  const activeField = state.activeFractionField;
  const currentValue = state.fractionInput[activeField];

  if (currentValue) {
    state.fractionInput[activeField] = currentValue.slice(0, -1);
    render();
    return;
  }

  if (activeField === "denominator") {
    state.activeFractionField = "numerator";
    render();
  }
}

function getSubmittedFraction() {
  const numeratorText = state.fractionInput.numerator;
  const denominatorText = state.fractionInput.denominator;

  if (!numeratorText || !denominatorText) {
    return null;
  }

  const numerator = Number(numeratorText);
  const denominator = Number(denominatorText);

  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator <= 0) {
    return null;
  }

  return { numerator, denominator };
}

function isFractionAnswerCorrect(submittedFraction) {
  const answer = state.currentProblem.answer;
  const level = getActiveLevel();

  if (level.allowEquivalentAnswers) {
    return (
      submittedFraction.numerator * answer.denominator ===
      answer.numerator * submittedFraction.denominator
    );
  }

  const reducedSubmitted = reduceFraction(submittedFraction.numerator, submittedFraction.denominator);
  const isReduced =
    reducedSubmitted.numerator === submittedFraction.numerator &&
    reducedSubmitted.denominator === submittedFraction.denominator;

  if (level.requireReducedAnswer && !isReduced) {
    return false;
  }

  return (
    reducedSubmitted.numerator === answer.numerator &&
    reducedSubmitted.denominator === answer.denominator
  );
}

function handleSubmit() {
  if (state.screen !== "play" || state.timeLeft <= 0) {
    return;
  }

  let isCorrect = false;

  if (isFractionMode()) {
    const submittedFraction = getSubmittedFraction();

    if (!submittedFraction) {
      if (state.fractionInput.numerator && !state.fractionInput.denominator) {
        state.activeFractionField = "denominator";
        render();
      }
      return;
    }

    isCorrect = isFractionAnswerCorrect(submittedFraction);
  } else {
    if (!state.input) {
      return;
    }

    const submittedAnswer = Number(state.input);
    isCorrect = submittedAnswer === state.currentProblem.answer;
  }

  state.totalAttempts += 1;

  if (isCorrect) {
    state.correctAnswers += 1;
    state.feedback = "correct";
    state.feedbackAnswerMarkup = "";
  } else {
    state.wrongAnswers += 1;
    state.feedback = "wrong";
    state.feedbackAnswerMarkup = renderAnswerMarkup(state.currentProblem);
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
    return;
  }

  if (isFractionMode() && (event.key === "/" || event.key === "Tab")) {
    event.preventDefault();
    setActiveFractionField(
      state.activeFractionField === "numerator" ? "denominator" : "numerator",
    );
  }
}

function renderModeCards() {
  return Object.values(MODES)
    .map((mode) => {
      const selected = state.selectedMode === mode.id ? " is-selected" : "";
      const stateLabel = state.selectedMode === mode.id ? "현재 선택됨" : "선택하기";

      return `
        <button
          class="choice-card${selected}"
          type="button"
          data-action="set-mode"
          data-mode="${mode.id}"
        >
          <span class="choice-title">${mode.label}</span>
          <span class="choice-copy">${mode.description}</span>
          <span class="choice-footer">
            <span class="choice-meta">${mode.metricHint}</span>
            <span class="choice-badge">${stateLabel}</span>
          </span>
        </button>
      `;
    })
    .join("");
}

function renderLevelCards() {
  if (!isFractionMode()) {
    return "";
  }

  return `
    <div class="stack">
      <div>
        <h2 class="section-title">분수 난이도 선택</h2>
        <p class="helper-text">처음 배우면 초급부터 시작하고, 익숙해지면 중급과 고급으로 올라가세요.</p>
      </div>
      <div class="choices-grid level-grid">
        ${Object.values(FRACTION_LEVELS)
          .map((level) => {
            const selected = state.selectedLevel === level.id ? " is-selected" : "";
            const stateLabel = state.selectedLevel === level.id ? "현재 선택됨" : "선택하기";

            return `
              <button
                class="choice-card level-card${selected}"
                type="button"
                data-action="set-level"
                data-level="${level.id}"
              >
                <span class="choice-title">${level.label}</span>
                <span class="choice-copy">${level.description}</span>
                <span class="choice-footer">
                  <span class="choice-meta">분모 ${level.denominatorMin}-${level.denominatorMax}</span>
                  <span class="choice-badge">${stateLabel}</span>
                </span>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderStartScreen() {
  const activeMode = getActiveMode();
  const startLabel = `${Math.floor(activeMode.durationSeconds / 60)}분 시작`;

  return `
    <section class="screen">
      <div class="stack start-layout">
        <span class="eyebrow">${activeMode.eyebrow}</span>

        <div class="stack start-choice-section">
          <div>
            <h2 class="section-title">학습 모드 선택</h2>
            <p class="helper-text">먼저 무엇을 연습할지 고르고, 그다음 규칙을 보고 시작하세요.</p>
          </div>
          <div class="choices-grid">
            ${renderModeCards()}
          </div>
        </div>

        ${renderLevelCards()}

        <div class="stack">
          <h1 class="hero-title">${activeMode.title.replace("\n", "<br />")}</h1>
          <p class="hero-text">${activeMode.description}</p>
        </div>

        <div class="hero-metrics">
          <article class="metric-card">
            <span class="metric-label">게임 시간</span>
            <strong class="metric-value">${Math.floor(activeMode.durationSeconds / 60)}분</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">문제 범위</span>
            <strong class="metric-value">${activeMode.metricValue}</strong>
          </article>
          <article class="metric-card">
            <span class="metric-label">답 입력</span>
            <strong class="metric-value">${activeMode.answerFormat}</strong>
          </article>
        </div>

        <div class="rules-grid">
          ${activeMode.rules
            .map(
              (rule, index) => `
                <article class="rule-card">
                  <h2>규칙 ${index + 1}</h2>
                  <p>${rule}</p>
                </article>
              `,
            )
            .join("")}
        </div>

        <button class="primary-button" type="button" data-action="start">
          ${startLabel}
        </button>
      </div>
    </section>
  `;
}

function renderInputDisplay() {
  if (!isFractionMode()) {
    return state.input
      ? `<span class="input-value">${state.input}</span>`
      : '<span class="input-value input-placeholder">__</span>';
  }

  const numerator = state.fractionInput.numerator || "__";
  const denominator = state.fractionInput.denominator || "__";
  const numeratorSelected =
    state.activeFractionField === "numerator" ? " is-selected" : "";
  const denominatorSelected =
    state.activeFractionField === "denominator" ? " is-selected" : "";

  return `
    <div class="fraction-display">
      <button
        class="fraction-field${numeratorSelected}"
        type="button"
        data-action="focus-fraction-field"
        data-field="numerator"
        aria-label="분자 입력칸"
      >
        <span class="fraction-field-label">분자</span>
        <span class="fraction-field-value">${numerator}</span>
      </button>
      <span class="fraction-bar" aria-hidden="true"></span>
      <button
        class="fraction-field${denominatorSelected}"
        type="button"
        data-action="focus-fraction-field"
        data-field="denominator"
        aria-label="분모 입력칸"
      >
        <span class="fraction-field-label">분모</span>
        <span class="fraction-field-value">${denominator}</span>
      </button>
    </div>
  `;
}

function renderPlayScreen() {
  const activeMode = getActiveMode();
  const fractionGuide = isFractionMode()
    ? getActiveLevel().allowEquivalentAnswers
      ? "동치분수도 정답으로 인정돼요."
      : "기약분수로 입력해보세요."
    : activeMode.screenCopy;
  const keypadButtons = keypadLayout
    .map((key) => {
      const isDigit = /^\d$/.test(key.value);
      const primary = isDigit ? key.value : key.label;
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
        </button>
      `;
    })
    .join("");

  const levelPill = isFractionMode()
    ? `<span class="pill is-warning">${getActiveLevel().label}</span>`
    : "";

  const feedbackOverlay =
    state.feedback === "idle"
      ? ""
      : `
        <div class="feedback-overlay ${state.feedback === "correct" ? "is-correct" : "is-wrong"}" aria-live="assertive">
          <div class="feedback-toast">
            <strong class="feedback-title">${state.feedback === "correct" ? "정답!" : "오답!"}</strong>
            <div class="feedback-message">${state.feedback === "correct" ? "잘했어요!" : `정답은 ${state.feedbackAnswerMarkup} 입니다.`}</div>
          </div>
        </div>
      `;

  const inputValue = renderInputDisplay();
  const prompt = state.currentProblem.type === "fraction"
    ? `
        <div class="problem-math" aria-label="${state.currentProblem.prompt}">
          ${renderFractionMarkup(state.currentProblem.left)}
          <span class="math-operator" aria-hidden="true">${state.currentProblem.operator}</span>
          ${renderFractionMarkup(state.currentProblem.right)}
        </div>
      `
    : `${state.currentProblem.left} × ${state.currentProblem.right}`;

  return `
    <section class="screen screen-play">
      ${feedbackOverlay}
      <div class="stack play-layout">
        <div class="topbar">
          <div class="stack topbar-info">
            <div class="topbar-badges">
              <span class="pill">남은 시간 ${formatTime(state.timeLeft)}</span>
              ${levelPill}
            </div>
            <span class="helper-text">${activeMode.helper}</span>
          </div>
          <div class="topbar-actions">
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
                  <span>${activeMode.caption}</span>
                  <span>${activeMode.inputHint}</span>
                </div>
                <div class="problem-expression">${prompt}</div>
                <p class="screen-copy">${fractionGuide}</p>
              </article>

              <article class="input-card">
                <span class="input-label">${activeMode.inputLabel}</span>
                <div class="input-display">${inputValue}</div>
              </article>
            </div>
          </div>

          <article class="keypad-panel">
            <h2 class="section-title">전화기 숫자패드</h2>
            <p class="helper-text">
              ${isFractionMode() ? "분자와 분모 칸을 눌러 입력 위치를 바꿀 수 있어요." : "지우기는 한 칸 삭제, 확인은 답 제출입니다."}
            </p>
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
  const activeMode = getActiveMode();
  const levelLine = isFractionMode() ? ` ${getActiveLevel().label} 단계에서` : "";

  return `
    <section class="screen">
      <div class="stack result-layout">
        <article class="result-hero">
          <span class="eyebrow">게임 종료</span>
          <h1 class="result-score">${state.correctAnswers}문제 정답</h1>
          <p class="result-copy">
            ${activeMode.label}${levelLine} 1분 동안 총 ${state.totalAttempts}문제를 시도했고,
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

function handleAction(actionTarget) {
  const action = actionTarget.dataset.action;

  if (action === "start") {
    startGame();
  } else if (action === "close-game") {
    confirmCloseGame();
  } else if (action === "go-home") {
    goToStartScreen();
  } else if (action === "set-mode") {
    setMode(actionTarget.dataset.mode);
  } else if (action === "set-level") {
    setLevel(actionTarget.dataset.level);
  } else if (action === "focus-fraction-field") {
    setActiveFractionField(actionTarget.dataset.field);
  }
}

function handlePressTarget(event) {
  const actionTarget = event.target.closest("[data-action]");
  const keyTarget = event.target.closest("[data-key]");

  if (actionTarget) {
    handleAction(actionTarget);
    return;
  }

  if (keyTarget) {
    pressKey(keyTarget.dataset.key);
  }
}

document.addEventListener("pointerup", (event) => {
  if (event.pointerType !== "touch") {
    return;
  }

  const target = event.target.closest("[data-action], [data-key]");

  if (!target) {
    return;
  }

  lastPointerHandledAt = Date.now();
  event.preventDefault();
  handlePressTarget(event);
});

document.addEventListener("click", (event) => {
  if (Date.now() - lastPointerHandledAt < 350) {
    return;
  }

  handlePressTarget(event);
});

document.addEventListener("keydown", handleKeyboardInput);

render();
