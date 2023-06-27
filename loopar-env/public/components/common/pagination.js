import Div from "/components/elements/div.js";
import { div, ul, li, a, i} from "/components/elements.js";

export class PaginationClass extends Div {
   className = "row align-items-center aside-footer p-2";
   style = {width: '100%'};
   constructor(props) {
      super(props);

      this.state = {
         pagination : this.props.pagination
      }
   }

   get pagination() {
      return this.props.pagination;
   }

   getPages(){
      const {page, total_pages} = this.pagination;
      const max_pages_to_show = 5;
      const pages = [];

      if (total_pages <= max_pages_to_show) {
         return new Array(total_pages).fill().map(( _, i) => i + 1);
      } else {
         const half_max_pages_to_show = Math.floor(max_pages_to_show / 2);
         let start_page = page - half_max_pages_to_show;
         let end_page = page + half_max_pages_to_show;

         if (start_page < 1) {
            end_page += Math.abs(start_page) + 1;
            start_page = 1;
         }

         if (end_page > total_pages) {
            start_page -= end_page - total_pages;
            end_page = total_pages;
         }

         for (let i = start_page; i <= end_page; i++) {
            pages.push(i);
         }

         if (start_page > half_max_pages_to_show) {
            pages.unshift('...');
            pages.unshift(1);
         } else if (start_page === half_max_pages_to_show) {
            pages.unshift(1);
         }

         if (end_page < total_pages - half_max_pages_to_show) {
            pages.push('...');
            pages.push(total_pages);
         } else if (end_page === total_pages - half_max_pages_to_show) {
            pages.push(total_pages);
         }
      }

      return pages;
   }

   render() {
      const {page, page_size, total_records, total_pages} = this.pagination;

      const initial = (page - 1) * page_size + 1;
      const final = (page * page_size) > total_records ? total_records : (page * page_size);

      return super.render([
         div({className: 'col-sm-12 col-md-5'}, [
            div({className: 'dataTables_info'}, [
               `Showing ${initial} to ${final} of ${total_records} entries`
            ])
         ]),
         div({className: 'col-sm-12 col-md-7 d-flex justify-content-end'}, [
            div({className: 'dataTables_paginate paging_simple_numbers'}, [
               ul({className: 'pagination justify-content-center', style: {paddingTop: 15}}, [
                  li({className: `paginate_button page-item previous ${total_pages <= 1 || page === 1 ? 'disabled' : '' }`}, [
                     a({className: 'page-link', onClick: () => {this.setPage(page-1)}}, [
                        i({className: "fa fa-lg fa-angle-left"})
                     ])
                  ]),
                  this.getPages().map(p => {
                     return li({className: `paginate_button page-item ${p === page ? 'active' : ''}`}, [
                        a({className: 'page-link', onClick: () => {p !== '...' && this.setPage(p)}}, p)
                     ])
                  }),
                  li({className: `paginate_button page-item previous ${page >= total_pages || total_pages <= 1 ? 'disabled' : ''}`}, [
                     a({className: 'page-link', onClick: () => {this.setPage(page + 1)}}, [
                        i({className: "fa fa-lg fa-angle-right"})
                     ])
                  ])
               ])
            ])
         ])

      ]);
   }

   setPage(page) {
      this.props.app.setPage(page);
   }
}

export const Pagination = (props, content) => {
   return React.createElement(PaginationClass, props, content);
}