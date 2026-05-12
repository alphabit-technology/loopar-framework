'use strict';

import ListContext from '@context/list-context'
import loopar from "loopar";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from '@card';

import {Badge} from "@cn/components/ui/badge";
import { titleize } from "inflection";
import {Link} from "@link"
import {Button} from "@cn/components/ui/button";
import { DynamicIcon } from "@icon";
import {
  PlusIcon,
  DownloadIcon,
  RefreshCcwDotIcon,
  FolderDownIcon,
  Trash2Icon,
  CheckCircle2Icon,
  PencilIcon,
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  GitBranchIcon,
  GitCommitHorizontalIcon,
  RotateCcwIcon,
  InfinityIcon,
  CloudUploadIcon,
} from 'lucide-react';

function compareVersion(a, b) {
  const pa = (a || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  const pb = (b || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function AppCard({app, action}) {
  const color = loopar.bgColor(app.name);
  const isFramework = app.is_framework ?? (app.name === 'loopar');
  const needsUpdate = app.installed && app.installed_version !== app.version;
  const versionDir = needsUpdate
    ? compareVersion(app.version, app.installed_version)
    : 0;
  const isRollback = versionDir < 0;
  const hasGitDir = app.has_git || isFramework;
  const hasRemote = !!app.remote_url;

  const status = app.repo_status || null;
  const dirtyCount = status?.files?.length || 0;
  const ahead = status?.ahead || 0;
  const behind = status?.behind || 0;
  const branch = status?.branch || '';
  const isDirty = dirtyCount > 0;

  const repoMode =
    isFramework || (hasGitDir && hasRemote) ? 'full' :
    hasGitDir ? 'local' :
    'none';

  const stateBadge = (() => {
    if (!app.installed && !isFramework) {
      return { label: 'Not installed', cls: 'border-zinc-600/50 bg-zinc-600/20 text-zinc-400' };
    }
    if (needsUpdate) {
      return isRollback
        ? { label: 'Rollback available', cls: 'border-yellow-500/50 bg-yellow-500/15 text-yellow-400' }
        : { label: 'Update available', cls: 'border-orange-600/50 bg-orange-600/20 text-orange-400' };
    }
    if (isDirty) {
      return { label: `Uncommitted (${dirtyCount})`, cls: 'border-amber-500/50 bg-amber-500/15 text-amber-400' };
    }
    if (behind > 0) {
      return { label: `Behind by ${behind}`, cls: 'border-yellow-500/50 bg-yellow-500/15 text-yellow-400' };
    }
    if (ahead > 0) {
      return { label: `Unpushed (${ahead})`, cls: 'border-blue-500/50 bg-blue-500/15 text-blue-400' };
    }
    if (app.installed || isFramework) {
      return { label: 'Up to date', cls: 'border-green-600/50 bg-green-600/20 text-green-500' };
    }
    return null;
  })();

  return (
    <Card className=" min-w-[320px]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {/* Identity tile: real icon (DynamicIcon from installer.json
                metadata) when available, fallback to letter avatar. The
                icon comes from the FS, not DB, so it works even for apps
                that aren't installed yet. */}
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: color }}
            >
              {app.icon ? (
                <DynamicIcon icon={app.icon} className="h-7 w-7 text-white" />
              ) : (
                <span className="text-xl font-bold text-white">
                  {loopar.utils.avatar(app.name)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-lg leading-tight">{app.name}</CardTitle>
              <CardDescription className="truncate text-xs">
                {app.autor || 'No author'}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end gap-1">
            {isFramework && (
              <Badge variant="outline" className="gap-1 border-purple-500/60 text-purple-400">
                <InfinityIcon className="h-3 w-3" /> Framework
              </Badge>
            )}
            {stateBadge && (
              <Badge className={`border ${stateBadge.cls}`}>
                {stateBadge.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        <div className="space-y-1 rounded border border-border/50 bg-background/40 px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Physical</span>
            <span className="font-mono">{app.version || '—'}</span>
          </div>
          {(app.installed || isFramework) && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Installed</span>
              <span className={`font-mono ${needsUpdate ? 'text-orange-400' : ''}`}>
                {app.installed_version || '—'}
              </span>
            </div>
          )}
        </div>

        {hasGitDir && (
          <div className="space-y-1 rounded border border-border/50 bg-background/40 px-3 py-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GitBranchIcon className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {isFramework ? 'monorepo root' : (app.remote_url || 'local-only (no remote)')}
              </span>
            </div>
            {status && (
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {branch && <span className="font-mono">{branch}</span>}
                <span className={isDirty ? 'text-amber-400' : 'text-green-500'}>
                  {isDirty ? `${dirtyCount} dirty` : 'clean'}
                </span>
                {hasRemote && (
                  <>
                    <span className={ahead > 0 ? 'text-blue-400' : ''}>↑{ahead}</span>
                    <span className={behind > 0 ? 'text-yellow-400' : ''}>↓{behind}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2 pt-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1">
            {!app.installed && !isFramework && (
              <Link
                onClick={() => action(app.name, 'install')}
                variant="primeblue"
              >
                <FolderDownIcon className="mr-1 h-4 w-4" /> Install
              </Link>
            )}
            {(app.installed || isFramework) && needsUpdate && (
              <Link
                onClick={() => action(app.name, 'reinstall')}
                className={isRollback
                  ? 'bg-yellow-600 text-white hover:bg-yellow-600/80'
                  : 'bg-orange-500 text-white hover:bg-orange-500/80'}
                title={isRollback
                  ? `Rollback DB to ${app.version} (currently ${app.installed_version})`
                  : `Update DB to ${app.version} (currently ${app.installed_version})`}
              >
                {isRollback
                  ? <><RotateCcwIcon className="mr-1 h-4 w-4" /> Rollback</>
                  : <><RefreshCcwDotIcon className="mr-1 h-4 w-4" /> Update</>}
              </Link>
            )}
            {(app.installed || isFramework) && !needsUpdate && (
              <span className="inline-flex items-center gap-1 px-3 py-2 text-xs text-green-500">
                <CheckCircle2Icon className="h-4 w-4" /> Installed
              </span>
            )}

            {app.installed && (
              <Link
                onClick={() => !isFramework && action(app.name, 'uninstall')}
                variant="destructive"
                title={isFramework ? "Framework can't be uninstalled" : 'Uninstall'}
                className={isFramework ? 'pointer-events-none cursor-not-allowed opacity-30' : ''}
              >
                <Trash2Icon className="h-4 w-4" />
              </Link>
            )}
          </div>
          {app.installed && (
          <Link
            variant="outline"
            className="bg-secondary text-white hover:bg-secondary/80"
            to={`/desk/App/update?name=${app.name}`}
            title="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
          )}
        </div>

        {repoMode === 'full' && (
          <div className="flex items-center justify-between gap-1 border-t border-border/40 pt-2">
            <div className="flex items-center gap-1">
              <Link
                onClick={() => action(app.name, 'pull')}
                className="bg-blue-600 text-white hover:bg-blue-600/80"
                title={isFramework ? 'Pull framework from remote' : 'Pull from remote'}
              >
                <ArrowDownToLineIcon className="h-4 w-4" />
                {behind > 0 && <span className="ml-1 text-xs font-bold">{behind}</span>}
              </Link>
              <Link
                onClick={() => action(app.name, 'commit')}
                className="bg-emerald-700 text-white hover:bg-emerald-700/80"
                title={isFramework ? 'Commit framework changes' : 'Commit local changes'}
              >
                <GitCommitHorizontalIcon className="h-4 w-4" />
                {dirtyCount > 0 && <span className="ml-1 text-xs font-bold">{dirtyCount}</span>}
              </Link>
              <Link
                onClick={() => action(app.name, 'push')}
                className="bg-blue-600 text-white hover:bg-blue-600/80"
                title={isFramework ? 'Push framework to remote' : 'Push to remote'}
              >
                <ArrowUpFromLineIcon className="h-4 w-4" />
                {ahead > 0 && <span className="ml-1 text-xs font-bold">{ahead}</span>}
              </Link>
            </div>

            <Link
              onClick={() => action(app.name, 'discard', true)}
              variant="ghost"
              className="text-zinc-500 hover:bg-red-950/40 hover:text-red-400"
              title="Discard ALL local changes (destructive)"
            >
              <RotateCcwIcon className="h-4 w-4" />
            </Link>
          </div>
        )}

        {repoMode === 'local' && (
          <div className="flex items-center justify-between gap-1 border-t border-border/40 pt-2">
            <div className="flex items-center gap-1">
              <Link
                onClick={() => action(app.name, 'commit')}
                className="bg-emerald-700 text-white hover:bg-emerald-700/80"
                title="Commit local changes"
              >
                <GitCommitHorizontalIcon className="h-4 w-4" />
                {dirtyCount > 0 && <span className="ml-1 text-xs font-bold">{dirtyCount}</span>}
              </Link>
              <Link
                onClick={() => action(app.name, 'publish')}
                className="bg-violet-600 text-white hover:bg-violet-600/80"
                title="Connect to a remote and push existing history"
              >
                <CloudUploadIcon className="mr-1 h-4 w-4" /> Publish to remote
              </Link>
            </div>

            <Link
              onClick={() => action(app.name, 'discard', { wasInstalled: app.installed })}
              variant="ghost"
              className="text-zinc-500 hover:bg-red-950/40 hover:text-red-400"
              title="Discard ALL local changes (destructive)"
            >
              <RotateCcwIcon className="h-4 w-4" />
            </Link>
          </div>
        )}

        {repoMode === 'none' && (
          <div className="flex items-center gap-1 border-t border-border/40 pt-2">
            <Link
              onClick={() => action(app.name, 'publish')}
              className="bg-violet-600 text-white hover:bg-violet-600/80"
              title="Initialize git, link to a remote, and push the initial commit"
            >
              <CloudUploadIcon className="mr-1 h-4 w-4" /> Publish to remote
            </Link>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

export default class AppManagerView extends ListContext {
  onlyGrid = true;
  hasSearchForm = false;
  hasSelectAll = false;
  hasSelectRow = false;

  constructor(props) {
    super(props);
  }

  clone() {
    loopar.prompt({
      title: "Get App",
      label: "Enter the Github URL of the app you want to install",
      placeholder: "Github URL",
      ok: (gitRepo) => {
        loopar.api.post('App Manager', 'clone', { body: { git_repo: gitRepo } });
      },
      validate: (gitRepo) => {
        if (!gitRepo || gitRepo.length === 0) return loopar.throw("Please enter a valid Github URL");
        return true;
      },
    });
  }

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }

  setCustomActions() {
    super.setCustomActions();

    this.setCustomAction('addApp', <Link
      variant="secondary"
      className="bg-success text-white hover:bg-success/80"
      to="/desk/App/create"
    >
      <PlusIcon className="mr-2"/> Add App
    </Link>);

     this.setCustomAction('getApp', <Button
      variant="primeblue"
      onClick={(e) => {
        e.preventDefault();
        this.clone();
      }}
    >
      <DownloadIcon className="mr-2"/> Get App
    </Button>);
  }

  gridTemplate(app){
    return (
      <AppCard app={app} action={this.sendAppAction} />
    )
  }

  sendAppAction(appName, action, optsOrSlide = false) {
    const opts = typeof optsOrSlide === 'object' && optsOrSlide !== null
      ? optsOrSlide
      : { slide: optsOrSlide };
    const slide = !!opts.slide;
    const wasInstalled = !!opts.wasInstalled;
    const isFramework = appName === 'loopar';

    const GIT_VERBS = ['pull', 'push', 'commit', 'discard', 'publish'];
    const dispatch = (verb, body, ctx = {}) => {
      const result = loopar.call("App Manager", verb, body, {
        query: { app_name: appName },
      });
      if (!GIT_VERBS.includes(verb)) return;
      if (!result || typeof result.then !== 'function') return;

      result.then((response) => {
        const payload = (response && typeof response === 'object' && 'data' in response)
          ? response.data
          : response;
        if (payload && payload.success === false) return;

        setTimeout(() => loopar.refresh(), 600);
      }).catch(() => {

      });
    };

    if (action === 'commit') {
      return loopar.api.post('App Manager', 'diff', {
        body: { app_name: appName },
        query: { app_name: appName },
      }).then((res) => {
        const payload = (res && typeof res === 'object' && 'data' in res) ? res.data : res;
        if (payload && payload.success === false) {
          return loopar.confirm(
            `Couldn't read git status: ${payload.message || 'unknown error'}`,
            () => {}
          );
        }
        const diff = payload || {};
        const files = Array.isArray(diff.files) ? diff.files : [];

        if (files.length === 0) {
          return loopar.confirm(
            `Nothing to commit in ${isFramework ? 'monorepo' : appName}. Working tree is already clean.`,
            () => {}
          );
        }

        const MAX_ROWS = 30;
        const head = files.slice(0, MAX_ROWS).map((f) => {
          const status = `<span class='inline-block w-6 font-mono text-xs text-zinc-400'>${f.status || '?'}</span>`;
          const stats = (f.insertions || f.deletions)
            ? ` <span class='text-xs'><span class='text-green-500'>+${f.insertions}</span> <span class='text-red-500'>-${f.deletions}</span></span>`
            : '';
          return `<div class='font-mono text-xs leading-relaxed'>${status}${f.path}${stats}</div>`;
        }).join('');
        const more = files.length > MAX_ROWS
          ? `<div class='mt-1 text-xs italic text-zinc-500'>…and ${files.length - MAX_ROWS} more</div>`
          : '';

        const branchLine = diff.branch
          ? `<div class='mb-2 text-xs text-zinc-500'>on branch <strong>${diff.branch}</strong></div>`
          : '';
        const lastLine = (diff.recent_commits && diff.recent_commits[0])
          ? `<div class='mt-2 border-t border-zinc-700 pt-2 text-xs text-zinc-500'>Last commit: <code>${diff.recent_commits[0].sha}</code> ${diff.recent_commits[0].subject || ''}</div>`
          : '';

        const summary = `
          ${branchLine}
          <strong>${files.length} file${files.length === 1 ? '' : 's'} to commit:</strong>
          <div class='mt-2 max-h-64 overflow-y-auto rounded border border-zinc-800 bg-black/30 p-2'>${head}${more}</div>
          ${lastLine}
        `;

        loopar.dialog({
          type: "confirm",
          title: `Commit ${isFramework ? 'framework' : appName}`,
          content: summary,
          size: "lg",
        },  () => {
          loopar.prompt({
            title: `Commit ${isFramework ? 'framework' : appName}`,
            label: 'Commit message',
            placeholder: 'Describe your changes',
            ok: (message) => {
              dispatch('commit', { app_name: appName, message });
            },
            validate: (message) => {
              if (!message || message.trim().length === 0) {
                return loopar.throw('Commit message is required');
              }
              return true;
            },
          });
        });
      });
    }

    if (action === 'publish') {
      return loopar.prompt({
        title: `Publish ${appName} to remote`,
        label: 'Remote repository URL',
        placeholder: 'https://github.com/user/repo.git',
        ok: (remote_url) => {
          dispatch('publish', { app_name: appName, remote_url });
        },
        validate: (remote_url) => {
          if (!remote_url || remote_url.trim().length === 0) {
            return loopar.throw('Remote URL is required');
          }
          return true;
        },
      });
    }

    const confirmMessages = {
      uninstall: `<br/><br/><span class='fa fa-circle text-red pr-2'></span> <strong class='text-red'>All data and Documents related to ${appName} will be deleted.</strong>`,
      pull: isFramework
        ? `<span class='text-amber-500'>This pulls the whole framework. After completion the tenant must restart (nodemon will reload in dev) to apply changes. Local uncommitted changes anywhere in the monorepo will block this operation.</span>`
        : `<<span class='text-amber-500'>Local uncommitted changes in this app will block this operation. Commit, push, or <code>git reset --hard</code> first.</span>`,
      push: `<span class='text-amber-500'>Working tree must be clean and up-to-date with remote.</span>`,
      discard: `<strong class='text-red-500'>This is destructive and cannot be undone.</strong> All uncommitted changes${isFramework ? ' anywhere in the monorepo' : ` in apps/${appName}`} will be lost, and untracked files will be removed.`,
    };

    const verbs = {
      install: 'install',
      reinstall: 'reinstall',
      uninstall: 'uninstall',
      pull: 'pull from remote for',
      push: 'push to remote from',
      discard: 'DISCARD all local changes for',
    };

    const verb = verbs[action] || action;
    const trailing = confirmMessages[action] || '';

    loopar.confirm({
      title: `${titleize(action)} ${appName}?`,
      content: trailing,
      slide: slide,
      slideText: `Slide to ${action} ${appName}`,
      ok: () => {
        dispatch(action, { app_name: appName }, { wasInstalled });
      },
    });
  }
}
