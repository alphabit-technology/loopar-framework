
'use strict';

import PageContext from '@context/page-context';

export default class PageViewerPage extends PageContext {
    constructor(props){
        super(props);
    }

    initScroll() {
      if (this.props.inModal) return;
      window.scrollTo(0, 0);
    }
  
    setScrollPosition() {}
}