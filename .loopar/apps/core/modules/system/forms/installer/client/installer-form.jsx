import InstallerContext from '@context/installer-context';

export default class InstallerForm extends InstallerContext {
   constructor(props) {
      super(props);
   }

   async install() {
      this.send({action: "install", params: {app_name: "loopar"}});
   }
}
