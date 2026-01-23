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

// Trophy Icon Path (Simple Cup)
const trophyPath =
  "M28.8 8h-6.6V3.2c0-1.8-1.4-3.2-3.2-3.2H13c-1.8 0-3.2 1.4-3.2 3.2V8H3.2C1.4 8 0 9.4 0 11.2v6.4c0 4.1 3.1 7.5 7.1 8v2.3c0 2.3 2.1 4.5 4.8 5.7V37H9.6c-1.8 0-3.2 1.4-3.2 3.2V43h19.2v-2.8c0-1.8-1.4-3.2-3.2-3.2h-2.3v-3.4c2.7-1.2 4.8-3.3 4.8-5.7v-2.3c4-0.5 7.1-3.9 7.1-8v-6.4C32 9.4 30.6 8 28.8 8z M6.4 17.6v-6.4h3.4v6.4H6.4z M25.6 17.6h-3.4v-6.4h3.4V17.6z";

// Get color based on rank
// Drop Shadow Filter
const filterDef = `
  <filter id="dropShadow" height="130%">
    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/> 
    <feOffset dx="1" dy="1" result="offsetblur"/> 
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.3"/> 
    </feComponentTransfer>
    <feMerge> 
      <feMergeNode/>
      <feMergeNode in="SourceGraphic"/> 
    </feMerge>
  </filter>
`;

// Rank Gradients
const gradientDefs = `
  <linearGradient id="grad-SSS" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#FF0033;stop-opacity:1" />
    <stop offset="50%" style="stop-color:#FF6680;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#FF0033;stop-opacity:1" />
  </linearGradient>
  <linearGradient id="grad-SS" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#00d1e0;stop-opacity:1" />
    <stop offset="50%" style="stop-color:#80faff;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#00d1e0;stop-opacity:1" />
  </linearGradient>
  <linearGradient id="grad-S" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#BF953F;stop-opacity:1" />
    <stop offset="25%" style="stop-color:#FCF6BA;stop-opacity:1" />
    <stop offset="50%" style="stop-color:#B38728;stop-opacity:1" />
    <stop offset="75%" style="stop-color:#FBF5B7;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#AA771C;stop-opacity:1" />
  </linearGradient>
  <linearGradient id="grad-A" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#8A8A8A;stop-opacity:1" />
    <stop offset="50%" style="stop-color:#E3E3E3;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#8A8A8A;stop-opacity:1" />
  </linearGradient>
  <linearGradient id="grad-B" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#804A00;stop-opacity:1" />
    <stop offset="50%" style="stop-color:#B87333;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#804A00;stop-opacity:1" />
  </linearGradient>
  <linearGradient id="grad-C" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#434343;stop-opacity:1" />
    <stop offset="50%" style="stop-color:#6d5c4d;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#434343;stop-opacity:1" />
  </linearGradient>
  <linearGradient id="grad-D" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:#333;stop-opacity:1" />
    <stop offset="100%" style="stop-color:#555;stop-opacity:1" />
  </linearGradient>
`;

function getRankFill(rank) {
  switch (rank) {
    case 'SSS': return 'url(#grad-SSS)';
    case 'SS': return 'url(#grad-SS)';
    case 'S': return 'url(#grad-S)';
    case 'A': return 'url(#grad-A)';
    case 'B': return 'url(#grad-B)';
    case 'C': return 'url(#grad-C)';
    default: return 'url(#grad-D)';
  }
}

// Generate the SVG Card
function generateSvg(trophies, theme = 'onedark') {
  // Simple Theme Definitions
  const themes = {
    onedark: { bg: '#282c34', text: '#c8ccd4', border: '#e06c75' },
    light: { bg: '#ffffff', text: '#333333', border: '#e67e22' },
  };
  const colors = themes[theme] || themes.onedark;

  // Build the SVG parts
  const trophyWidth = 110;
  const trophyHeight = 110;
  
  const trophySvgs = trophies.map((t, i) => {
    const x = i * trophyWidth;
    const rankFill = getRankFill(t.rank);
    
    return `
      <g transform="translate(${x}, 0)">
        <rect x="5" y="5" width="100" height="100" rx="10" fill="${colors.bg}" stroke="${colors.border}" stroke-width="2"/>
        <text x="55" y="25" text-anchor="middle" fill="${colors.text}" font-family="Segoe UI, sans-serif" font-size="12" font-weight="bold">${t.name}</text>
        
        <!-- Trophy Icon -->
        <g transform="translate(39, 35) scale(1.0)" filter="url(#dropShadow)">
           <path d="${trophyPath}" fill="${rankFill}" />
        </g>
        
        <!-- Rank Label (Small) -->
        <text x="55" y="85" text-anchor="middle" fill="${rankFill}" font-family="Segoe UI, sans-serif" font-size="10" font-weight="bold">${t.rank}</text>
        
        <text x="55" y="98" text-anchor="middle" fill="${colors.text}" font-family="Segoe UI, sans-serif" font-size="9">${t.value}</text>
      </g>
    `;
  }).join('');

  return `
    <svg width="${trophies.length * trophyWidth}" height="${trophyHeight}" viewBox="0 0 ${trophies.length * trophyWidth} ${trophyHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        ${filterDef}
        ${gradientDefs}
      </defs>
      <style>
        .title { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.title || colors.text}; }
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
  console.log(`Server running...`);
});

module.exports = app;
