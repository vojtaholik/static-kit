// Main JavaScript entry point
console.log("Static Kit is ready! 🚀");

// Example: Add smooth scrolling for anchor links
document.addEventListener("DOMContentLoaded", () => {
  // Add click handlers for navigation links
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      console.log(`Navigating to: ${link.getAttribute('href')}`);
    });
  });
  
  // Example: Add some interactivity to feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  
  featureCards.forEach(card => {
    const htmlCard = card as HTMLElement;
    htmlCard.addEventListener('mouseenter', () => {
      htmlCard.style.transform = 'translateY(-4px)';
    });
    
    htmlCard.addEventListener('mouseleave', () => {
      htmlCard.style.transform = 'translateY(0)';
    });
  });
});
