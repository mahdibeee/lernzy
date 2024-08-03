function truncateText(element, maxChars) {
  const originalText = element.innerText;
  if (originalText.length > maxChars) {
    element.innerText = originalText.substring(0, maxChars) + "...";
  }
}

function truncateTitles() {
  const titleElements = document.querySelectorAll(".truncate-title");
  titleElements.forEach((titleElement) => {
    truncateText(titleElement, 60);
  });
}

// Make truncateTitles function globally accessible
window.truncateTitles = truncateTitles;

document.addEventListener("DOMContentLoaded", () => {
  truncateTitles();
});
