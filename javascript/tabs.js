document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.querySelector("#tabs");
  const tabTogglers = tabsContainer.querySelectorAll("a");
  const tabContents = document.querySelector("#tab-contents");

  function activate(tabName) {
    for (let i = 0; i < tabContents.children.length; i++) {
      tabTogglers[i].parentElement.classList.remove(
        "border-blue-400",
        "border-b-4",
        "-mb-px",
        "opacity-100"
      );
      tabTogglers[i].parentElement.classList.add("opacity-50");
      tabContents.children[i].classList.add("hidden");

      if ("#" + tabContents.children[i].id === tabName) {
        tabContents.children[i].classList.remove("hidden");
        tabTogglers[i].parentElement.classList.add(
          "border-blue-400",
          "border-b-4",
          "-mb-px",
          "opacity-100"
        );
        tabTogglers[i].parentElement.classList.remove("opacity-50");
      }
    }
  }

  tabTogglers.forEach(function (toggler) {
    toggler.addEventListener("click", function (e) {
      e.preventDefault();
      activate(this.getAttribute("href"));
    });
  });

  // Tab pertama aktif secara default
  activate(tabTogglers[0].getAttribute("href"));
});
