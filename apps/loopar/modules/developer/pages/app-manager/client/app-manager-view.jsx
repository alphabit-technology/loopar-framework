'use strict';

import ListContext from '@context/list-context'
import loopar from "loopar";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter} from '@card';
import {
  Avatar,
  AvatarFallback
} from "@cn/components/ui/avatar"

import {Badge} from "@cn/components/ui/badge";
import {Link} from "@link"
import {Button} from "@cn/components/ui/button";
import { PlusIcon, DownloadIcon, RefreshCcwDotIcon, FolderDownIcon, FolderUp, CheckCircle2Icon, PencilIcon } from 'lucide-react';
function AppCard({app, action}) {
  const color = loopar.bgColor(app.name);
  
  return (
    <div>
      <Card className="w-full min-w-[300px] p-2">
        <CardHeader>
          <CardTitle>{app.name}</CardTitle>
          <CardDescription>
            <Badge
              className={`${app.installed ? 'bg-success' : 'bg-danger'} text-white`}
            />
            {app.info}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="justify-left flex gap-3">
            <Avatar className={`rounded-3 h-14 w-14`} style={{ backgroundColor: color }}>
              <AvatarFallback className={`bg-transparent text-2xl font-bold`}>{loopar.utils.avatar(app.name)}</AvatarFallback>
            </Avatar>
            <div>
              <h4>Autor: {app.autor}</h4>
              <h6 className='font-bold text-slate-500 dark:text-slate-400'>App Version: {app.version}</h6>
              <h6 className='font-bold text-slate-500 dark:text-slate-400'>Installed Version: {app.installed_version}</h6>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Link
              to={!app.installed ? 'install' : 'reinstall'}
              ///variant={app.installed && app.installed_version === app.version ? "secondary" : "primary"}
              disabled={app.installed && app.installed_version === app.version}
              onClick={() => action(app.name, !app.installed ? 'install' : 'reinstall')}
              className={app.installed_version !== app.version ? 'bg-orange-500' : 'bg-secondary'}
            >
              {!app.installed ? (
                <><FolderDownIcon className="mr-2"/> Install</>
              ) : (
                app.installed_version !== app.version ? <><RefreshCcwDotIcon className="mr-2"/> Update</> :
                <><CheckCircle2Icon className="mr-2"/> Installed</>
              )}
            </Link>
          </div>
          <div className='flex justify-end gap-1'>
            {app.installed && (
              <>
                <Link
                  to="uninstall"
                  variant="destructive"
                  onClick={() => action(app.name, 'uninstall')}
                >
                  <FolderUp/>
                </Link>
                <Link
                  variant="outline"
                  className="bg-secondary text-white hover:bg-secondary/80"
                  to={`/desk/App/update?name=${app.name}`}
                >
                  <PencilIcon/>
                </Link>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
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

  sendAppAction(appName, action) {
    const deleteMessage = action === "uninstall" ? `<br/><br/><span class='fa fa-circle text-red pr-2'></span> <strong class='text-red'>All data and Documents related to ${appName} will be deleted.</strong>` : '';
    loopar.confirm(`Are you sure you want to ${action} ${appName}?${deleteMessage}`, () => {
      // App Manager extends SystemController and overrides redirect() to
      // default to /desk/App Manager/view, so post-install/uninstall lands
      // back on the manager. Routing through "System" directly would lose
      // that override.
      loopar.call("App Manager", action, { app_name: appName }, {
        query: { app_name: appName },
      });
    });
  }
}