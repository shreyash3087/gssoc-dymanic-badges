export async function GET(req, { params: { username } }) {
    // Define badges with corresponding scores and SVG details
    const badges = {
      1: { score: 1, name: "Postman Badge", badge: "https://github.com/user-attachments/assets/eb1698c5-7400-40d1-9441-319b5e4d0c08" },
      60: { score: 60, name: "Explorer Badge", badge: "https://github.com/user-attachments/assets/fc84ac41-dfd4-4277-b239-4ac09ced4512" },
      140: { score: 140, name: "Adventurer Badge", badge: "https://github.com/user-attachments/assets/cbd0830d-4b3b-4bf0-8615-75fed30a01c5" },
      200: { score: 200, name: "Trailblazer Badge", badge: "https://github.com/user-attachments/assets/4a75f99a-29e5-4f18-8a93-4baa639c1739" },
      300: { score: 300, name: "Summit Seeker Badge", badge: "https://github.com/user-attachments/assets/6b1522f3-5e26-4c3e-9097-ae18a3935cfd" },
      500: { score: 500, name: "Champion Badge", badge: "https://github.com/user-attachments/assets/b7ba2b2e-98a1-4d6d-bc8e-b7e5282914b3" },
      1200: { score: 1200, name: "Innovator Badge", badge: "https://github.com/user-attachments/assets/ac40f0b7-68d1-4337-a82b-74adf8f822b7" },
      2500: { score: 2500, name: "Conqueror Badge", badge: "https://github.com/user-attachments/assets/3708e5ce-5871-467c-975a-34f82c5dbb53" },
      5500: { score: 5500, name: "Legend Badge", badge: "https://github.com/user-attachments/assets/5e4e86f0-72f0-40eb-9061-10e73cdf5a81" },
    };
  
    try {
      // Fetch data from your backend
      const response = await fetch("https://gssoc24-leaderboard-backend-production-dfe3.up.railway.app/OSLeaderboard");
  
      // Check if the response is ok
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const data = await response.json();
  
      // Find the contributor in the data
      const contributor = data.leaderboard.find(
        (user) => user.login.toLowerCase() === username.toLowerCase()
      );
  
      // If the contributor is not found, return 404
      if (!contributor) {
        return new Response("User not found", { status: 404 });
      }
  
      const { score } = contributor;
  
      // Determine unlocked badges
      const unlockedBadges = Object.values(badges).filter(
        (badge) => score >= badge.score
      );
  
      // Generate a single SVG for all unlocked badges
      const svgBadges = `
        <svg width="${80 * unlockedBadges.length}" height="100" xmlns="http://www.w3.org/2000/svg">
          ${unlockedBadges.map((badge, index) => `
            <image x="${index * 80}" y="10" width="80" height="80" href="${badge.badge}" />
          `).join('')}
        </svg>
      `;
  
      // Return the single SVG badge response
      return new Response(svgBadges, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Access-Control-Allow-Origin": "*", 
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      return new Response("Error fetching user data", { status: 500 });
    }
  }
  