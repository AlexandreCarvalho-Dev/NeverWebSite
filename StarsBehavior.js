document.addEventListener("DOMContentLoaded", () => {
  const stars = document.querySelectorAll(".stars img");
  let selected = 0;

  stars.forEach((star, i) => {
    // Hover -> pinta até à estrela atual
    star.addEventListener("mouseover", () => {
      stars.forEach((s, j) => {
        if (j <= i) s.classList.add("hovered");
        else s.classList.remove("hovered");
      });
    });

    // Sai do hover -> só mantém as ativas
    star.addEventListener("mouseout", () => {
      stars.forEach((s, j) => {
        if (j >= selected) s.classList.remove("hovered");
      });
    });

    // Clique -> define a classificação
    star.addEventListener("click", () => {
      selected = i + 1;
      stars.forEach((s, j) => {
        if (j < selected) s.classList.add("active");
        else s.classList.remove("active");
      });
    });
  });
});
