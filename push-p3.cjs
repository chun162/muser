const https = require('https')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PAT = process.env.GH_PAT
const REPO = 'chun162/muser'
const CWD = 'C:\\Users\\Administrator\\Desktop\\muser'

function api(method, pathSuffix, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      path: `/repos/${REPO}${pathSuffix}`,
      method,
      headers: {
        Authorization: `Bearer ${PAT}`,
        'User-Agent': 'muser-push',
        'Content-Type': 'application/json',
      },
    }
    const req = https.request(opts, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch { resolve(data) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function main() {
  const commitMsg = execSync('git log -1 --format=%s', { cwd: CWD, encoding: 'utf8' }).trim()

  const ref = await api('GET', '/git/refs/heads/main')
  console.log('Parent SHA:', ref.object.sha)

  const parentCommit = await api('GET', `/git/commits/${ref.object.sha}`)
  console.log('Parent tree:', parentCommit.tree.sha)

  const changed = execSync('git diff --name-only HEAD~1', { cwd: CWD, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  console.log('Changed:', changed)

  const treeItems = []
  for (const file of changed) {
    const fullPath = path.join(CWD, file)
    const content = fs.readFileSync(fullPath)
    const b64 = content.toString('base64')
    const blob = await api('POST', '/git/blobs', { content: b64, encoding: 'base64' })
    if (!blob.sha) {
      console.error('Blob error:', JSON.stringify(blob))
      process.exit(1)
    }
    console.log(`  blob ${blob.sha}  ${file}`)
    treeItems.push({ path: file, mode: '100644', type: 'blob', sha: blob.sha })
  }

  const tree = await api('POST', '/git/trees', {
    base_tree: parentCommit.tree.sha,
    tree: treeItems,
  })
  if (!tree.sha) {
    console.error('Tree error:', JSON.stringify(tree))
    process.exit(1)
  }
  console.log('Tree SHA:', tree.sha)

  const commit = await api('POST', '/git/commits', {
    message: commitMsg,
    tree: tree.sha,
    parents: [ref.object.sha],
  })
  console.log('Commit SHA:', commit.sha)

  const result = await api('PATCH', '/git/refs/heads/main', {
    sha: commit.sha,
    force: true,
  })
  console.log('Push OK!', result.object.sha)
}

main().catch(console.error)
