let isActive = false;
let startTime;
let timerInterval;
let activities = [];

const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const activityForm = document.getElementById("activity-form");
const timerDisplay = document.getElementById("timer");
const currentActivityDisplay = document.getElementById("current-activity");
const activitiesTable = document
  .getElementById("activities-table")
  .getElementsByTagName("tbody")[0];
const exportBtn = document.getElementById("export-btn");
const importInput = document.getElementById("import-input");

function startTimer() {
  isActive = true;
  startTime = Date.now() - (startTime ? startTime : 0);
  timerInterval = setInterval(updateTimer, 1000);
  startBtn.style.display = "none";
  stopBtn.style.display = "inline-block";
  currentActivityDisplay.textContent = "Activity in progress";
}

function stopTimer() {
  isActive = false;
  clearInterval(timerInterval);
  stopBtn.style.display = "none";
  activityForm.style.display = "block";
  currentActivityDisplay.textContent = "No activity in progress";
}

function updateTimer() {
  const elapsedTime = Date.now() - startTime;
  timerDisplay.textContent = formatTime(elapsedTime);
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((v) => (v < 10 ? "0" + v : v))
    .join(":");
}

function logActivity(event) {
  event.preventDefault();
  const newActivity = {
    date: new Date().toLocaleString(),
    activity: event.target.activity.value,
    duration: timerDisplay.textContent,
    category: event.target.category.value,
    details: event.target.details.value,
  };
  activities.push(newActivity);
  saveActivities();
  renderActivities();
  activityForm.style.display = "none";
  startBtn.style.display = "inline-block";
  timerDisplay.textContent = "00:00:00";
  event.target.reset();
}

function renderActivities() {
  activitiesTable.innerHTML = "";
  activities.forEach((activity) => {
    const row = activitiesTable.insertRow();
    Object.values(activity).forEach((value) => {
      const cell = row.insertCell();
      cell.textContent = value;
    });
  });
}

function saveActivities() {
  localStorage.setItem("activities", JSON.stringify(activities));
}

function loadActivities() {
  const savedActivities = localStorage.getItem("activities");
  if (savedActivities) {
    activities = JSON.parse(savedActivities);
    renderActivities();
  }
}

function exportActivities() {
  const dataStr = JSON.stringify(activities);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileDefaultName = "activities.json";
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
}

function importActivities(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    activities = JSON.parse(content);
    saveActivities();
    renderActivities();
  };
  reader.readAsText(file);
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
activityForm.addEventListener("submit", logActivity);
exportBtn.addEventListener("click", exportActivities);
importInput.addEventListener("change", importActivities);

loadActivities();
