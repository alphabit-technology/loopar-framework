'use strict';

import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { loopar } from 'loopar';

const execFile = promisify(execFileCb);

export function getCwdForApp(name) {
  const appPath = loopar.makePath(loopar.pathRoot, 'apps', name);
  const ownGitPath = loopar.makePath(appPath, '.git');
  const hasOwnGit = fs.existsSync(ownGitPath);

  if (name === 'loopar' && !hasOwnGit) {
    return { cwd: loopar.pathRoot, isFramework: true };
  }

  if (!hasOwnGit) {
    const err = new Error(
      `App '${name}' has no git repository at ${appPath}. ` +
      `Use 'Get App' to clone it from a remote first.`
    );
    err.code = 'NO_GIT_DIR';
    throw err;
  }

  return { cwd: appPath, isFramework: false };
}

async function git(cwd, args) {
  const { stdout, stderr } = await execFile('git', args, { cwd, maxBuffer: 4 * 1024 * 1024 });
  return { stdout: (stdout || '').trim(), stderr: (stderr || '').trim() };
}

export async function getStatus(cwd) {
  const { stdout: porcelain } = await git(cwd, ['status', '--porcelain']);
  const files = porcelain ? porcelain.split('\n').filter(Boolean).slice(0, 20) : [];
  const clean = files.length === 0;

  let branch = 'HEAD';
  try {
    branch = (await git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout || 'HEAD';
  } catch {}

  let ahead = 0, behind = 0;
  try {
    const { stdout } = await git(cwd, ['rev-list', '--left-right', '--count', '@{u}...HEAD']);
    const [b, a] = stdout.split(/\s+/).map(n => parseInt(n, 10) || 0);
    behind = b;
    ahead = a;
  } catch {
    // No upstream tracking. Leave at 0; UI will show as "no remote tracking".
  }

  return { clean, files, ahead, behind, branch };
}

export async function pullApp(name) {
  const { cwd, isFramework } = getCwdForApp(name);
  const before = (await git(cwd, ['rev-parse', 'HEAD'])).stdout;

  const status = await getStatus(cwd);
  if (!status.clean) {
    return {
      success: false,
      reason: 'DIRTY',
      message:
        `Uncommitted changes detected${isFramework ? ' in monorepo' : ` in apps/${name}`} ` +
        `(${status.files.length} file${status.files.length === 1 ? '' : 's'}). ` +
        `Commit/push them, or 'git reset --hard' to discard.`,
      files: status.files,
    };
  }

  let pullOut;
  try {
    pullOut = await git(cwd, ['pull', '--ff-only']);
  } catch (e) {
    return {
      success: false,
      reason: 'GIT_ERROR',
      message: (e.stderr || e.message || 'git pull failed').toString().trim(),
    };
  }

  const after = (await git(cwd, ['rev-parse', 'HEAD'])).stdout;
  const changed = before !== after;

  let filesChanged = 0;
  if (changed) {
    try {
      const { stdout } = await git(cwd, ['diff', '--name-only', `${before}..${after}`]);
      filesChanged = stdout ? stdout.split('\n').filter(Boolean).length : 0;
    } catch {}
  }

  return {
    success: true,
    is_framework: isFramework,
    before_sha: before,
    after_sha: after,
    files_changed: filesChanged,
    needs_restart: isFramework && changed,
    message: pullOut.stdout || pullOut.stderr || (changed ? 'Pulled.' : 'Already up to date.'),
  };
}

export async function pushApp(name) {
  const { cwd, isFramework } = getCwdForApp(name);
  const status = await getStatus(cwd);

  if (!status.clean) {
    return {
      success: false,
      reason: 'DIRTY',
      message:
        `Uncommitted changes${isFramework ? ' in monorepo' : ` in apps/${name}`}: ` +
        `commit them before pushing.`,
      files: status.files,
    };
  }
  if (status.behind > 0) {
    return {
      success: false,
      reason: 'BEHIND',
      message: `Local is behind remote by ${status.behind} commit(s). Pull first.`,
    };
  }
  if (status.ahead === 0) {
    return {
      success: false,
      reason: 'NOTHING_TO_PUSH',
      message: 'Nothing to push. Local is in sync with remote.',
    };
  }

  let pushOut;
  try {
    pushOut = await git(cwd, ['push']);
  } catch (e) {
    return {
      success: false,
      reason: 'GIT_ERROR',
      message: (e.stderr || e.message || 'git push failed').toString().trim(),
    };
  }

  return {
    success: true,
    is_framework: isFramework,
    pushed: status.ahead,
    message: pushOut.stdout || pushOut.stderr || `Pushed ${status.ahead} commit(s).`,
  };
}

export async function commitApp(name, message) {
  if (!message || !message.trim()) {
    return {
      success: false,
      reason: 'NO_MESSAGE',
      message: 'Commit message is required.',
    };
  }

  const { cwd, isFramework } = getCwdForApp(name);
  const status = await getStatus(cwd);

  if (status.clean) {
    return {
      success: false,
      reason: 'NOTHING_TO_COMMIT',
      message: `Nothing to commit${isFramework ? ' in monorepo' : ` in apps/${name}`}. Working tree is already clean.`,
    };
  }

  try {
    await git(cwd, ['add', '.']);
  } catch (e) {
    return {
      success: false,
      reason: 'GIT_ADD_ERROR',
      message: (e.stderr || e.message || 'git add failed').toString().trim(),
    };
  }

  let commitOut;
  try {
    commitOut = await git(cwd, ['commit', '-m', message.trim()]);
  } catch (e) {
    return {
      success: false,
      reason: 'GIT_COMMIT_ERROR',
      message: (e.stderr || e.message || 'git commit failed').toString().trim(),
    };
  }

  const sha = (await git(cwd, ['rev-parse', 'HEAD'])).stdout;

  return {
    success: true,
    is_framework: isFramework,
    sha,
    files_committed: status.files.length,
    message: commitOut.stdout || `Committed ${status.files.length} file(s).`,
  };
}

export async function discardApp(name) {
  const { cwd, isFramework } = getCwdForApp(name);

  try {
    await git(cwd, ['reset', '--hard', 'HEAD']);
    await git(cwd, ['clean', '-fd']);
  } catch (e) {
    return {
      success: false,
      reason: 'GIT_ERROR',
      message: (e.stderr || e.message || 'discard failed').toString().trim(),
    };
  }

  return {
    success: true,
    is_framework: isFramework,
    message: `Discarded local changes${isFramework ? ' in monorepo' : ` in apps/${name}`}.`,
  };
}

export async function getRemoteUrl(name) {
  let cwd, isFramework;
  try {
    ({ cwd, isFramework } = getCwdForApp(name));
  } catch {
    return '';
  }
  try {
    const { stdout } = await git(cwd, ['remote', 'get-url', 'origin']);
    return stdout || '';
  } catch {
    return '';
  }
}

export async function publishApp(name, remoteUrl, message = 'Initial commit') {
  if (name === 'loopar') {
    return {
      success: false,
      reason: 'IS_FRAMEWORK',
      message: 'Framework is published with the monorepo, not from App Manager.',
    };
  }
  if (!remoteUrl || !remoteUrl.trim()) {
    return { success: false, reason: 'NO_URL', message: 'Remote URL is required.' };
  }

  const appPath = loopar.makePath(loopar.pathRoot, 'apps', name);
  if (!fs.existsSync(appPath)) {
    return {
      success: false,
      reason: 'NO_DIR',
      message: `App directory ${appPath} does not exist.`,
    };
  }

  const url = remoteUrl.trim();
  const msg = (message || 'Initial commit').trim();
  const hasGit = fs.existsSync(loopar.makePath(appPath, '.git'));

  let hasOrigin = false;
  if (hasGit) {
    try {
      await git(appPath, ['remote', 'get-url', 'origin']);
      hasOrigin = true;
    } catch {
      hasOrigin = false;
    }
  }

  if (hasGit && hasOrigin) {
    return {
      success: false,
      reason: 'ALREADY_CONNECTED',
      message: `'${name}' already has a remote configured. Use Push to send changes.`,
    };
  }

  try {
    if (!hasGit) {
      await git(appPath, ['init']);
      await git(appPath, ['remote', 'add', 'origin', url]);
      await git(appPath, ['add', '.']);
      await git(appPath, ['commit', '-m', msg]);
    } else {
      await git(appPath, ['remote', 'add', 'origin', url]);

      let hasHead = true;
      try {
        await git(appPath, ['rev-parse', 'HEAD']);
      } catch {
        hasHead = false;
      }
      if (!hasHead) {
        try {
          await git(appPath, ['add', '.']);
          await git(appPath, ['commit', '-m', msg]);
        } catch {
          return {
            success: false,
            reason: 'EMPTY_REPO',
            message: `'${name}' has .git but no commits and nothing stageable. Add content before publishing.`,
          };
        }
      }
    }

    let branch = 'main';
    try {
      branch = (await git(appPath, ['symbolic-ref', '--short', 'HEAD'])).stdout || 'main';
    } catch {}

    await git(appPath, ['push', '-u', 'origin', branch]);

    return {
      success: true,
      remote_url: url,
      branch,
      message: hasGit
        ? `Connected '${name}' to ${url} and pushed ${branch}.`
        : `Published '${name}' to ${url} on branch ${branch}.`,
    };
  } catch (e) {
    return {
      success: false,
      reason: 'GIT_ERROR',
      message: (e.stderr || e.message || 'Publish failed').toString().trim(),
      hint: hasGit
        ? `Local .git was preserved. To undo the connection: 'cd apps/${name} && git remote remove origin'.`
        : `Local .git was left in place. To start over: 'rm -rf apps/${name}/.git'.`,
    };
  }
}

export async function getDiff(name) {
  const { cwd, isFramework } = getCwdForApp(name);

  const stats = {};
  try {
    const { stdout } = await git(cwd, ['diff', '--numstat', 'HEAD']);
    if (stdout) {
      for (const line of stdout.split('\n').filter(Boolean)) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          stats[parts[2]] = {
            insertions: parseInt(parts[0], 10) || 0,
            deletions: parseInt(parts[1], 10) || 0,
          };
        }
      }
    }
  } catch {}

  const files = [];
  const { stdout: porcelain } = await git(cwd, ['status', '--porcelain']);
  if (porcelain) {
    for (const line of porcelain.split('\n').filter(Boolean)) {
      const flag = line.substring(0, 2).trim() || '?';
      const path = line.substring(3).trim();
      const s = stats[path] || { insertions: 0, deletions: 0 };
      files.push({
        status: flag,
        path,
        insertions: s.insertions,
        deletions: s.deletions,
      });
    }
  }

  let branch = 'HEAD';
  try {
    branch = (await git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD'])).stdout || 'HEAD';
  } catch {}

  let recent_commits = [];
  try {
    const { stdout } = await git(cwd, ['log', '--oneline', '-n', '5']);
    if (stdout) {
      recent_commits = stdout.split('\n').filter(Boolean).map(line => {
        const idx = line.indexOf(' ');
        return idx > 0
          ? { sha: line.substring(0, idx), subject: line.substring(idx + 1) }
          : { sha: line, subject: '' };
      });
    }
  } catch {}

  return {
    is_framework: isFramework,
    branch,
    clean: files.length === 0,
    files,
    recent_commits,
  };
}

export async function statusApp(name) {
  const { cwd, isFramework } = getCwdForApp(name);
  const status = await getStatus(cwd);
  return { ...status, is_framework: isFramework };
}
