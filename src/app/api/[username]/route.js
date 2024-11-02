import { Redis } from "@upstash/redis";
import { createCanvas, loadImage } from "canvas";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const leaderboardURLs = {
  "2024Extd":
    "https://gssoc24-leaderboard-backend-production-dfe3.up.railway.app/OSLeaderboard",
  2024: "https://gssoc.girlscript.tech/leaderboards/leaderboard24.json",
  2023: "https://gssoc.girlscript.tech/leaderboards/leaderboard23.json",
};

const badges = {
  1: {
    score: 1,
    name: "Postman Badge",
    badge:
      "https://github.com/user-attachments/assets/eb1698c5-7400-40d1-9441-319b5e4d0c08",
  },
  60: {
    score: 60,
    name: "Explorer Badge",
    badge:
      "https://github.com/user-attachments/assets/fc84ac41-dfd4-4277-b239-4ac09ced4512",
  },
  140: {
    score: 140,
    name: "Adventurer Badge",
    badge:
      "https://github.com/user-attachments/assets/cbd0830d-4b3b-4bf0-8615-75fed30a01c5",
  },
  200: {
    score: 200,
    name: "Trailblazer Badge",
    badge:
      "https://github.com/user-attachments/assets/4a75f99a-29e5-4f18-8a93-4baa639c1739",
  },
  300: {
    score: 300,
    name: "Summit Seeker Badge",
    badge:
      "https://github.com/user-attachments/assets/6b1522f3-5e26-4c3e-9097-ae18a3935cfd",
  },
  500: {
    score: 500,
    name: "Champion Badge",
    badge:
      "https://github.com/user-attachments/assets/b7ba2b2e-98a1-4d6d-bc8e-b7e5282914b3",
  },
  1200: {
    score: 1200,
    name: "Innovator Badge",
    badge:
      "https://github.com/user-attachments/assets/ac40f0b7-68d1-4337-a82b-74adf8f822b7",
  },
  2500: {
    score: 2500,
    name: "Conqueror Badge",
    badge:
      "https://github.com/user-attachments/assets/3708e5ce-5871-467c-975a-34f82c5dbb53",
  },
  5500: {
    score: 5500,
    name: "Legend Badge",
    badge:
      "https://github.com/user-attachments/assets/5e4e86f0-72f0-40eb-9061-10e73cdf5a81",
  },
};

export async function GET(req, { params }) {
  const username = await params.username;
  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year");
  const leaderboardUrl = leaderboardURLs[year];
  if (!leaderboardUrl) {
    return new Response("Invalid year provided", { status: 400 });
  }

  try {
    // Fetch leaderboard data
    const response = await fetch(leaderboardUrl);
    if (!response.ok) throw new Error("Network response was not ok");

    const data = await response.json();
    const contributor = data.leaderboard.find(
      (user) => user.login.toLowerCase() === username.toLowerCase()
    );
    if (!contributor) return new Response("User not found", { status: 404 });

    const { score, postManTag } = contributor;

    const unlockedBadges = Object.values(badges).filter((badge) => {
      if (badge.name === "Postman Badge") return postManTag && score >= badge.score;
      return score >= badge.score;
    });

    const cachedImages = await Promise.all(
      unlockedBadges.map((badge) =>
        redis.get(`badge:${username}-${year}-${badge.name}`)
      )
    );

    if (cachedImages.every((img) => img)) {
      // All badges are cached, so retrieve and assemble them on canvas
      const canvasWidth = 480 * unlockedBadges.length;
      const canvasHeight = 600;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const context = canvas.getContext("2d");

      for (let i = 0; i < cachedImages.length; i++) {
        const badgeBuffer = Buffer.from(cachedImages[i], "base64");
        const badgeImage = await loadImage(badgeBuffer);
        context.drawImage(badgeImage, i * 480, 80, 480, 480);
      }

      const buffer = canvas.toBuffer("image/png");
      return new Response(buffer, {
        headers: {
          "Content-Type": "image/png",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Not all badges are cached, so generate and cache each one individually
    const canvasWidth = 480 * unlockedBadges.length;
    const canvasHeight = 600;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const context = canvas.getContext("2d");

    await Promise.all(
      unlockedBadges.map(async (badge, i) => {
        const badgeImage = await loadImage(badge.badge);
        context.drawImage(badgeImage, i * 480, 80, 480, 480);

        // Save each badge individually in Redis
        const badgeCanvas = createCanvas(480, 600);
        const badgeContext = badgeCanvas.getContext("2d");
        badgeContext.drawImage(badgeImage, 0, 80, 480, 480);
        const badgeBuffer = badgeCanvas.toBuffer("image/png");

        await redis.set(
          `badge:${username}-${year}-${badge.name}`,
          badgeBuffer.toString("base64"),
          { ex: 1800 }
        );
      })
    );

    const buffer = canvas.toBuffer("image/png");
    return new Response(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return new Response("Error fetching user data: " + error.message, {
      status: 500,
    });
  }
}
