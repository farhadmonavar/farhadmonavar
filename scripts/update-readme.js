const fs = require('fs');
const https = require('https');

const USERNAME = 'farhadmonavar';
const README_PATH = 'README.md';
const START = '<!--START_SECTION:projects-->';
const END = '<!--END_SECTION:projects-->';

function fetchRepos() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/users/${USERNAME}/repos?sort=updated&per_page=100`,
      headers: {
        'User-Agent': 'readme-updater',
        'Authorization': `Bearer ${process.env.GH_TOKEN}`
      }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error('Failed to parse GitHub API response: ' + data));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  try {
    const repos = await fetchRepos();

    if (!Array.isArray(repos)) {
      console.error('GitHub API did not return an array:', repos);
      process.exit(1);
    }

    const readme = fs.readFileSync(README_PATH, 'utf8');
    const startIdx = readme.indexOf(START);
    const endIdx = readme.indexOf(END);

    if (startIdx === -1 || endIdx === -1) {
      console.error('Markers not found in README.md. Make sure it contains:');
      console.error(START);
      console.error(END);
      process.exit(1);
    }

    const filtered = repos
      .filter(r => !r.fork && !r.archived)
      .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
      .slice(0, 6);

    const list = filtered.map(r => {
      const desc = r.description ? ` — ${r.description}` : '';
      const lang = r.language ? ` \`${r.language}\`` : '';
      return `- **[${r.name}](${r.html_url})**${lang}${desc}`;
    }).join('\n');

    const newReadme =
      readme.slice(0, startIdx + START.length) + '\n' + list + '\n' + readme.slice(endIdx);

    fs.writeFileSync(README_PATH, newReadme);
    console.log(`README updated successfully with ${filtered.length} projects.`);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

main();
