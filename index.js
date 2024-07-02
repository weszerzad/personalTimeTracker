// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDvVFDLXHvEAOHJDMS7Mx7Fy9E698FVtI0",
  authDomain: "personal-time-tracker-d43ff.firebaseapp.com",
  projectId: "personal-time-tracker-d43ff",
  storageBucket: "personal-time-tracker-d43ff.appspot.com",
  messagingSenderId: "110369726343",
  appId: "1:110369726343:web:769854084c73ff27c67d22",
  measurementId: "G-66TVT5LGWP",
  databaseURL:
    "https://personal-time-tracker-d43ff-default-rtdb.asia-southeast1.firebasedatabase.app/",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// // Get a reference to the database service
const database = getDatabase(app);

let isActive = false;
let startTime;
let timerInterval;
let activities = [];

let editingActivityId = null;

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

async function logActivity(event) {
  event.preventDefault();
  const newActivity = {
    date: new Date().toLocaleString(),
    activity: event.target.activity.value,
    duration: timerDisplay.textContent,
    category: event.target.category.value,
    details: event.target.details.value,
  };
  if (editingActivityId) {
    await updateActivity(event);
  } else {
    const activityId = await saveActivity(newActivity);
    if (activityId) {
      newActivity.id = activityId;
      activities.push(newActivity);
      activityForm.style.display = "none";
      startBtn.style.display = "inline-block";
      timerDisplay.textContent = "00:00:00";
      event.target.reset();
    }
  }
  resetForm();
  renderActivities();
}

function reorderActivityObject(activity) {
  const {
    date,
    activity: activityName,
    duration,
    category,
    details,
  } = activity;
  return {
    date,
    activity: activityName,
    duration,
    category,
    details,
  };
}

function renderActivities() {
  activitiesTable.innerHTML = "";
  activities.forEach((activity) => {
    console.log(activity);
    const reorderedActivity = reorderActivityObject(activity);
    const row = activitiesTable.insertRow();
    Object.values(reorderedActivity).forEach((value) => {
      const cell = row.insertCell();
      cell.textContent = value;
    });

    // Add Actions cell with both Edit and Delete buttons
    const actionsCell = row.insertCell();

    // Create Edit button
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.onclick = () => editActivity(activity.id);
    editButton.className = "btn btn-edit"; // Add classes for styling

    // Create Delete button
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = () => deleteActivity(activity.id);
    deleteButton.className = "btn btn-delete"; // Add classes for styling

    // Append both buttons to the Actions cell
    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    // // Add edit button
    // const editCell = row.insertCell();
    // const editButton = document.createElement('button');
    // editButton.textContent = 'Edit';
    // editButton.onclick = () => editActivity(activity.id);
    // editCell.appendChild(editButton);

    // // Add delete button
    // const deleteCell = row.insertCell();
    // const deleteButton = document.createElement("button");
    // deleteButton.textContent = "Delete";
    // deleteButton.onclick = () => deleteActivity(activity.id);
    // deleteCell.appendChild(deleteButton);
  });
}

function editActivity(activityId) {
  const activity = activities.find((a) => a.id === activityId);
  if (activity) {
    editingActivityId = activityId;
    document.getElementById("activity").value = activity.activity;
    document.getElementById("category").value = activity.category;
    document.getElementById("details").value = activity.details;

    // Change form submit button text
    const submitButton = activityForm.querySelector('button[type="submit"]');
    submitButton.textContent = "Update Activity";

    activityForm.style.display = "block";
    startBtn.style.display = "none";
    stopBtn.style.display = "none";
    timerDisplay.textContent = activity.duration;
  }
}

async function updateActivity(event) {
  event.preventDefault();
  const updatedActivity = {
    date: new Date().toLocaleString(),
    activity: event.target.activity.value,
    duration: timerDisplay.textContent,
    category: event.target.category.value,
    details: event.target.details.value,
  };

  const db = getDatabase();
  const activityRef = ref(db, `activities/${editingActivityId}`);

  try {
    await update(activityRef, updatedActivity);
    console.log("Activity updated successfully");

    // Update local array
    const index = activities.findIndex((a) => a.id === editingActivityId);
    if (index !== -1) {
      activities[index] = { ...updatedActivity, id: editingActivityId };
    }

    renderActivities();
    resetForm();
  } catch (error) {
    console.error("Error updating activity: ", error);
  }
}

function resetForm() {
  editingActivityId = null;
  activityForm.reset();
  const submitButton = activityForm.querySelector('button[type="submit"]');
  submitButton.textContent = "Log Activity";
  activityForm.style.display = "none";
  startBtn.style.display = "inline-block";
  timerDisplay.textContent = "00:00:00";
}

function saveActivity(activity) {
  const activitiesRef = ref(database, "activities");
  const newActivityRef = push(activitiesRef);

  return set(newActivityRef, activity)
    .then(() => {
      console.log("Activity saved successfully", activity);
      return newActivityRef.key;
    })
    .catch((error) => {
      console.error("Error saving activity: ", error);
      return null;
    });
}

function loadActivities() {
  const activitiesRef = ref(database, "activities");
  onValue(activitiesRef, (snapshot) => {
    activities = [];
    snapshot.forEach((childSnapshot) => {
      const activity = childSnapshot.val();
      activity.id = childSnapshot.key; // Save the Firebase key as id
      activities.push(activity);
    });
    renderActivities();
  });
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
  if (!file) {
    alert("No file selected");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const content = e.target.result;
      const importedActivities = JSON.parse(content);

      if (!Array.isArray(importedActivities)) {
        throw new Error(
          "Invalid file format. Expected an array of activities."
        );
      }

      let importedCount = 0;
      importedActivities.forEach((activity) => {
        if (isValidActivity(activity)) {
          saveActivity(activity);
          importedCount++;
        } else {
          console.warn("Skipped invalid activity:", activity);
        }
      });

      alert(`Successfully imported ${importedCount} activities.`);
    } catch (error) {
      console.error("Error importing activities:", error);
      alert("Error importing activities: " + error.message);
    }
  };

  reader.onerror = function (error) {
    console.error("Error reading file:", error);
    alert("Error reading file. Please try again.");
  };

  reader.readAsText(file);
}

function isValidActivity(activity) {
  return (
    typeof activity === "object" &&
    activity !== null &&
    "date" in activity &&
    "activity" in activity &&
    "duration" in activity &&
    "category" in activity
  );
}

function deleteActivity(activityId) {
  const activityRef = ref(database, `activities/${activityId}`);

  remove(activityRef)
    .then(() => {
      console.log("Activity deleted successfully", activityId);
      // Remove the activity from the local array
      activities = activities.filter((activity) => activity.id !== activityId);
      renderActivities(); // Re-render the activities table
    })
    .catch((error) => {
      console.error("Error deleting activity: ", error);
    });
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
activityForm.addEventListener("submit", logActivity);
exportBtn.addEventListener("click", exportActivities);
importInput.addEventListener("change", importActivities);

loadActivities();
