function checkVisibility() {
  const rows = document.querySelectorAll('.content-row');
  rows.forEach(row => {
      const position = row.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (position.top < windowHeight * 0.75 && position.bottom >= 0) {
          row.classList.add('is-visible');
      } else {
          row.classList.remove('is-visible');
      }
  });
}

// Add event listeners
window.addEventListener('scroll', checkVisibility);
window.addEventListener('resize', checkVisibility);
window.addEventListener('load', checkVisibility);