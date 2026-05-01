
'use strict';

import {PageController} from 'loopar';

export default class DeskController extends PageController {
  static freeActions = ['view']; 
  constructor(props){
    super(props);
  }
}