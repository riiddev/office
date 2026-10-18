import { timingSafeEqual } from 'node:crypto';

const OWNER = 'riiddev';
const REPO = 'office';
const GITHUB_API = 'https://api.github.com';

function send(res, status, payload) {
  res.status(status).setHeader('Cache-Control', 'no-store');
  return res.json(payload);
}

function secretsMatch(candidate, expected) {
  if (typeof candidate !== 'string' || typeof expected !== 'string') return false;
  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);
  return candidateBuffer.length === expectedBuffer.length
    && candidateBuffer.length > 0
    && timingSafeEqual(candidateBuffer, expectedBuffer);
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'riiddev-agent-hq',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Use POST to submit an agent task.' });
  }

  const accessToken = process.env.HQ_ACCESS_TOKEN;
  const githubToken = process.env.GITHUB_ISSUES_TOKEN;
  if (!accessToken || !githubToken) {
    return send(res, 503, {
      error: 'Cloud dispatch is not configured yet. Add HQ_ACCESS_TOKEN and GITHUB_ISSUES_TOKEN to this Vercel project, then redeploy.',
    });
  }

  const authorization = req.headers.authorization || '';
  const suppliedToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!secretsMatch(suppliedToken, accessToken)) {
    return send(res, 401, { error: 'Access token does not match HQ_ACCESS_TOKEN in Vercel.' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > 12000) {
    return send(res, 413, { error: 'Task request is too large. Keep it under 3,000 characters.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (prompt.length < 8) {
    return send(res, 400, { error: 'Write a task with at least 8 characters.' });
  }
  if (prompt.length > 3000) {
    return send(res, 413, { error: 'Task is too long. Maximum 3,000 characters.' });
  }

  const firstLine = prompt.split(/\r?\n/, 1)[0].replace(/\s+/g, ' ').trim();
  const title = `[Agent HQ] ${(firstLine || 'New cloud task').slice(0, 75)}`;
  const issueBody = [
    '## Task from Riiddev Agent HQ',
    '',
    prompt,
    '',
    '## Agent execution rules',
    '- Work in a dedicated branch and open a pull request for review.',
    '- Do not merge the pull request automatically.',
    '- Run relevant checks and summarize what changed.',
    '- If the task is ambiguous, risky, or requires credentials, stop and ask for clarification.',
    '',
    '---',
    'Submitted from the Agent HQ web dashboard.',
  ].join('\n');

  try {
    const issueResult = await githubRequest(`/repos/${OWNER}/${REPO}/issues`, githubToken, {
      method: 'POST',
      body: JSON.stringify({ title, body: issueBody }),
    });

    if (!issueResult.response.ok) {
      const message = issueResult.response.status === 401 || issueResult.response.status === 403
        ? 'GitHub rejected GITHUB_ISSUES_TOKEN. Confirm it belongs to the correct account and has Issues read/write permission for riiddev/office.'
        : `GitHub could not create the task issue (HTTP ${issueResult.response.status}).`;
      return send(res, 502, { error: message });
    }

    const issue = issueResult.data;
    const comment = [
      '/opencode',
      'Please execute the task described in this issue. Work on a separate branch, run relevant checks, and open a pull request. Do not merge automatically.',
    ].join(' ');
    const commentResult = await githubRequest(`/repos/${OWNER}/${REPO}/issues/${issue.number}/comments`, githubToken, {
      method: 'POST',
      body: JSON.stringify({ body: comment }),
    });

    if (!commentResult.response.ok) {
      return send(res, 502, {
        error: 'The GitHub issue was created, but the OpenCode trigger comment failed. Check GITHUB_ISSUES_TOKEN permissions.',
        issueUrl: issue.html_url,
      });
    }

    return send(res, 201, {
      ok: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
      workflowUrl: `https://github.com/${OWNER}/${REPO}/actions/workflows/opencode.yml`,
      message: 'Task submitted. OpenCode should start from the GitHub issue comment after its app and model secret are configured.',
    });
  } catch {
    return send(res, 502, { error: 'Could not reach GitHub. Check the Vercel function logs and try again.' });
  }
}
