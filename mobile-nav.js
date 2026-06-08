document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll("header.mobile-nav-enabled");
  headers.forEach((header) => {
    const toggle = header.querySelector(".mobile-menu-toggle");
    const nav = header.querySelector("nav");
    if (!toggle || !nav) return;

    const closeNav = () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.classList.remove("open");
    };

    const openNav = () => {
      nav.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.classList.add("open");
    };

    toggle.addEventListener("click", () => {
      if (nav.classList.contains("open")) {
        closeNav();
      } else {
        openNav();
      }
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeNav();
      });
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 920) {
        closeNav();
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("open")) return;
      if (header.contains(event.target)) return;
      closeNav();
    });
  });
});
