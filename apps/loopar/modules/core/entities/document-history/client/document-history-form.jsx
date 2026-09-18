'use strict';

import { loopar } from 'loopar';

export const config = {
  canUpdate: false,
  hasHistory: false,
  overrides: {
    save() {
      loopar.notify("This version is read only.", "warning");
    },
  },
};

export { DefaultView as default } from '@loopar/document';
