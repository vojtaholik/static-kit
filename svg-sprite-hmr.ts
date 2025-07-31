// SVG Sprite HMR for development only
/// <reference types="vite/client" />

console.log("🚀 SVG HMR script loaded", import.meta.hot ? "✅" : "❌");

if (import.meta.hot) {
  console.log("🔧 Setting up SVG sprite HMR listener...");

  import.meta.hot.on("svg-sprite-updated", (data) => {
    console.log("🔄 Received svg-sprite-updated event:", data);

    // Find all SVG use elements and force them to reload
    const useElements = document.querySelectorAll('use[href^="/sprite.svg"]');
    console.log("🎯 Found", useElements.length, "SVG use elements");

    useElements.forEach((use, index) => {
      const href = use.getAttribute("href");
      if (href) {
        // Add timestamp to bust cache
        const [url, hash] = href.split("#");
        const newHref = `${url}?t=${data.timestamp}#${hash}`;
        console.log(`🔀 Updating element ${index}: ${href} → ${newHref}`);
        use.setAttribute("href", newHref);
      }
    });

    console.log("✅ SVG sprite references updated!");
  });

  console.log("✅ SVG HMR listener registered");
}
