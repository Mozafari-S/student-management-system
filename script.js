const STORAGE_KEY = "students-v1";

const form = document.getElementById("studentForm");
const listEl = document.getElementById("studentList");
const emptyMsg = document.getElementById("emptyMsg");
const searchEl = document.getElementById("search");
const errorEl = document.getElementById("formError");

let students = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  } catch (e) {
    errorEl.textContent = "Could not save data in this browser.";
  }
}

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + m + "-" + day;
}

document.getElementById("todayLabel").textContent =
  new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

function attendancePercent(s) {
  const days = Object.values(s.attendance);
  if (days.length === 0) return null;
  const present = days.filter(Boolean).length;
  return Math.round((present / days.length) * 100);
}

function render() {
  const today = todayKey();
  const q = searchEl.value.trim().toLowerCase();

  const visible = students.filter(s =>
    (s.name + " " + s.roll + " " + s.className).toLowerCase().includes(q)
  );

  listEl.innerHTML = "";
  visible.forEach(s => {
    const li = document.createElement("li");
    li.className = "student";

    const info = document.createElement("div");
    const h3 = document.createElement("h3");
    h3.textContent = s.name;
    const meta = document.createElement("p");
    const pct = attendancePercent(s);
    const parts = ["Roll " + s.roll, "Class " + s.className];
    if (s.marks !== null) parts.push("Marks " + s.marks + "%");
    parts.push(pct === null ? "No attendance yet" : "Attendance " + pct + "%");
    meta.textContent = parts.join(", ");
    info.append(h3, meta);

    const actions = document.createElement("div");
    actions.className = "actions";

    const isPresent = s.attendance[today] === true;
    const isAbsent = s.attendance[today] === false;

    const presentBtn = document.createElement("button");
    presentBtn.textContent = "Present";
    presentBtn.className = isPresent ? "present" : "";
    presentBtn.setAttribute("aria-pressed", isPresent);
    presentBtn.onclick = () => mark(s.id, true);

    const absentBtn = document.createElement("button");
    absentBtn.textContent = "Absent";
    absentBtn.className = isAbsent ? "present" : "";
    absentBtn.setAttribute("aria-pressed", isAbsent);
    absentBtn.onclick = () => mark(s.id, false);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.className = "delete";
    delBtn.onclick = () => remove(s.id, s.name);

    actions.append(presentBtn, absentBtn, delBtn);
    li.append(info, actions);
    listEl.appendChild(li);
  });

  emptyMsg.style.display = visible.length ? "none" : "block";
  emptyMsg.textContent = students.length
    ? "No students match your search."
    : "No students yet. Add your first student above.";

  document.getElementById("statTotal").textContent = students.length;
  document.getElementById("statPresent").textContent =
    students.filter(s => s.attendance[today] === true).length;
  document.getElementById("statAbsent").textContent =
    students.filter(s => s.attendance[today] === false).length;
}

function mark(id, value) {
  const s = students.find(x => x.id === id);
  if (!s) return;
  const key = todayKey();
  // Clicking the same button again clears today's mark
  if (s.attendance[key] === value) delete s.attendance[key];
  else s.attendance[key] = value;
  save();
  render();
}

function remove(id, name) {
  if (!confirm("Delete " + name + "?")) return;
  students = students.filter(s => s.id !== id);
  save();
  render();
}

form.addEventListener("submit", e => {
  e.preventDefault();
  errorEl.textContent = "";

  const name = document.getElementById("name").value.trim();
  const roll = document.getElementById("roll").value.trim();
  const className = document.getElementById("className").value.trim();
  const marksRaw = document.getElementById("marks").value;

  if (!name || !roll || !className) {
    errorEl.textContent = "Name, roll number and class are required.";
    return;
  }
  if (students.some(s => s.roll.toLowerCase() === roll.toLowerCase() &&
                         s.className.toLowerCase() === className.toLowerCase())) {
    errorEl.textContent = "A student with this roll number already exists in that class.";
    return;
  }

  students.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    roll,
    className,
    marks: marksRaw === "" ? null : Math.min(100, Math.max(0, Number(marksRaw))),
    attendance: {}
  });

  save();
  form.reset();
  render();
});

searchEl.addEventListener("input", render);
render();
