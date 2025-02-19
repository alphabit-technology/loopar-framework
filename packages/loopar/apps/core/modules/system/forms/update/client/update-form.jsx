import InstallerContext from '@context/installer-context';

export default class InstallerForm extends InstallerContext {
   constructor(props) {
      super(props);
   }

   async update() {
      this.send({action: "update", params: {app_name: "loopar"}});
   }
}
