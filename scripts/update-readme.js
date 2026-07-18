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
      headers: { 'User-Agent': 'readme-updater' }
    };
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function main() {
  const repos = await fetchRepos();

  const filtered = repos
    .filter(r => !r.fork && !r.archived)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, 6);

  const list = filtered.map(r => {
    const desc = r.description ? ` — ${r.description}` : '';
    const lang = r.language ? ` \`${r.language}\`` : '';
    return `- **[${r.name}](${r.html_url})**${lang}${desc}`;
  }).join('\n');

  const readme = fs.readFileSync(README_PATH, 'utf8');
  const startIdx = readme.indexOf(START) + START.length;
  const endIdx = readme.indexOf(END);

  const newReadme =
    readme.slice(0, startIdx) + '\n' + list + '\n' + readme.slice(endIdx);

  fs.writeFileSync(README_PATH, newReadme);
}

main();
