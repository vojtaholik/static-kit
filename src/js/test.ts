const div = document.querySelector<HTMLDivElement>("#test");

div?.addEventListener("click", () => {
  console.log("clicked");
});
