require("dotenv").config();
const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 3000;

// Helper to fetch data from GitHub API
async function getGithubData(username) {
  const token = process.env.GITHUB_TOKEN;
  const query = `
    query($login: String!) {
      user(login: $login) {
        createdAt
        followers { totalCount }
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
          totalCount
          nodes {
            stargazerCount
          }
        }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalIssueContributions
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query, variables: { login: username } },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "User-Agent": "github-profile-trophies-custom",
        },
      },
    );

    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    return response.data.data.user;
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return null;
  }
}

// Logic to calculate ranks for different categories
function calculateRank(value, thresholds) {
  if (value >= thresholds.SSS) return "SSS";
  if (value >= thresholds.SS) return "SS";
  if (value >= thresholds.S) return "S";
  if (value >= thresholds.A) return "A";
  if (value >= thresholds.B) return "B";
  if (value >= thresholds.C) return "C";
  return "D"; // Start/None
}

// Generate the SVG Card
function generateSvg(trophies, theme = "onedark") {
  // Simple Theme Definitions
  const themes = {
    onedark: {
      bg: "#282c34",
      text: "#c8ccd4",
      rank: "#e5c07b",
      border: "#e06c75",
    },
    light: {
      bg: "#ffffff",
      text: "#333333",
      rank: "#d35400",
      border: "#e67e22",
    },
  };
  const colors = themes[theme] || themes.onedark;

  // Build the SVG parts
  let xOffset = 0;
  const trophyWidth = 110;
  const trophyHeight = 110;

  const trophySvgs = trophies
    .map((t, i) => {
      const x = i * trophyWidth;
      return `
      <g transform="translate(${x}, 0)">
        <rect x="5" y="5" width="100" height="100" rx="10" fill="${colors.bg}" stroke="${colors.border}" stroke-width="2"/>
        <text x="55" y="30" text-anchor="middle" fill="${colors.text}" font-family="Arial" font-size="12" font-weight="bold">${t.name}</text>
        <text x="55" y="70" text-anchor="middle" fill="${colors.rank}" font-family="Arial" font-size="36" font-weight="bold">${t.rank}</text>
        <text x="55" y="90" text-anchor="middle" fill="${colors.text}" font-family="Arial" font-size="10">${t.value} total</text>
      </g>
    `;
    })
    .join("");

  return `
    <svg width="${trophies.length * trophyWidth}" height="${trophyHeight}" viewBox="0 0 ${trophies.length * trophyWidth} ${trophyHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .title { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.title}; }
      </style>
      ${trophySvgs}
    </svg>
  `;
}

app.get("/api", async (req, res) => {
  const { username, theme } = req.query;

  if (!username) {
    return res.status(400).send("Error: Username is required");
  }

  const data = await getGithubData(username);

  if (!data) {
    return res.status(404).send("User not found or API error");
  }

  // Calculate stats
  const totalStars = data.repositories.nodes.reduce(
    (acc, repo) => acc + repo.stargazerCount,
    0,
  );
  const totalCommits = data.contributionsCollection.totalCommitContributions;
  const totalFollowers = data.followers.totalCount;

  // Define Trophies
  const trophies = [
    {
      name: "Stars",
      value: totalStars,
      rank: calculateRank(totalStars, {
        SSS: 2000,
        SS: 500,
        S: 100,
        A: 50,
        B: 20,
        C: 1,
      }),
    },
    {
      name: "Commits",
      value: totalCommits,
      rank: calculateRank(totalCommits, {
        SSS: 10000,
        SS: 5000,
        S: 1000,
        A: 500,
        B: 100,
        C: 1,
      }),
    },
    {
      name: "Followers",
      value: totalFollowers,
      rank: calculateRank(totalFollowers, {
        SSS: 1000,
        SS: 500,
        S: 100,
        A: 50,
        B: 20,
        C: 1,
      }),
    },
  ];

  const svg = generateSvg(trophies, theme);

  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=1800"); // Cache for 30 mins
  res.send(svg);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;
