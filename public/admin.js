(function () {
  "use strict";
  var rows = document.getElementById("rows");
  var count = document.getElementById("count");

  function render(events) {
    rows.innerHTML = "";
    count.textContent = events.length + " event(s) recorded";
    if (!events.length) {
      var tr = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = 2; td.className = "empty"; td.textContent = "No activity yet.";
      tr.appendChild(td); rows.appendChild(tr);
      return;
    }
    events.slice().reverse().forEach(function (ev) {
      var tr = document.createElement("tr");
      var a = document.createElement("td");
      a.textContent = ev.event; a.className = ev.event;
      var b = document.createElement("td");
      var d = new Date(ev.timestamp);
      b.textContent = d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " +
        d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      tr.appendChild(a); tr.appendChild(b); rows.appendChild(tr);
    });
  }

  function load() {
    fetch("/api/events").then(function (r) { return r.json(); }).then(render).catch(function () {
      count.textContent = "Could not load events. Is the server running?";
    });
  }

  document.getElementById("refresh").addEventListener("click", load);
  load();
  setInterval(load, 5000);
})();
