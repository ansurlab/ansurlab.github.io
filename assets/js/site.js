"use strict";

// Navigation works with mouse, keyboard, and touch.
const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("#main-navigation");
const groups = [...document.querySelectorAll(".nav-group")];
function closeGroups(except) {
  groups.forEach((group) => {
    if (group === except) return;
    group.classList.remove("open");
    group.querySelector("button").setAttribute("aria-expanded", "false");
  });
}
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open navigation");
  nav.classList.remove("is-open");
  closeGroups();
}
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  nav.classList.toggle("is-open", open);
  if (!open) closeGroups();
});
groups.forEach((group) => {
  const button = group.querySelector("button");
  button.addEventListener("click", () => {
    const open = !group.classList.contains("open");
    closeGroups(group);
    group.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
  });
  group.addEventListener("focusout", (event) => {
    if (!group.contains(event.relatedTarget)) {
      group.classList.remove("open");
      button.setAttribute("aria-expanded", "false");
    }
  });
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".nav-group")) closeGroups();
  if (!event.target.closest(".site-header")) closeMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const active = groups.find((group) => group.classList.contains("open"));
    if (active) {
      closeGroups();
      active.querySelector("button").focus();
    } else if (nav.classList.contains("is-open")) {
      closeMenu();
      menu.focus();
    }
  }
});
window.matchMedia("(min-width: 1281px)").addEventListener("change", closeMenu);

// Only the home hero plays automatically. Research videos use native controls.
const heroVideo = document.querySelector("#hero-video");
const videoToggle = document.querySelector(".video-toggle");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if (heroVideo && videoToggle) {
  function updateVideoButton() {
    videoToggle.textContent = heroVideo.paused ? "▶" : "Ⅱ";
    videoToggle.setAttribute(
      "aria-label",
      heroVideo.paused ? "Play research video" : "Pause research video",
    );
  }
  if (reducedMotion.matches) {
    heroVideo.removeAttribute("autoplay");
    heroVideo.pause();
  }
  heroVideo.addEventListener("play", updateVideoButton);
  heroVideo.addEventListener("pause", updateVideoButton);
  videoToggle.addEventListener("click", () => {
    if (heroVideo.paused) heroVideo.play().catch(updateVideoButton);
    else heroVideo.pause();
  });
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) heroVideo.pause();
  });
  updateVideoButton();
}

// Search the complete bibliography without a server or API.
const search = document.querySelector("#publication-search");
const year = document.querySelector("#publication-year");
if (search && year) {
  const entries = [...document.querySelectorAll(".publication-entry")];
  const corpus = entries.map((entry) => entry.textContent.toLocaleLowerCase());
  const venueButtons = [...document.querySelectorAll(".venue-option")];
  const selectedVenues = new Set();
  function filterPublications() {
    const terms = search.value
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    let count = 0;
    const available = new Map();
    let availableTotal = 0;
    entries.forEach((entry, index) => {
      const matchesSearch =
        (!year.value || entry.dataset.year === year.value) &&
        terms.every((term) => corpus[index].includes(term));
      if (matchesSearch) {
        availableTotal++;
        available.set(
          entry.dataset.venue,
          (available.get(entry.dataset.venue) || 0) + 1,
        );
      }
      const visible =
        matchesSearch &&
        (!selectedVenues.size || selectedVenues.has(entry.dataset.venue));
      entry.hidden = !visible;
      if (visible) count++;
    });
    document.querySelector("#result-count").textContent = String(count);
    document.querySelector("#no-results").hidden = count !== 0;
    venueButtons.forEach((button) => {
      const venue = button.dataset.venue;
      button.setAttribute(
        "aria-pressed",
        String(venue ? selectedVenues.has(venue) : !selectedVenues.size),
      );
      button.querySelector(".venue-count").textContent = String(
        venue ? available.get(venue) || 0 : availableTotal,
      );
    });
    document.querySelector("#reset-filters").hidden =
      !terms.length && !year.value && !selectedVenues.size;
    document.querySelector("#filter-description").textContent =
      selectedVenues.size ? " · " + [...selectedVenues].join(" + ") : "";
  }
  search.addEventListener("input", filterPublications);
  year.addEventListener("change", filterPublications);
  venueButtons.forEach((button) =>
    button.addEventListener("click", () => {
      const venue = button.dataset.venue;
      if (!venue) selectedVenues.clear();
      else if (selectedVenues.has(venue)) selectedVenues.delete(venue);
      else selectedVenues.add(venue);
      filterPublications();
    }),
  );
  function resetFilters() {
    search.value = "";
    year.value = "";
    selectedVenues.clear();
    filterPublications();
  }
  document.querySelector("#reset-filters").addEventListener("click", () => {
    resetFilters();
    search.focus();
  });
  document.querySelector("#clear-filters").addEventListener("click", () => {
    resetFilters();
    search.focus();
  });
}

// Copy the complete original citation, including the venue and bibliographic details.
let citationNoticeTimer;
document.querySelectorAll(".copy-citation").forEach((button) => {
  button.addEventListener("click", async () => {
    const status = document.querySelector(".citation-status");
    clearTimeout(citationNoticeTimer);
    try {
      await navigator.clipboard.writeText(button.dataset.copyCitation);
      status.textContent = "Citation copied to clipboard.";
    } catch (_) {
      button.closest(".paper-content").querySelector("details").open = true;
      status.textContent = "Select and copy the full citation below.";
    }
    citationNoticeTimer = setTimeout(() => {
      status.textContent = "";
    }, 4000);
  });
});

// Click-to-load embeds keep pages light and avoid unnecessary YouTube requests.
document.querySelectorAll(".youtube-play").forEach((button) => {
  button.addEventListener("click", () => {
    const wrapper = button.closest(".youtube");
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(wrapper.dataset.youtube)}?autoplay=1&rel=0`;
    iframe.title = button.getAttribute("aria-label").replace(/^Play /, "");
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    button.replaceWith(iframe);
    iframe.focus();
  });
});

// Preserve the original photographs and award scans in a keyboard-safe viewer.
const lightbox = document.querySelector(".lightbox");
let lastImageTrigger;
document.querySelectorAll("[data-zoom]").forEach((button) => {
  button.addEventListener("click", () => {
    lastImageTrigger = button;
    const original = button.querySelector("img");
    const enlarged = lightbox.querySelector("img");
    enlarged.src = button.dataset.zoom;
    enlarged.alt = original.alt;
    lightbox.querySelector("p").textContent = original.alt;
    lightbox.showModal();
    document.documentElement.style.overflow = "hidden";
  });
});
lightbox
  .querySelector("button")
  .addEventListener("click", () => lightbox.close());
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox.addEventListener("close", () => {
  document.documentElement.style.overflow = "";
  if (lastImageTrigger) lastImageTrigger.focus();
});

document.querySelectorAll(".copy-email").forEach((button) => {
  button.addEventListener("click", async () => {
    const status = button.parentElement.querySelector(".copy-status");
    try {
      await navigator.clipboard.writeText(button.dataset.email);
      status.textContent = "Email address copied.";
    } catch (_) {
      status.textContent = button.dataset.email;
    }
  });
});
