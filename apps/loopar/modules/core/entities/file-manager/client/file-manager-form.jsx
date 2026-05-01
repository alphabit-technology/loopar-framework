
'use strict';

import FormContext from '@context/form-context';

export default class FileManagerForm extends FormContext {
  readOnly = true;
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    super.componentDidMount();

    this.on("file_ref", "change", (e) => {
      const data = e.target?.value ? e.target?.value[0] || {} : {};

      this.name = data.name || "";
      this.extention = (data.name || "").split(".").pop();
      this.size = data.size || 0;
      this.type = data.type || "";
    });
  }
}