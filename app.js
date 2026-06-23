const STORAGE_KEY = "gym-log-v2";
const LEGACY_STORAGE_KEYS = ["gym-log-v1"];
const DEFAULT_REST_SECONDS = 90;
const SETS_PER_EXERCISE = 3;

const WORKOUT_PLANS = {
  a: {
    name: "Workout A",
    description: "חזה / כתפיים / יד אחורית",
    exercises: [
      { group: "Cardio", name: "Bike", metricType: "cardio", targetSets: 1, targetReps: "", targetWeight: null, comment: "מהירות 5 - אינטרוול 4-3" },
      { group: "Chest", name: "Chest Press", machine: "29", targetSets: 3, targetReps: "10-12", targetWeight: 42.5, comment: "מכונה 29" },
      { group: "Chest", name: "Chest Fly", machine: "35", targetSets: 3, targetReps: "10-12", targetWeight: 45, comment: "מכונה 35" },
      { group: "Chest", name: "Up Chest Press", machine: "7", targetSets: 3, targetReps: "10-12", targetWeight: 7.5, comment: "מכונה 7" },
      { group: "Shoulders", name: "Shoulder Press", machine: "30", targetSets: 3, targetReps: "10-12", targetWeight: 27.5, comment: "מכונה 30" },
      { group: "Shoulders", name: "Lateral Raises - הרחקת כתפיים", targetSets: 3, targetReps: "10-12", targetWeight: 5, comment: "משקולות חופשי" },
      { group: "Triceps", name: "Triceps Extension - W", targetSets: 3, targetReps: "10-12", targetWeight: null, comment: "לחציה צרפתית - כנגד מוט - 2 תרגילים" },
      { group: "Triceps", name: "Triceps Extension", targetSets: 3, targetReps: "10-12", targetWeight: 15, comment: "כנגד כבל - מוט ישר" },
      { group: "Custom", name: "תרגיל בטן", metricType: "reps", targetSets: 3, targetReps: "10-12", targetWeight: null, comment: "Custom - 3 sets - 10-12 reps - 01:30 rest - 0/3 done" }
    ]
  },
  b: {
    name: "Workout B",
    description: "גב / כתפיים / יד קדמית / רגלים",
    exercises: [
      { group: "Cardio", name: "Bike", metricType: "cardio", targetSets: 1, targetReps: "", targetWeight: null, comment: "מהירות 5 - אינטרוול 4-3" },
      { group: "Back", name: "PullDown - Wide", machine: "21", targetSets: 3, targetReps: "10-12", targetWeight: 50, comment: "מוט רחב מעוגל" },
      { group: "Back", name: "PullDown - Narrow", machine: "21", targetSets: 3, targetReps: "10-12", targetWeight: 42.5, comment: "מוט צר - כמו של ROW" },
      { group: "Back", name: "Row", targetSets: 3, targetReps: "10-12", targetWeight: 50, comment: "מוט צר" },
      { group: "Shoulders", name: "Back Fly", machine: "35", targetSets: 3, targetReps: "10-12", targetWeight: 30, comment: "פרפר אחורי" },
      { group: "Biceps", name: "Biceps Curls", machine: "16", targetSets: 3, targetReps: "10-12", targetWeight: 12.5, comment: "כנגד כבל -משקולת למטה - מוט ישר" },
      { group: "Biceps", name: "Biceps Curls - Dumbbells", targetSets: 3, targetReps: "10-12", targetWeight: 9, comment: "פטישים - משוקלת חופשית" },
      { group: "Biceps", name: "Biceps Curls - EZ Bar Preacher Curl", targetSets: 3, targetReps: "10-12", targetWeight: null, comment: "ספסל + מוט" },
      { group: "Legs", name: "Leg Extension", machine: "23", targetSets: 3, targetReps: "10-12", targetWeight: 30, comment: "מכונה 23" },
      { group: "Legs", name: "Leg Curls", machine: "24", targetSets: 3, targetReps: "10-12", targetWeight: 40, comment: "מכונה 24" },
      { group: "Core", name: "תרגיל בטן", metricType: "reps", targetSets: 3, targetReps: "10-12", targetWeight: null, comment: "Core - 3 sets - 10-12 reps - 01:30 rest - 0/3 done" }
    ]
  }
};

const defaultState = {
  activeView: "train",
  activePlanId: "a",
  workoutName: generateWorkoutName(new Date().toISOString(), "a"),
  defaultRest: DEFAULT_REST_SECONDS,
  editMode: false,
  activeExerciseId: null,
  startedAt: new Date().toISOString(),
  exercises: createPlanExercises("a"),
  planTemplates: createPlanTemplates(DEFAULT_REST_SECONDS),
  lastSetValues: {},
  workoutTimer: {
    running: false,
    startedAt: null,
    elapsedMs: 0
  },
  workoutComplete: false,
  history: []
};

let state = loadState();
let timer = {
  total: state.defaultRest,
  remaining: state.defaultRest,
  intervalId: null,
  exerciseName: ""
};

let workoutTimerIntervalId = null;
let audioContext;
let audioPrimed = false;

const els = {
  sessionDate: document.querySelector("#sessionDate"),
  workoutTitle: document.querySelector("#workoutTitle"),
  workoutDescription: document.querySelector("#workoutDescription"),
  workoutPlanSelect: document.querySelector("#workoutPlanSelect"),
  editModeBtn: document.querySelector("#editModeBtn"),
  newWorkoutBtn: document.querySelector("#newWorkoutBtn"),
  finishWorkoutBtn: document.querySelector("#finishWorkoutBtn"),
  workoutTimerReadout: document.querySelector("#workoutTimerReadout"),
  workoutTimerSubtitle: document.querySelector("#workoutTimerSubtitle"),
  workoutTimerToggleBtn: document.querySelector("#workoutTimerToggleBtn"),
  workoutTimerResetBtn: document.querySelector("#workoutTimerResetBtn"),
  timerReadout: document.querySelector("#timerReadout"),
  timerSubtitle: document.querySelector("#timerSubtitle"),
  timerToggleBtn: document.querySelector("#timerToggleBtn"),
  timerResetBtn: document.querySelector("#timerResetBtn"),
  tabs: document.querySelectorAll(".tab"),
  views: {
    train: document.querySelector("#trainView"),
    history: document.querySelector("#historyView"),
    reports: document.querySelector("#reportsView"),
    settings: document.querySelector("#settingsView")
  },
  exerciseList: document.querySelector("#exerciseList"),
  recoveryDashboard: document.querySelector("#recoveryDashboard"),
  editPanel: document.querySelector("#editPanel"),
  addExerciseForm: document.querySelector("#addExerciseForm"),
  exerciseNameInput: document.querySelector("#exerciseNameInput"),
  restDefaultSelect: document.querySelector("#restDefaultSelect"),
  historyList: document.querySelector("#historyList"),
  statsGrid: document.querySelector("#statsGrid"),
  reportDetail: document.querySelector("#reportDetail"),
  exerciseReportList: document.querySelector("#exerciseReportList"),
  monthlyReportList: document.querySelector("#monthlyReportList"),
  recoveryReportList: document.querySelector("#recoveryReportList"),
  refreshReportsBtn: document.querySelector("#refreshReportsBtn"),
  generatedWorkoutName: document.querySelector("#generatedWorkoutName"),
  restDefaultLabel: document.querySelector("#restDefaultLabel"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  clearDataBtn: document.querySelector("#clearDataBtn"),
  exerciseTemplate: document.querySelector("#exerciseTemplate")
};

function createPlanExercises(planId, restSeconds = DEFAULT_REST_SECONDS) {
  return WORKOUT_PLANS[planId].exercises.map((exercise) => {
    const targetSets = getExerciseSetCount(exercise);
    return {
      id: makeId(),
      ...exercise,
      targetSets,
      rest: restSeconds,
      comment: exercise.comment || buildExerciseComment({ ...exercise, rest: restSeconds }, 0),
      collapsed: false,
      sets: createEmptySets(targetSets)
    };
  });
}

function createPlanTemplates(restSeconds = DEFAULT_REST_SECONDS) {
  return Object.fromEntries(
    Object.keys(WORKOUT_PLANS).map((planId) => [
      planId,
      createPlanTemplateFromExercises(createPlanExercises(planId, restSeconds), restSeconds)
    ])
  );
}

function createPlanTemplateFromExercises(exercises, restSeconds = DEFAULT_REST_SECONDS) {
  return (exercises || []).map((exercise) => {
    const rest = Number(exercise.rest) || restSeconds;
    const targetSets = getExerciseSetCount(exercise);
    return {
      ...exercise,
      id: exercise.id || makeId(),
      targetSets,
      rest,
      comment: exercise.comment || buildExerciseComment({ ...exercise, rest }, 0),
      collapsed: false,
      sets: createEmptySets(targetSets)
    };
  });
}

function createExercisesFromTemplate(planId, restSeconds = DEFAULT_REST_SECONDS) {
  const template = state.planTemplates?.[planId]?.length
    ? state.planTemplates[planId]
    : createPlanExercises(planId, restSeconds);

  return createPlanTemplateFromExercises(template, restSeconds)
    .map((exercise) => normalizeExercise({ ...exercise, sets: createEmptySets(getExerciseSetCount(exercise)), collapsed: false }, planId, restSeconds));
}

function createEmptySets(count = SETS_PER_EXERCISE) {
  return Array.from({ length: count }, () => null);
}

function makeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadState() {
  try {
    const saved = readSavedState();
    if (!saved) return structuredClone(defaultState);

    const activePlanId = WORKOUT_PLANS[saved.activePlanId] ? saved.activePlanId : "a";
    const defaultRest = Number(saved.defaultRest) || DEFAULT_REST_SECONDS;
    const hasUsableExercises = Array.isArray(saved.exercises) && saved.exercises.length > 0;
    const migratedExercises = hasUsableExercises ? saved.exercises : createPlanExercises(activePlanId, defaultRest);
    const planTemplates = normalizePlanTemplates(saved.planTemplates, activePlanId, migratedExercises, defaultRest);

    return {
      ...defaultState,
      ...saved,
      activePlanId,
      defaultRest,
      editMode: Boolean(saved.editMode),
      activeExerciseId: saved.activeExerciseId || null,
      workoutComplete: Boolean(saved.workoutComplete),
      workoutTimer: {
        running: Boolean(saved.workoutTimer?.running),
        startedAt: saved.workoutTimer?.startedAt || null,
        elapsedMs: Number(saved.workoutTimer?.elapsedMs) || 0
      },
      planTemplates,
      workoutName: generateWorkoutName(saved.startedAt || new Date().toISOString(), activePlanId),
      exercises: migratedExercises.map((exercise) => normalizeExercise(exercise, activePlanId, defaultRest))
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizePlanTemplates(savedTemplates, activePlanId, activeExercises, defaultRest) {
  const templates = createPlanTemplates(defaultRest);

  Object.keys(WORKOUT_PLANS).forEach((planId) => {
    if (Array.isArray(savedTemplates?.[planId]) && savedTemplates[planId].length) {
      templates[planId] = createPlanTemplateFromExercises(
        savedTemplates[planId].map((exercise) => normalizeExercise(exercise, planId, defaultRest)),
        defaultRest
      );
    }
  });

  if (Array.isArray(activeExercises) && activeExercises.length) {
    templates[activePlanId] = createPlanTemplateFromExercises(
      activeExercises.map((exercise) => normalizeExercise(exercise, activePlanId, defaultRest)),
      defaultRest
    );
  }

  return templates;
}

function normalizeExercise(exercise, planId = "a", defaultRest = DEFAULT_REST_SECONDS) {
  const planDefaults = WORKOUT_PLANS[planId]?.exercises.find((item) =>
    item.name === exercise.name || item.aliases?.includes(exercise.name)
  ) || {};
  const merged = { ...planDefaults, ...exercise };
  if (planDefaults.name === "Chest Fly" && exercise.name === "Fly's") {
    merged.name = "Chest Fly";
  }
  const rest = Number(merged.rest) || defaultRest;
  const targetSets = getExerciseSetCount(merged);
  const sets = normalizeSets(exercise.sets, rest, targetSets);

  return {
    rest,
    sets,
    ...merged,
    targetSets,
    comment: merged.comment || buildExerciseComment({ ...merged, rest }, sets.filter(Boolean).length),
    collapsed: Boolean(merged.collapsed),
    rest,
    id: merged.id || makeId()
  };
}

function normalizeSets(sets = [], defaultRest = DEFAULT_REST_SECONDS, count = SETS_PER_EXERCISE) {
  const normalized = createEmptySets(count);
  sets.slice(0, count).forEach((set, index) => {
    normalized[index] = set && isValidLoggedSet(set)
      ? { ...set, rest: Number(set.rest) || defaultRest }
      : null;
  });
  return normalized;
}

function isValidLoggedSet(set) {
  if (!set) return false;
  const hasStrength = Number.isFinite(Number(set.weight)) && Number.isFinite(Number(set.reps)) && Number(set.reps) > 0;
  const hasReps = Number.isFinite(Number(set.reps)) && Number(set.reps) > 0;
  const hasCardio = Number.isFinite(Number(set.distanceKm)) || Number.isFinite(Number(set.calories)) || Number.isFinite(Number(set.minutes));
  return hasStrength || hasReps || hasCardio;
}

function readSavedState() {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return JSON.parse(current);

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return JSON.parse(legacy);
  }

  return null;
}

function saveState() {
  persistCurrentPlanTemplate();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function persistCurrentPlanTemplate() {
  if (!WORKOUT_PLANS[state.activePlanId]) return;
  state.planTemplates ||= createPlanTemplates(state.defaultRest);
  state.planTemplates[state.activePlanId] = createPlanTemplateFromExercises(state.exercises, state.defaultRest);
}

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.max(0, seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateShort(value) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function generateWorkoutName(dateValue, planId) {
  const date = new Date(dateValue);
  const dateText = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  return `${dateText} ${weekday} ${planId.toUpperCase()} Workout`;
}

function render() {
  state.workoutName = generateWorkoutName(state.startedAt, state.activePlanId);
  els.sessionDate.textContent = formatDate(state.startedAt);
  els.workoutTitle.textContent = state.workoutName;
  els.workoutDescription.textContent = WORKOUT_PLANS[state.activePlanId]?.description || "";
  els.workoutPlanSelect.value = state.activePlanId;
  els.finishWorkoutBtn.classList.toggle("ready", isWorkoutComplete());
  els.finishWorkoutBtn.classList.toggle("active", hasWorkoutActivity());
  els.finishWorkoutBtn.title = "End workout";
  els.finishWorkoutBtn.setAttribute("aria-label", "End workout");
  els.editModeBtn.textContent = state.editMode ? "Done editing" : "Edit";
  els.editPanel.classList.toggle("active", state.editMode);
  els.restDefaultSelect.value = String(state.defaultRest);
  els.generatedWorkoutName.textContent = state.workoutName;
  els.restDefaultLabel.textContent = formatSeconds(state.defaultRest);

  renderTabs();
  renderRecoveryDashboard();
  renderExercises();
  renderHistory();
  renderReports();
  renderWorkoutTimer();
  renderTimer();
}

function renderPreservingScroll() {
  const scrollY = window.scrollY;
  render();
  window.requestAnimationFrame(() => window.scrollTo({ top: scrollY, left: 0 }));
}

function renderTabs() {
  els.tabs.forEach((tab) => {
    const isActive = tab.dataset.view === state.activeView;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(els.views).forEach(([name, view]) => {
    view.classList.toggle("active", name === state.activeView);
  });
}

function renderRecoveryDashboard() {
  els.recoveryDashboard.replaceChildren();
  const groups = getActiveWorkoutMuscleGroups();

  if (!groups.length) {
    els.recoveryDashboard.hidden = true;
    return;
  }

  els.recoveryDashboard.hidden = false;
  groups.forEach((group) => {
    const recovery = getMuscleGroupRecovery(group);
    const card = document.createElement("button");
    card.type = "button";
    card.className = `recovery-card ${recovery.status}`;
    card.innerHTML = `
      <span>${escapeHTML(group)}</span>
      <strong>${escapeHTML(recovery.label)}</strong>
      <small>${escapeHTML(recovery.detail)}</small>
    `;
    card.addEventListener("click", () => {
      state.activeView = "reports";
      saveState();
      render();
      showRecoveryReport(group);
      window.scrollTo({ top: 0, left: 0 });
    });
    els.recoveryDashboard.append(card);
  });
}

function renderExercises() {
  els.exerciseList.replaceChildren();

  if (!state.exercises.length) {
    els.exerciseList.append(emptyMessage("Add your first exercise to start this workout."));
    return;
  }

  const activeExercise = state.exercises.find((exercise) => exercise.id === state.activeExerciseId);
  if (activeExercise) {
    els.exerciseList.append(createExerciseDetail(activeExercise));
    return;
  }

  state.activeExerciseId = null;
  const menu = document.createElement("div");
  menu.className = "exercise-menu";
  state.exercises.forEach((exercise) => {
    menu.append(createExerciseMenuItem(exercise));
  });
  els.exerciseList.append(menu);
}

function createExerciseMenuItem(exercise) {
  const doneCount = (exercise.sets || []).filter(Boolean).length;
  const setCount = getExerciseSetCount(exercise);
  const isComplete = isExerciseComplete(exercise);
  const progression = getExerciseProgression(exercise);
  const row = document.createElement("article");
  row.className = "exercise-menu-item";
  row.classList.toggle("complete", isComplete);

  const openButton = document.createElement("button");
  openButton.className = "exercise-open-button";
  openButton.type = "button";
  openButton.innerHTML = `
    <span class="complete-mark ${isComplete ? "" : "pending"}">${isComplete ? "V" : doneCount}</span>
    <span>
      <strong>${escapeHTML(exercise.name)}</strong>
      <small>${escapeHTML(exercise.comment || exerciseSubtitle(exercise))}</small>
      ${createProgressionSummaryHTML(progression, "compact")}
    </span>
    <span class="exercise-progress">${doneCount}/${setCount}</span>
  `;
  openButton.addEventListener("click", () => {
    state.activeExerciseId = exercise.id;
    saveState();
    render();
    window.scrollTo({ top: 0, left: 0 });
  });
  row.append(openButton);

  if (state.editMode) {
    const actionsNode = document.createElement("div");
    actionsNode.className = "exercise-actions menu-actions";
    const currentIndex = state.exercises.findIndex((item) => item.id === exercise.id);
    if (currentIndex > 0) {
      actionsNode.append(createMoveButton(exercise, -1));
    }
    if (currentIndex < state.exercises.length - 1) {
      actionsNode.append(createMoveButton(exercise, 1));
    }
    const removeButton = document.createElement("button");
    removeButton.className = "icon-button remove-exercise";
    removeButton.type = "button";
    removeButton.textContent = "x";
    removeButton.addEventListener("click", () => {
      if (!confirm(`Remove ${exercise.name}?`)) return;
      state.exercises = state.exercises.filter((item) => item.id !== exercise.id);
      if (state.activeExerciseId === exercise.id) state.activeExerciseId = null;
      saveState();
      renderPreservingScroll();
    });
    actionsNode.append(removeButton);
    row.append(actionsNode);
  }

  return row;
}

function createExerciseDetail(exercise) {
  const node = els.exerciseTemplate.content.firstElementChild.cloneNode(true);
  const isComplete = isExerciseComplete(exercise);
  const headerNode = node.querySelector(".exercise-header");
  const title = node.querySelector(".exercise-name");
  const subtitle = node.querySelector(".exercise-comment");
  const setsNode = node.querySelector(".sets");
  const removeButton = node.querySelector(".remove-exercise");
  const actionsNode = document.createElement("div");
  const doneCount = (exercise.sets || []).filter(Boolean).length;
  const setCount = getExerciseSetCount(exercise);
  const progression = getExerciseProgression(exercise);

  node.classList.add("exercise-focus-card");
  node.classList.toggle("complete", isComplete);
  title.value = exercise.name;
  title.addEventListener("input", () => {
    persistExerciseName(exercise, title.value);
  });
  title.addEventListener("change", () => {
    persistExerciseName(exercise, title.value, { requireValid: true });
    title.value = exercise.name;
    saveState();
  });
  subtitle.value = exercise.comment || exerciseSubtitle(exercise);
  subtitle.addEventListener("input", () => {
    persistExerciseComment(exercise, subtitle.value);
  });
  subtitle.addEventListener("change", () => {
    persistExerciseComment(exercise, subtitle.value, { requireValid: true });
    subtitle.value = exercise.comment;
    saveState();
  });
  removeButton.remove();

  actionsNode.className = "exercise-actions";
  const backButton = document.createElement("button");
  backButton.className = "ghost-button back-button";
  backButton.type = "button";
  backButton.textContent = "Back";
  backButton.addEventListener("click", () => {
    state.activeExerciseId = null;
    saveState();
    render();
  });
  actionsNode.append(backButton);
  headerNode.append(actionsNode);

  const focusMeta = document.createElement("div");
  focusMeta.className = "exercise-focus-meta";
  focusMeta.innerHTML = `
    <span>${doneCount}/${setCount} ${getExerciseMetricType(exercise) === "cardio" ? "entry" : "sets"} done</span>
    <span>Rest ${formatSeconds(state.defaultRest)}</span>
  `;
  headerNode.after(focusMeta);

  const progressionPanel = document.createElement("div");
  progressionPanel.className = "progression-panel";
  progressionPanel.innerHTML = createProgressionSummaryHTML(progression, "detail");
  focusMeta.after(progressionPanel);

  exercise.sets = normalizeSets(exercise.sets, state.defaultRest, setCount);
  exercise.sets.slice(0, setCount).forEach((set, index) => {
    setsNode.append(createSetForm(exercise, set, index));
  });

  return node;
}

function persistExerciseName(exercise, value, options = {}) {
  const nextName = value.trim();
  if (!nextName) {
    if (options.requireValid) return;
    return;
  }
  migrateExerciseMemoryKeys(exercise.name, nextName);
  exercise.name = nextName;
  saveState();
}

function persistExerciseComment(exercise, value, options = {}) {
  const fallback = exerciseSubtitle(exercise);
  const nextComment = value.trim();
  if (!nextComment && !options.requireValid) {
    exercise.comment = "";
  } else {
    exercise.comment = nextComment || fallback;
  }
  saveState();
}

function createMoveButton(exercise, direction) {
  const button = document.createElement("button");
  const currentIndex = state.exercises.findIndex((item) => item.id === exercise.id);
  const nextIndex = currentIndex + direction;
  button.className = "icon-button move-button";
  button.type = "button";
  button.textContent = direction < 0 ? "Up" : "Dn";
  button.addEventListener("click", () => {
    const [moved] = state.exercises.splice(currentIndex, 1);
    state.exercises.splice(nextIndex, 0, moved);
    saveState();
    renderPreservingScroll();
  });
  return button;
}

function createSetForm(exercise, set, index) {
  const wasCompleteBeforeSubmit = isExerciseComplete(exercise);
  const metricType = getExerciseMetricType(exercise);
  const previousSet = set || getLastSetValue(exercise, index);
  const weightValue = previousSet?.weight ?? "";
  const repsValue = previousSet?.reps ?? "";
  const distanceValue = previousSet?.distanceKm ?? "";
  const caloriesValue = previousSet?.calories ?? "";
  const minutesValue = previousSet?.minutes ?? "";
  const form = document.createElement("form");
  form.className = `planned-set-form ${metricType}-set-form`;

  if (metricType === "cardio") {
    form.innerHTML = `
      <span class="set-index">1</span>
      <input name="distanceKm" type="number" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" min="0" step="0.01" placeholder="km" aria-label="${exercise.name} distance km" value="${distanceValue}">
      <input name="calories" type="number" inputmode="numeric" pattern="[0-9]*" min="0" step="1" placeholder="cal" aria-label="${exercise.name} calories" value="${caloriesValue}">
      <input name="minutes" type="number" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" min="0" step="0.5" placeholder="min" aria-label="${exercise.name} minutes" value="${minutesValue}">
      <button type="submit" class="primary-button">${set ? "Update" : "Done"}</button>
    `;
  } else if (metricType === "reps") {
    form.innerHTML = `
      <span class="set-index">${index + 1}</span>
      <input name="reps" type="number" inputmode="numeric" pattern="[0-9]*" min="1" step="1" placeholder="${exercise.targetReps || "reps"}" aria-label="Set ${index + 1} reps" value="${repsValue}">
      <button type="submit" class="primary-button">${set ? "Update" : "Done"}</button>
    `;
  } else {
    form.innerHTML = `
      <span class="set-index">${index + 1}</span>
      <input name="weight" type="number" inputmode="decimal" pattern="[0-9]*[.,]?[0-9]*" min="0" step="0.5" placeholder="${exercise.targetWeight || "kg"}" aria-label="Set ${index + 1} weight" value="${weightValue}">
      <input name="reps" type="number" inputmode="numeric" pattern="[0-9]*" min="1" step="1" placeholder="${exercise.targetReps || "reps"}" aria-label="Set ${index + 1} reps" value="${repsValue}">
      <button type="submit" class="primary-button">${set ? "Update" : "Done"}</button>
    `;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    primeAudio();
    const formData = new FormData(form);
    const loggedSet = buildLoggedSetFromForm(formData, metricType, set);

    if (!loggedSet) return;

    exercise.sets[index] = loggedSet;
    state.lastSetValues[getSetMemoryKey(exercise, index)] = { ...loggedSet, rest: state.defaultRest };
    if (isExerciseComplete(exercise) && !wasCompleteBeforeSubmit) {
      exercise.collapsed = true;
      state.activeExerciseId = null;
    }
    if (isWorkoutComplete()) {
      completeWorkoutTimer();
    }
    if (metricType === "cardio") {
      stopTimer();
      timer.total = state.defaultRest;
      timer.remaining = state.defaultRest;
      timer.exerciseName = "";
      renderTimer();
    } else {
      startTimer(state.defaultRest, `${exercise.name} set ${index + 1}`);
    }
    saveState();
    renderPreservingScroll();
  });

  return form;
}

function buildLoggedSetFromForm(formData, metricType, previousSet) {
  const baseSet = {
    id: previousSet?.id || makeId(),
    rest: state.defaultRest,
    loggedAt: new Date().toISOString()
  };

  if (metricType === "cardio") {
    const distanceKm = Number(formData.get("distanceKm"));
    const calories = Number(formData.get("calories"));
    const minutes = Number(formData.get("minutes"));
    if (![distanceKm, calories, minutes].some((value) => Number.isFinite(value) && value > 0)) return null;
    return {
      ...baseSet,
      distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
      calories: Number.isFinite(calories) ? calories : 0,
      minutes: Number.isFinite(minutes) ? minutes : 0
    };
  }

  const reps = Number(formData.get("reps"));
  if (!Number.isFinite(reps) || reps <= 0) return null;

  if (metricType === "reps") {
    return { ...baseSet, reps };
  }

  const weight = Number(formData.get("weight"));
  if (!Number.isFinite(weight)) return null;
  return { ...baseSet, weight, reps };
}

function getSetMemoryKey(exercise, index) {
  return `${state.activePlanId}:${exercise.name}:${index}`;
}

function formatLoggedSet(set, exercise) {
  const metricType = getExerciseMetricType(exercise);
  if (metricType === "cardio") {
    return `${formatChartNumber(set.distanceKm || 0)}km / ${Math.round(Number(set.calories) || 0)}cal / ${formatChartNumber(set.minutes || 0)}min`;
  }
  if (metricType === "reps") {
    return `${set.reps} reps`;
  }
  return `${set.weight}kg x ${set.reps}`;
}

function getExerciseProgression(exercise) {
  const current = summarizeExercisePerformance(exercise);
  const previous = findPreviousExerciseSummary(exercise.name);
  const records = getExerciseRecords(exercise.name);
  const metricType = getExerciseMetricType(exercise);
  const metrics = getProgressionMetrics(metricType);

  return {
    metricType,
    current,
    previous,
    metrics: metrics.map((metric) => {
      const currentValue = Number(current[metric.key]) || 0;
      const previousValue = previous ? Number(previous[metric.key]) || 0 : null;
      const recordValue = Number(records[metric.key]) || 0;
      const delta = previous ? currentValue - previousValue : null;
      return {
        ...metric,
        currentValue,
        previousValue,
        delta,
        status: getMetricStatus(delta, Boolean(previous), current.sets > 0),
        isRecord: current.sets > 0 && currentValue > 0 && currentValue >= recordValue
      };
    })
  };
}

function createProgressionSummaryHTML(progression, mode = "compact") {
  if (!progression.current.sets) {
    return `<div class="progression-row ${mode}"><span class="metric-pill neutral">Log sets to compare</span></div>`;
  }

  const pills = progression.metrics.map((metric) => `
    <span class="metric-pill ${metric.status}">
      <b>${escapeHTML(metric.label)}</b>
      ${metric.delta === null ? escapeHTML(formatProgressionValue(metric.currentValue, metric)) : escapeHTML(formatSignedNumber(metric.delta, metric.suffix))}
    </span>
  `).join("");
  const records = progression.metrics.filter((metric) => metric.isRecord);
  const badges = records.length
    ? `<span class="pr-badge">PR ${escapeHTML(records.map((metric) => metric.shortLabel).join(" / "))}</span>`
    : "";
  const note = progression.previous
    ? ""
    : `<span class="metric-pill neutral">First logged session</span>`;

  return `<div class="progression-row ${mode}">${pills}${note}${badges}</div>`;
}

function summarizeExercisePerformance(exercise) {
  const metricType = getExerciseMetricType(exercise);
  const sets = (exercise.sets || []).filter(Boolean);
  const summary = {
    sets: sets.length,
    bestWeight: 0,
    totalReps: 0,
    totalVolume: 0,
    distanceKm: 0,
    calories: 0,
    minutes: 0
  };

  sets.forEach((set) => {
    if (metricType === "cardio") {
      summary.distanceKm += Number(set.distanceKm) || 0;
      summary.calories += Number(set.calories) || 0;
      summary.minutes += Number(set.minutes) || 0;
      return;
    }

    const weight = metricType === "reps" ? 1 : Number(set.weight) || 0;
    const reps = Number(set.reps) || 0;
    summary.bestWeight = Math.max(summary.bestWeight, Number(set.weight) || 0);
    summary.totalReps += reps;
    summary.totalVolume += weight * reps;
  });

  return summary;
}

function findPreviousExerciseSummary(exerciseName) {
  for (const workout of state.history || []) {
    const exercise = (workout.exercises || []).find((item) => item.name === exerciseName);
    if (!exercise) continue;
    const summary = summarizeExercisePerformance(exercise);
    if (summary.sets > 0) {
      return {
        ...summary,
        workout,
        date: new Date(workout.finishedAt || workout.startedAt)
      };
    }
  }
  return null;
}

function getExerciseRecords(exerciseName) {
  const records = {
    bestWeight: 0,
    totalReps: 0,
    totalVolume: 0,
    distanceKm: 0,
    calories: 0,
    minutes: 0
  };

  (state.history || []).forEach((workout) => {
    const exercise = (workout.exercises || []).find((item) => item.name === exerciseName);
    if (!exercise) return;
    const summary = summarizeExercisePerformance(exercise);
    Object.keys(records).forEach((key) => {
      records[key] = Math.max(records[key], Number(summary[key]) || 0);
    });
  });

  return records;
}

function getProgressionMetrics(metricType) {
  if (metricType === "cardio") {
    return [
      { key: "distanceKm", label: "KM", shortLabel: "KM", suffix: " km" },
      { key: "calories", label: "Cal", shortLabel: "Cal", suffix: " cal" },
      { key: "minutes", label: "Time", shortLabel: "Time", suffix: " min" }
    ];
  }

  if (metricType === "reps") {
    return [
      { key: "totalReps", label: "Reps", shortLabel: "Reps", suffix: " reps" },
      { key: "totalVolume", label: "Total", shortLabel: "Total", suffix: " reps" }
    ];
  }

  return [
    { key: "bestWeight", label: "Weight", shortLabel: "KG", suffix: " kg" },
    { key: "totalReps", label: "Reps", shortLabel: "Reps", suffix: " reps" },
    { key: "totalVolume", label: "Volume", shortLabel: "Vol", suffix: " kg-reps" }
  ];
}

function getMetricStatus(delta, hasPrevious, hasCurrent) {
  if (!hasCurrent || !hasPrevious || delta === null) return "neutral";
  if (delta > 0) return "improved";
  if (delta < 0) return "declined";
  return "same";
}

function formatProgressionValue(value, metric) {
  return `${formatChartNumber(value)}${metric.suffix}`;
}

function migrateExerciseMemoryKeys(previousName, nextName) {
  if (!state.lastSetValues || previousName === nextName) return;

  for (let index = 0; index < SETS_PER_EXERCISE; index += 1) {
    const previousKey = `${state.activePlanId}:${previousName}:${index}`;
    const nextKey = `${state.activePlanId}:${nextName}:${index}`;
    if (state.lastSetValues[previousKey] && !state.lastSetValues[nextKey]) {
      state.lastSetValues[nextKey] = state.lastSetValues[previousKey];
    }
  }
}

function getLastSetValue(exercise, index) {
  const remembered = state.lastSetValues?.[getSetMemoryKey(exercise, index)];
  if (remembered) return remembered;

  for (const workout of state.history || []) {
    const previousExercise = (workout.exercises || []).find((item) => item.name === exercise.name);
    const previousSet = previousExercise?.sets?.[index];
    if (previousSet) return previousSet;
  }

  return null;
}

function exerciseSubtitle(exercise) {
  return buildExerciseComment(exercise, (exercise.sets || []).filter(Boolean).length);
}

function buildExerciseComment(exercise, doneCount = 0) {
  const metricType = getExerciseMetricType(exercise);
  if (metricType === "cardio") {
    return [
      "Cardio",
      "km",
      "calories",
      "minutes",
      `${doneCount}/1 done`
    ].join(" - ");
  }
  if (metricType === "reps") {
    return [
      exercise.group || "Core",
      `${SETS_PER_EXERCISE} sets`,
      `${exercise.targetReps || "reps"} reps`,
      `${formatSeconds(Number(exercise.rest) || DEFAULT_REST_SECONDS)} rest`,
      `${doneCount}/${SETS_PER_EXERCISE} done`
    ].join(" - ");
  }

  const targetWeight = exercise.targetWeight ? `${exercise.targetWeight} kg` : "no weight target";
  const machine = exercise.machine ? `machine ${exercise.machine}` : "free weight";
  return [
    exercise.group,
    `${SETS_PER_EXERCISE} sets`,
    `${exercise.targetReps || "10-12"} reps`,
    targetWeight,
    machine,
    `${formatSeconds(Number(exercise.rest) || DEFAULT_REST_SECONDS)} rest`,
    `${doneCount}/${SETS_PER_EXERCISE} done`
  ].filter(Boolean).join(" - ");
}

function isExerciseComplete(exercise) {
  return (exercise.sets || []).filter(Boolean).length >= getExerciseSetCount(exercise);
}

function getExerciseSetCount(exercise) {
  return getExerciseMetricType(exercise) === "cardio" ? 1 : SETS_PER_EXERCISE;
}

function getExerciseMetricType(exercise) {
  const value = `${exercise?.metricType || ""} ${exercise?.name || ""} ${exercise?.group || ""}`.toLowerCase();
  if (exercise?.metricType === "cardio" || value.includes("bike") || value.includes("אופניים")) return "cardio";
  if (exercise?.metricType === "reps" || value.includes("בטן") || value.includes("abs") || value.includes("core")) return "reps";
  return "strength";
}

function isWorkoutComplete() {
  return state.exercises.length > 0 && state.exercises.every(isExerciseComplete);
}

function getActiveWorkoutMuscleGroups() {
  return uniqueMuscleGroups(state.exercises || []);
}

function getWorkoutMuscleGroups(workout) {
  return uniqueMuscleGroups((workout.exercises || []).filter((exercise) =>
    (exercise.sets || []).filter(Boolean).length
  ));
}

function uniqueMuscleGroups(exercises) {
  const groups = new Set();
  exercises.forEach((exercise) => {
    const group = getMuscleGroup(exercise);
    if (group) groups.add(group);
  });
  return [...groups];
}

function getMuscleGroup(exercise) {
  if (getExerciseMetricType(exercise) === "cardio") return "";
  if (getExerciseMetricType(exercise) === "reps") return "Core";
  return exercise.group || "Custom";
}

function getMuscleGroupRecovery(group) {
  const now = Date.now();
  const lastWorkout = (state.history || []).find((workout) => getWorkoutMuscleGroups(workout).includes(group));

  if (!lastWorkout) {
    return {
      group,
      status: "neutral",
      label: "No history",
      detail: "No completed session yet",
      lastDate: null,
      hoursSince: Infinity,
      daysSince: null,
      workouts: []
    };
  }

  const lastDate = new Date(lastWorkout.finishedAt || lastWorkout.startedAt);
  const hoursSince = Math.max(0, (now - lastDate.getTime()) / 36e5);
  const status = hoursSince > 72 ? "ready" : hoursSince >= 48 ? "caution" : "danger";
  return {
    group,
    status,
    label: status === "ready" ? "Ready" : status === "caution" ? "48-72h" : "<48h",
    detail: `${formatDaysSince(hoursSince)} since ${formatDateShort(lastDate)}`,
    lastDate,
    hoursSince,
    daysSince: hoursSince / 24,
    workouts: getMuscleGroupWorkouts(group)
  };
}

function getMuscleGroupWorkouts(group) {
  return (state.history || []).filter((workout) => getWorkoutMuscleGroups(workout).includes(group));
}

function getRecoveryRows() {
  const groups = new Set(getActiveWorkoutMuscleGroups());
  (state.history || []).forEach((workout) => {
    getWorkoutMuscleGroups(workout).forEach((group) => groups.add(group));
  });
  return [...groups].sort().map((group) => getMuscleGroupRecovery(group));
}

function formatDaysSince(hours) {
  if (!Number.isFinite(hours)) return "No data";
  if (hours < 24) return `${Math.max(1, Math.floor(hours))}h`;
  const days = hours / 24;
  return `${formatChartNumber(days)}d`;
}

function renderHistory() {
  els.historyList.replaceChildren();

  if (!state.history.length) {
    els.historyList.append(emptyMessage("Finished workouts will appear here."));
    return;
  }

  state.history.forEach((workout) => {
    const totalSets = workout.exercises.reduce((sum, exercise) => sum + (exercise.sets || []).filter(Boolean).length, 0);
    const duration = workout.durationMs ? formatDuration(workout.durationMs) : "00:00:00";
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <strong>${workout.name}</strong>
      <p>${duration} training - ${totalSets} sets - ${workout.exercises.length} exercises</p>
      <details>
        <summary>Workout data</summary>
        <div class="subdata">
          <p>Started: ${formatDate(workout.startedAt)}</p>
          <p>Ended: ${formatDate(workout.finishedAt || workout.startedAt)}</p>
          ${(workout.exercises || []).map((exercise) => {
            const sets = (exercise.sets || []).filter(Boolean);
            return `<p>${exercise.name}: ${sets.map((set) => formatLoggedSet(set, exercise)).join(", ") || "no sets"}</p>`;
          }).join("")}
        </div>
      </details>
    `;
    els.historyList.append(item);
  });
}

function renderReports() {
  const workouts = state.history || [];
  const completedSets = workouts.flatMap((workout) =>
    (workout.exercises || []).flatMap((exercise) =>
      (exercise.sets || []).filter(Boolean).map((set) => ({
        workout,
        exercise,
        set,
        date: new Date(workout.finishedAt || workout.startedAt)
      }))
    )
  );

  const totalDurationMs = workouts.reduce((sum, workout) => sum + (Number(workout.durationMs) || 0), 0);
  const totalSets = completedSets.length;
  const totalVolume = completedSets.reduce((sum, row) => sum + Number(row.set.weight || 0) * Number(row.set.reps || 0), 0);
  const avgWorkoutMs = workouts.length ? totalDurationMs / workouts.length : 0;
  const recoveryRows = getRecoveryRows();
  const readyGroups = recoveryRows.filter((row) => row.status === "ready").length;
  const byWorkout = workouts.map((workout) => {
    const sets = (workout.exercises || []).flatMap((exercise) => (exercise.sets || []).filter(Boolean));
    const volume = sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);
    return {
      workout,
      sets: sets.length,
      volume,
      durationMs: Number(workout.durationMs) || 0,
      date: new Date(workout.finishedAt || workout.startedAt)
    };
  });

  els.statsGrid.replaceChildren(
    createStatCard("Workouts", workouts.length, `${totalSets} sets logged`, () => showWorkoutReport(byWorkout)),
    createStatCard("Gym time", formatDuration(totalDurationMs), `${formatDuration(avgWorkoutMs)} average workout`, () => showGymTimeReport(byWorkout)),
    createStatCard("Avg workout", formatDuration(avgWorkoutMs), `${workouts.length} finished workouts`, () => showGymTimeReport(byWorkout)),
    createStatCard("Sets", totalSets, `${Math.round(totalVolume)} kg-reps volume`, () => showSetReport(completedSets)),
    createStatCard("Volume", `${Math.round(totalVolume)} kg-reps`, "Weight x reps across all sets", () => showVolumeReport(completedSets)),
    createStatCard("Recovery", `${readyGroups}/${recoveryRows.length}`, "Muscle groups ready", () => showRecoveryOverview(recoveryRows))
  );

  renderExerciseReports(completedSets.filter((row) => getExerciseMetricType(row.exercise) === "strength"));
  renderMonthlyReports(workouts);
  renderRecoveryReports(recoveryRows);

  if (!workouts.length) {
    els.reportDetail.innerHTML = `<div class="empty">Finish workouts to unlock the report system.</div>`;
  } else if (!els.reportDetail.dataset.activeReport) {
    showWorkoutReport(byWorkout);
  }
}

function createStatCard(label, value, detail, onClick) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "stat-card";
  card.innerHTML = `<span>${label}</span><strong>${value}</strong><p>${detail}</p>`;
  card.addEventListener("click", onClick);
  return card;
}

function renderExerciseReports(completedSets) {
  els.exerciseReportList.replaceChildren();
  const byExercise = new Map();

  completedSets.forEach((row) => {
    const name = row.exercise.name;
    const item = byExercise.get(name) || {
      name,
      sets: 0,
      bestWeight: 0,
      bestVolumeSet: 0,
      totalVolume: 0,
      points: []
    };
    const weight = Number(row.set.weight) || 0;
    const reps = Number(row.set.reps) || 0;
    const volume = weight * reps;
    item.sets += 1;
    item.bestWeight = Math.max(item.bestWeight, weight);
    item.bestVolumeSet = Math.max(item.bestVolumeSet, volume);
    item.totalVolume += volume;
    const workoutKey = row.workout.id || row.workout.startedAt;
    let point = item.points.find((entry) => entry.workoutKey === workoutKey);
    if (!point) {
      point = {
        workoutKey,
        date: row.date,
        workoutName: row.workout.name,
        bestWeight: 0,
        bestReps: 0,
        bestSetVolume: 0,
        strengthScore: 0,
        volume: 0,
        totalReps: 0,
        sets: 0
      };
      item.points.push(point);
    }
    if (weight > point.bestWeight || (weight === point.bestWeight && reps > point.bestReps)) {
      point.bestWeight = weight;
      point.bestReps = reps;
    }
    point.bestSetVolume = Math.max(point.bestSetVolume, volume);
    point.strengthScore = Math.max(point.strengthScore, estimateOneRepMax(weight, reps));
    point.volume += volume;
    point.totalReps += reps;
    point.sets += 1;
    byExercise.set(name, item);
  });

  const reports = [...byExercise.values()].sort((a, b) => b.totalVolume - a.totalVolume);
  if (!reports.length) {
    els.exerciseReportList.append(emptyMessage("Finish workouts to build exercise trends."));
    return;
  }

  reports.forEach((item) => {
    item.points.sort((a, b) => a.date - b.date);
    const firstPoint = item.points[0];
    const lastPoint = item.points[item.points.length - 1];
    const strengthDelta = lastPoint.strengthScore - firstPoint.strengthScore;
    const bestWeightDelta = lastPoint.bestWeight - firstPoint.bestWeight;
    const trend = formatSignedNumber(strengthDelta, " kg");
    const row = document.createElement("button");
    row.type = "button";
    row.className = "report-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <p>${item.points.length} workouts - strength ${trend} - best ${item.bestWeight} kg</p>
      </div>
      ${createTrendChart(item.points.map((point) => point.strengthScore), item.points.map((point) => point.volume), {
        lineLabel: "est 1RM",
        barLabel: "volume",
        pointLabels: item.points.map((point) => formatDateShort(point.date))
      })}
      <p class="report-foot">Last: ${lastPoint.bestWeight} kg x ${lastPoint.bestReps} - best weight ${formatSignedNumber(bestWeightDelta, " kg")}</p>
    `;
    row.addEventListener("click", () => showExerciseReport(item));
    els.exerciseReportList.append(row);
  });
}

function renderMonthlyReports(workouts) {
  els.monthlyReportList.replaceChildren();
  const byMonth = new Map();

  workouts.forEach((workout) => {
    const date = new Date(workout.finishedAt || workout.startedAt);
    const key = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
    const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);
    const item = byMonth.get(key) || { key, monthDate, workouts: 0, durationMs: 0, sets: 0, volume: 0, workoutsList: [] };
    const sets = (workout.exercises || []).flatMap((exercise) => (exercise.sets || []).filter(Boolean));
    item.workouts += 1;
    item.durationMs += Number(workout.durationMs) || 0;
    item.sets += sets.length;
    item.volume += sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);
    item.workoutsList.push(workout);
    byMonth.set(key, item);
  });

  const reports = [...byMonth.values()].sort((a, b) => a.monthDate - b.monthDate);
  if (!reports.length) {
    els.monthlyReportList.append(emptyMessage("Monthly totals appear after you finish workouts."));
    return;
  }

  reports.forEach((item) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "report-item";
    row.innerHTML = `
      <div>
        <strong>${item.key}</strong>
        <p>${item.workouts} workouts - ${formatDuration(item.durationMs)} - ${item.sets} sets</p>
      </div>
      ${createTrendChart(
        item.workoutsList.map((workout) => durationMinutes(workout.durationMs)),
        item.workoutsList.map((workout) =>
          (workout.exercises || []).flatMap((exercise) => (exercise.sets || []).filter(Boolean))
            .reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0)
        ),
        { lineLabel: "min", barLabel: "volume", pointLabels: item.workoutsList.map((workout) => formatDateShort(workout.finishedAt || workout.startedAt)) }
      )}
      <p class="report-foot">Average: ${formatDuration(item.durationMs / item.workouts)} - volume ${Math.round(item.volume)}</p>
    `;
    row.addEventListener("click", () => showMonthReport(item));
    els.monthlyReportList.append(row);
  });
}

function renderRecoveryReports(recoveryRows) {
  els.recoveryReportList.replaceChildren();

  if (!recoveryRows.length) {
    els.recoveryReportList.append(emptyMessage("Recovery data appears after workouts are saved."));
    return;
  }

  recoveryRows.forEach((row) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `report-item recovery-report-item ${row.status}`;
    item.innerHTML = `
      <div>
        <strong>${escapeHTML(row.group)}</strong>
        <p>${escapeHTML(row.label)} - ${escapeHTML(row.detail)}</p>
      </div>
      <span class="recovery-dot ${row.status}" aria-hidden="true"></span>
      <p class="report-foot">${row.workouts.length} workouts logged for this group</p>
    `;
    item.addEventListener("click", () => showRecoveryReport(row.group));
    els.recoveryReportList.append(item);
  });
}

function showWorkoutReport(rows) {
  const newestFirst = [...rows].sort((a, b) => b.date - a.date);
  const chart = createTrendChart(
    newestFirst.slice().reverse().map((row) => durationMinutes(row.durationMs)),
    newestFirst.slice().reverse().map((row) => row.volume),
    { lineLabel: "min", barLabel: "volume", pointLabels: newestFirst.slice().reverse().map((row) => formatDateShort(row.date)) }
  );
  renderReportDetail("Workout Drilldown", [
    ["Finished workouts", rows.length],
    ["Longest workout", formatDuration(Math.max(0, ...rows.map((row) => row.durationMs)))],
    ["Highest volume", `${Math.round(Math.max(0, ...rows.map((row) => row.volume)))} kg-reps`]
  ], chart, newestFirst.map((row) => `
    <button class="detail-row" type="button" data-workout-id="${escapeHTML(row.workout.id || row.workout.startedAt)}">
      <strong>${escapeHTML(row.workout.name)}</strong>
      <span>${formatDuration(row.durationMs)} - ${row.sets} sets - ${Math.round(row.volume)} volume</span>
    </button>
  `).join(""));

  els.reportDetail.querySelectorAll("[data-workout-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const row = rows.find((item) => (item.workout.id || item.workout.startedAt) === button.dataset.workoutId);
      if (row) showSingleWorkoutReport(row.workout);
    });
  });
}

function showRecoveryOverview(rows = getRecoveryRows()) {
  renderReportDetail("Muscle Recovery", [
    ["Ready", rows.filter((row) => row.status === "ready").length],
    ["48-72h", rows.filter((row) => row.status === "caution").length],
    ["<48h", rows.filter((row) => row.status === "danger").length]
  ], "", rows.map((row) => `
    <button class="detail-row recovery-detail-row ${row.status}" type="button" data-group="${escapeHTML(row.group)}">
      <strong>${escapeHTML(row.group)}</strong>
      <span>${escapeHTML(row.label)} - ${escapeHTML(row.detail)} - ${row.workouts.length} sessions</span>
    </button>
  `).join(""));

  els.reportDetail.querySelectorAll("[data-group]").forEach((button) => {
    button.addEventListener("click", () => showRecoveryReport(button.dataset.group));
  });
}

function showRecoveryReport(group) {
  const recovery = getMuscleGroupRecovery(group);
  const workouts = recovery.workouts;
  renderReportDetail(`${group} Recovery`, [
    ["Status", recovery.label],
    ["Last trained", recovery.lastDate ? formatDateShort(recovery.lastDate) : "None"],
    ["Days since", recovery.daysSince === null ? "No data" : formatChartNumber(recovery.daysSince)]
  ], createTrendChart(
    workouts.slice().reverse().map((workout) => durationMinutes(workout.durationMs)),
    workouts.slice().reverse().map((workout) =>
      (workout.exercises || [])
        .filter((exercise) => getMuscleGroup(exercise) === group)
        .flatMap((exercise) => (exercise.sets || []).filter(Boolean))
        .reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0)
    ),
    { lineLabel: "min", barLabel: "volume", pointLabels: workouts.slice().reverse().map((workout) => formatDateShort(workout.finishedAt || workout.startedAt)) }
  ), workouts.map((workout) => {
    const exercises = (workout.exercises || []).filter((exercise) => getMuscleGroup(exercise) === group);
    const sets = exercises.flatMap((exercise) => (exercise.sets || []).filter(Boolean));
    const volume = sets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);
    return `
      <button class="detail-row" type="button" data-workout-id="${escapeHTML(workout.id || workout.startedAt)}">
        <strong>${escapeHTML(workout.name)}</strong>
        <span>${formatDateShort(workout.finishedAt || workout.startedAt)} - ${exercises.length} exercises - ${sets.length} sets - ${Math.round(volume)} volume</span>
      </button>
    `;
  }).join(""));

  els.reportDetail.querySelectorAll("[data-workout-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const workout = workouts.find((entry) => (entry.id || entry.startedAt) === button.dataset.workoutId);
      if (workout) showSingleWorkoutReport(workout);
    });
  });
}

function showSingleWorkoutReport(workout) {
  const exercises = workout.exercises || [];
  const sets = exercises.flatMap((exercise) => (exercise.sets || []).filter(Boolean).map((set) => ({ exercise, set })));
  const volume = sets.reduce((sum, row) => sum + Number(row.set.weight || 0) * Number(row.set.reps || 0), 0);
  renderReportDetail(escapeHTML(workout.name), [
    ["Duration", formatDuration(Number(workout.durationMs) || 0)],
    ["Sets", sets.length],
    ["Volume", `${Math.round(volume)} kg-reps`]
  ], "", exercises.map((exercise) => {
    const exerciseSets = (exercise.sets || []).filter(Boolean);
    const exerciseVolume = exerciseSets.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);
    return `
      <div class="detail-row">
        <strong>${escapeHTML(exercise.name)}</strong>
        <span>${exerciseSets.map((set) => formatLoggedSet(set, exercise)).join(" | ") || "no sets"} - ${Math.round(exerciseVolume)} volume</span>
      </div>
    `;
  }).join(""));
}

function showGymTimeReport(rows) {
  const byMonth = groupRowsByMonth(rows);
  renderReportDetail("Gym Time", [
    ["Total time", formatDuration(rows.reduce((sum, row) => sum + row.durationMs, 0))],
    ["Average", formatDuration(rows.length ? rows.reduce((sum, row) => sum + row.durationMs, 0) / rows.length : 0)],
    ["Workouts", rows.length]
  ], createTrendChart(
    byMonth.map((row) => durationMinutes(row.durationMs)),
    byMonth.map((row) => row.workouts),
    { lineLabel: "min", barLabel: "workouts", pointLabels: byMonth.map((row) => row.key) }
  ), byMonth.map((row) => `
    <div class="detail-row">
      <strong>${row.key}</strong>
      <span>${formatDuration(row.durationMs)} - ${row.workouts} workouts - average ${formatDuration(row.durationMs / row.workouts)}</span>
    </div>
  `).join(""));
}

function showSetReport(rows) {
  const byExercise = summarizeSetsByExercise(rows);
  renderReportDetail("Set Quality", [
    ["Total sets", rows.length],
    ["Exercises", byExercise.length],
    ["Avg reps", rows.length ? (rows.reduce((sum, row) => sum + Number(row.set.reps || 0), 0) / rows.length).toFixed(1) : "0"]
  ], createTrendChart(
    byExercise.map((row) => row.avgReps),
    byExercise.map((row) => row.sets),
    { lineLabel: "avg reps", barLabel: "sets", pointLabels: byExercise.map((row) => row.name) }
  ), byExercise.map((row) => `
    <div class="detail-row">
      <strong>${escapeHTML(row.name)}</strong>
      <span>${row.sets} sets - avg ${row.avgReps.toFixed(1)} reps - best ${row.bestWeight} kg</span>
    </div>
  `).join(""));
}

function showVolumeReport(rows) {
  const byExercise = summarizeSetsByExercise(rows).sort((a, b) => b.volume - a.volume);
  renderReportDetail("Volume Leaders", [
    ["Total volume", `${Math.round(byExercise.reduce((sum, row) => sum + row.volume, 0))} kg-reps`],
    ["Top exercise", byExercise[0]?.name || "None"],
    ["Exercises", byExercise.length]
  ], createTrendChart(
    byExercise.map((row) => row.bestWeight),
    byExercise.map((row) => row.volume),
    { lineLabel: "best kg", barLabel: "volume", pointLabels: byExercise.map((row) => row.name) }
  ), byExercise.map((row) => `
    <div class="detail-row">
      <strong>${escapeHTML(row.name)}</strong>
      <span>${Math.round(row.volume)} volume - best ${row.bestWeight} kg - ${row.sets} sets</span>
    </div>
  `).join(""));
}

function showExerciseReport(item) {
  const first = item.points[0];
  const last = item.points[item.points.length - 1];
  const strengthDelta = last.strengthScore - first.strengthScore;
  const weightDelta = last.bestWeight - first.bestWeight;
  const volumeDelta = last.volume - first.volume;
  renderReportDetail(item.name, [
    ["Strength", formatSignedNumber(strengthDelta, " kg")],
    ["Best weight", `${item.bestWeight} kg`],
    ["Total volume", `${Math.round(item.totalVolume)} kg-reps`]
  ], createTrendChart(
    item.points.map((point) => point.strengthScore),
    item.points.map((point) => point.volume),
    { lineLabel: "est 1RM", barLabel: "volume", pointLabels: item.points.map((point) => formatDateShort(point.date)) }
  ), `
    <div class="metric-note">
      Trend = estimated 1RM from best set in each workout. Bars = total exercise volume in that workout.
      Best weight change ${formatSignedNumber(weightDelta, " kg")}; volume change ${formatSignedNumber(volumeDelta, " kg-reps")}.
    </div>
    ${item.points.slice().reverse().map((point) => `
      <div class="detail-row">
        <strong>${formatDateShort(point.date)} - ${escapeHTML(point.workoutName)}</strong>
        <span>Best ${point.bestWeight}kg x ${point.bestReps} - est 1RM ${formatChartNumber(point.strengthScore)}kg - volume ${Math.round(point.volume)} - ${point.sets} sets</span>
      </div>
    `).join("")}
  `);
}

function showMonthReport(item) {
  renderReportDetail(item.key, [
    ["Workouts", item.workouts],
    ["Gym time", formatDuration(item.durationMs)],
    ["Volume", `${Math.round(item.volume)} kg-reps`]
  ], createTrendChart(
    item.workoutsList.map((workout) => durationMinutes(workout.durationMs)),
    item.workoutsList.map((workout) =>
      (workout.exercises || []).flatMap((exercise) => (exercise.sets || []).filter(Boolean))
        .reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0)
    ),
    { lineLabel: "min", barLabel: "volume", pointLabels: item.workoutsList.map((workout) => formatDateShort(workout.finishedAt || workout.startedAt)) }
  ), item.workoutsList.map((workout) => {
    const sets = (workout.exercises || []).flatMap((exercise) => (exercise.sets || []).filter(Boolean));
    return `
      <button class="detail-row" type="button" data-workout-id="${escapeHTML(workout.id || workout.startedAt)}">
        <strong>${escapeHTML(workout.name)}</strong>
        <span>${formatDuration(Number(workout.durationMs) || 0)} - ${sets.length} sets</span>
      </button>
    `;
  }).join(""));

  els.reportDetail.querySelectorAll("[data-workout-id]").forEach((button) => {
    button.addEventListener("click", () => {
      const workout = item.workoutsList.find((entry) => (entry.id || entry.startedAt) === button.dataset.workoutId);
      if (workout) showSingleWorkoutReport(workout);
    });
  });
}

function renderReportDetail(title, kpis, chart, body) {
  els.reportDetail.dataset.activeReport = title;
  els.reportDetail.innerHTML = `
    <div class="report-detail-head">
      <div>
        <p class="label">Selected report</p>
        <h3>${escapeHTML(title)}</h3>
      </div>
    </div>
    <div class="mini-stats">
      ${kpis.map(([label, value]) => `<div><span>${escapeHTML(label)}</span><strong>${escapeHTML(String(value))}</strong></div>`).join("")}
    </div>
    ${chart}
    <div class="detail-list">${body || `<p class="empty">No data yet.</p>`}</div>
  `;
}

function groupRowsByMonth(rows) {
  const byMonth = new Map();
  rows.forEach((row) => {
    const key = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(row.date);
    const item = byMonth.get(key) || {
      key,
      monthDate: new Date(row.date.getFullYear(), row.date.getMonth(), 1),
      durationMs: 0,
      workouts: 0
    };
    item.durationMs += row.durationMs;
    item.workouts += 1;
    byMonth.set(key, item);
  });
  return [...byMonth.values()].sort((a, b) => a.monthDate - b.monthDate);
}

function summarizeSetsByExercise(rows) {
  const byExercise = new Map();
  rows.forEach((row) => {
    const name = row.exercise.name;
    const item = byExercise.get(name) || { name, sets: 0, reps: 0, volume: 0, bestWeight: 0, avgReps: 0 };
    const weight = Number(row.set.weight) || 0;
    const reps = Number(row.set.reps) || 0;
    item.sets += 1;
    item.reps += reps;
    item.volume += weight * reps;
    item.bestWeight = Math.max(item.bestWeight, weight);
    item.avgReps = item.reps / item.sets;
    byExercise.set(name, item);
  });
  return [...byExercise.values()].sort((a, b) => b.sets - a.sets);
}

function createTrendChart(lineValues, barValues, options = {}) {
  const width = 280;
  const height = 150;
  const pad = 20;
  const topPad = 28;
  const barBase = height - 24;
  const values = lineValues.length ? lineValues : [0];
  const bars = barValues.length ? barValues : [0];
  const maxLine = Math.max(...values, 1);
  const minLine = Math.min(...values);
  const lineRange = Math.max(maxLine - minLine, 1);
  const maxBar = Math.max(...bars, 1);
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const points = values.map((value, index) => {
    const x = values.length > 1 ? pad + index * step : width / 2;
    const y = topPad + (1 - (value - minLine) / lineRange) * 58;
    return `${x},${y}`;
  }).join(" ");
  const barSlot = (width - pad * 2) / Math.max(bars.length, 1);
  const barWidth = Math.max(8, Math.min(22, barSlot - 5));
  const barSvg = bars.map((value, index) => {
    const x = pad + index * barSlot + (barSlot - barWidth) / 2;
    const h = Math.max(3, (value / maxBar) * 42);
    const y = barBase - h;
    const fill = index % 2 ? "#ef5b61" : "#8fd19a";
    const title = options.pointLabels?.[index] || `Point ${index + 1}`;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="2" fill="${fill}"><title>${escapeHTML(title)}: ${formatChartNumber(value)} ${escapeHTML(options.barLabel || "")}</title></rect>`;
  }).join("");
  const pointSvg = values.map((value, index) => {
    const x = values.length > 1 ? pad + index * step : width / 2;
    const y = topPad + (1 - (value - minLine) / lineRange) * 58;
    return `<circle cx="${x}" cy="${y}" r="3" fill="#fde68a"><title>${escapeHTML(options.pointLabels?.[index] || `Point ${index + 1}`)}: ${formatChartNumber(value)} ${escapeHTML(options.lineLabel || "")}</title></circle>`;
  }).join("");
  return `
    <svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend chart">
      <text x="${pad}" y="15" fill="#e5e7eb" font-size="10">${escapeHTML(options.lineLabel || "trend")}: ${formatChartNumber(values[0])} to ${formatChartNumber(values[values.length - 1])}</text>
      <text x="${width - pad}" y="15" text-anchor="end" fill="#9ca3af" font-size="10">max ${formatChartNumber(maxLine)} / ${escapeHTML(options.barLabel || "bars")} ${formatChartNumber(maxBar)}</text>
      ${barSvg}
      <line x1="${pad}" y1="${barBase}" x2="${width - pad}" y2="${barBase}" stroke="#94a3b8" stroke-width="2"></line>
      <text x="${pad}" y="${barBase + 14}" fill="#cbd5e1" font-size="9">${escapeHTML(options.pointLabels?.[0] || "first")}</text>
      <text x="${width - pad}" y="${barBase + 14}" text-anchor="end" fill="#cbd5e1" font-size="9">${escapeHTML(options.pointLabels?.[options.pointLabels.length - 1] || "last")}</text>
      <polyline points="${points}" fill="none" stroke="#f59e0b" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"></polyline>
      <polyline points="${points}" fill="none" stroke="#fbbf24" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"></polyline>
      ${pointSvg}
    </svg>
  `;
}

function formatSignedNumber(value, suffix = "") {
  if (value > 0) return `+${formatChartNumber(value)}${suffix}`;
  if (value < 0) return `${formatChartNumber(value)}${suffix}`;
  return `0${suffix}`;
}

function estimateOneRepMax(weight, reps) {
  const numericWeight = Number(weight) || 0;
  const numericReps = Number(reps) || 0;
  if (numericWeight <= 0 || numericReps <= 0) return 0;
  return numericWeight * (1 + numericReps / 30);
}

function durationMinutes(ms) {
  return Number(((Number(ms) || 0) / 60000).toFixed(1));
}

function formatChartNumber(value) {
  const numeric = Number(value) || 0;
  if (Math.abs(numeric) >= 100) return String(Math.round(numeric));
  return Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(1);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getWorkoutElapsedMs() {
  const timerState = state.workoutTimer || { running: false, startedAt: null, elapsedMs: 0 };
  const savedElapsed = Number(timerState.elapsedMs) || 0;

  if (!timerState.running || !timerState.startedAt) {
    return savedElapsed;
  }

  return savedElapsed + (Date.now() - new Date(timerState.startedAt).getTime());
}

function renderWorkoutTimer() {
  const elapsedMs = getWorkoutElapsedMs();
  const loggedSets = state.exercises.reduce((sum, exercise) => sum + (exercise.sets || []).filter(Boolean).length, 0);
  const volume = state.exercises.reduce((sum, exercise) =>
    sum + (exercise.sets || []).filter(Boolean)
      .reduce((setSum, set) => setSum + Number(set.weight || 0) * Number(set.reps || 0), 0), 0);
  els.workoutTimerReadout.textContent = formatDuration(elapsedMs);
  els.workoutTimerSubtitle.textContent = state.workoutTimer?.running
    ? `${loggedSets} sets - ${Math.round(volume)} kg-reps`
    : elapsedMs > 0
      ? `Paused - ${loggedSets} sets`
      : "Start when training begins";
  els.workoutTimerToggleBtn.textContent = state.workoutTimer?.running ? "Stop workout" : "Start workout";
}

function startWorkoutTimer() {
  if (state.workoutTimer?.running) return;

  state.workoutTimer = {
    running: true,
    startedAt: new Date().toISOString(),
    elapsedMs: getWorkoutElapsedMs()
  };
  saveState();
  syncWorkoutTimerInterval();
  renderWorkoutTimer();
}

function stopWorkoutTimer() {
  const elapsedMs = getWorkoutElapsedMs();
  state.workoutTimer = {
    running: false,
    startedAt: null,
    elapsedMs
  };
  saveState();
  syncWorkoutTimerInterval();
  renderWorkoutTimer();
}

function completeWorkoutTimer() {
  if (state.workoutComplete) return;

  if (state.workoutTimer?.running) {
    const elapsedMs = getWorkoutElapsedMs();
    state.workoutTimer = {
      running: false,
      startedAt: null,
      elapsedMs
    };
    syncWorkoutTimerInterval();
  }

  state.workoutComplete = true;
}

function resetWorkoutTimer() {
  state.workoutTimer = {
    running: false,
    startedAt: null,
    elapsedMs: 0
  };
  saveState();
  syncWorkoutTimerInterval();
  renderWorkoutTimer();
}

function syncWorkoutTimerInterval() {
  if (workoutTimerIntervalId) {
    window.clearInterval(workoutTimerIntervalId);
    workoutTimerIntervalId = null;
  }

  if (state.workoutTimer?.running) {
    workoutTimerIntervalId = window.setInterval(renderWorkoutTimer, 1000);
  }
}

function renderTimer() {
  els.timerReadout.textContent = formatSeconds(timer.remaining);
  els.timerSubtitle.textContent = timer.exerciseName
    ? `${timer.exerciseName} rest - ${formatSeconds(timer.total)} target`
    : `Rest default is ${formatSeconds(state.defaultRest)}`;
  els.timerToggleBtn.querySelector("span").textContent = timer.intervalId ? "II" : ">";
}

function emptyMessage(text) {
  const node = document.createElement("div");
  node.className = "empty";
  node.textContent = text;
  return node;
}

function startTimer(seconds, exerciseName = "") {
  primeAudio();
  stopTimer();
  timer.total = seconds || state.defaultRest;
  timer.remaining = seconds || state.defaultRest;
  timer.exerciseName = exerciseName;
  timer.intervalId = window.setInterval(() => {
    timer.remaining -= 1;
    if (timer.remaining <= 0) {
      stopTimer();
      timer.remaining = 0;
      playTimerTone();
      vibrate();
    }
    renderTimer();
  }, 1000);
  renderTimer();
}

function primeAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ||= new AudioContextClass();
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  if (!audioPrimed) {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.03);
    audioPrimed = true;
  }
}

function playTimerTone() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  audioContext ||= new AudioContextClass();
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  const now = audioContext.currentTime;
  [0, 0.18, 0.36].forEach((offset) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now + offset);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.13);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.14);
  });
}

function stopTimer() {
  if (timer.intervalId) {
    window.clearInterval(timer.intervalId);
    timer.intervalId = null;
  }
}

function vibrate() {
  if ("vibrate" in navigator) {
    navigator.vibrate([200, 120, 200]);
  }
}

function hasLoggedSets() {
  return state.exercises.some((exercise) => (exercise.sets || []).filter(Boolean).length);
}

function hasWorkoutActivity() {
  return hasLoggedSets() || getWorkoutElapsedMs() > 0;
}

function finishWorkout() {
  if (!hasWorkoutActivity()) {
    alert("Start the workout timer or log at least one set before ending the workout.");
    return;
  }

  const durationMs = getWorkoutElapsedMs();
  completeWorkoutTimer();
  state.history.unshift({
    id: makeId(),
    planId: state.activePlanId,
    name: state.workoutName,
    startedAt: state.startedAt,
    finishedAt: new Date().toISOString(),
    durationMs,
    exercises: structuredClone(state.exercises)
  });

  startNewWorkout(false);
  state.activeView = "history";
  saveState();
  render();
}

function startNewWorkout(confirmDiscard = true) {
  if (confirmDiscard && hasLoggedSets()) {
    const shouldContinue = confirm("Start a new workout without saving the current one to history?");
    if (!shouldContinue) return;
  }

  persistCurrentPlanTemplate();
  stopTimer();
  resetWorkoutTimer();
  state = {
    ...state,
    startedAt: new Date().toISOString(),
    workoutName: generateWorkoutName(new Date().toISOString(), state.activePlanId),
    workoutComplete: false,
    activeExerciseId: null,
    exercises: createExercisesFromTemplate(state.activePlanId, state.defaultRest)
  };
  timer.remaining = state.defaultRest;
  timer.total = state.defaultRest;
  timer.exerciseName = "";
  saveState();
  render();
}

function loadWorkoutPlan(planId) {
  if (hasLoggedSets()) {
    const shouldContinue = confirm("Switch plans and clear the current unsaved sets?");
    if (!shouldContinue) {
      render();
      return;
    }
  }

  persistCurrentPlanTemplate();
  stopTimer();
  resetWorkoutTimer();
  state = {
    ...state,
    activePlanId: planId,
    startedAt: new Date().toISOString(),
    workoutName: generateWorkoutName(new Date().toISOString(), planId),
    workoutComplete: false,
    activeExerciseId: null,
    exercises: createExercisesFromTemplate(planId, state.defaultRest)
  };
  timer.remaining = state.defaultRest;
  timer.total = state.defaultRest;
  timer.exerciseName = "";
  saveState();
  render();
}

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.activeView = tab.dataset.view;
    saveState();
    render();
  });
});

els.refreshReportsBtn.addEventListener("click", renderReports);

els.workoutPlanSelect.addEventListener("change", (event) => {
  loadWorkoutPlan(event.target.value);
});

els.editModeBtn.addEventListener("click", () => {
  state.editMode = !state.editMode;
  saveState();
  renderPreservingScroll();
});

els.newWorkoutBtn.addEventListener("click", () => startNewWorkout());
els.finishWorkoutBtn.addEventListener("click", finishWorkout);

els.workoutTimerToggleBtn.addEventListener("click", () => {
  primeAudio();
  if (state.workoutTimer?.running) {
    stopWorkoutTimer();
  } else {
    startWorkoutTimer();
  }
});

els.workoutTimerResetBtn.addEventListener("click", resetWorkoutTimer);

els.timerToggleBtn.addEventListener("click", () => {
  primeAudio();
  if (timer.intervalId) {
    stopTimer();
  } else {
    startTimer(timer.remaining || state.defaultRest, timer.exerciseName);
  }
  renderTimer();
});

els.timerResetBtn.addEventListener("click", () => {
  stopTimer();
  timer.total = state.defaultRest;
  timer.remaining = state.defaultRest;
  renderTimer();
});

els.addExerciseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = els.exerciseNameInput.value.trim();
  if (!name) return;
  const metricType = inferMetricTypeFromName(name);

  const exercise = {
    id: makeId(),
    name,
    group: metricType === "cardio" ? "Cardio" : metricType === "reps" ? "Core" : "Custom",
    metricType,
    targetSets: metricType === "cardio" ? 1 : SETS_PER_EXERCISE,
    targetReps: metricType === "cardio" ? "" : "10-12",
    targetWeight: null,
    rest: state.defaultRest,
    comment: buildExerciseComment({ name, group: metricType === "cardio" ? "Cardio" : metricType === "reps" ? "Core" : "Custom", metricType, targetReps: "10-12", rest: state.defaultRest }, 0),
    collapsed: false,
    sets: createEmptySets(metricType === "cardio" ? 1 : SETS_PER_EXERCISE)
  };
  state.exercises.push(exercise);
  els.exerciseNameInput.value = "";
  saveState();
  renderPreservingScroll();
});

function inferMetricTypeFromName(name) {
  return getExerciseMetricType({ name });
}

els.restDefaultSelect.addEventListener("change", (event) => {
  state.defaultRest = Number(event.target.value) || DEFAULT_REST_SECONDS;
  state.exercises.forEach((exercise) => {
    exercise.rest = state.defaultRest;
  });
  persistCurrentPlanTemplate();
  timer.total = state.defaultRest;
  if (!timer.intervalId) {
    timer.remaining = state.defaultRest;
  }
  saveState();
  render();
});

els.exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `gym-log-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

els.importInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    state = { ...defaultState, ...imported };
    saveState();
    render();
  } catch {
    alert("That backup file could not be imported.");
  } finally {
    event.target.value = "";
  }
});

els.clearDataBtn.addEventListener("click", () => {
  if (!confirm("Clear all local data on this device/browser? This removes the current workout, workout history, reports data, remembered weights/reps, custom exercises, edit settings, and timer state.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(defaultState);
  stopTimer();
  resetWorkoutTimer();
  timer.total = state.defaultRest;
  timer.remaining = state.defaultRest;
  render();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

window.addEventListener("beforeunload", saveState);

render();
syncWorkoutTimerInterval();
