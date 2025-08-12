document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#contact-form") as HTMLFormElement;

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      alert("Form submitted! (This is just a demo)");
    });
  }

  const contactLink = document.querySelector(
    "#contact-link"
  ) as HTMLAnchorElement;

  if (contactLink) {
    contactLink.addEventListener("click", (e) => {
      e.preventDefault();
      alert("Contact link clicked! (This is just a demo)");
    });
  }
});
