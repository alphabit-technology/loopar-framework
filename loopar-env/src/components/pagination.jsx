import DivComponent from "#div"

export default class PaginationClass extends DivComponent {
   className = "row align-items-center aside-footer p-2";
   style = { width: '100%' };
   constructor(props) {
      super(props);
   }

   get pagination() {
      return this.props.pagination;
   }

   getPages() {
      const { page, totalPages } = this.pagination;
      const maxPagesToShow = 5;
      const pages = [];

      if (totalPages <= maxPagesToShow) {
         return new Array(totalPages).fill().map((_, i) => i + 1);
      } else {
         const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2);
         let startPage = page - halfMaxPagesToShow;
         let endPage = page + halfMaxPagesToShow;

         if (startPage <= 0) {
            endPage = maxPagesToShow;
            startPage = 1;
         } else if (endPage > totalPages) {
            endPage = totalPages;
            startPage = totalPages - maxPagesToShow + 1;
         }

         if (startPage > 1) {
            pages.push(1);
            startPage > 2 && pages.push('...');
         }

         for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
         }

         if (endPage < totalPages) {
            endPage < totalPages - 1 && pages.push('...');
            pages.push(totalPages);
         }

         return pages;
      }
   }

   render() {
      const { page, pageSize, totalRecords, totalPages } = this.pagination;

      const initial = (page - 1) * pageSize + 1;
      const final = (page * pageSize) > totalRecords ? totalRecords : (page * pageSize);

      return super.render(
         <>
            <div className="col-sm-12 col-md-5">
               <div className="dataTables_info">
                  Showing {initial} to {final} of {totalRecords} entries
               </div>
            </div>
            <div className="col-sm-12 col-md-7 d-flex justify-content-end">
               <div className="dataTables_paginate paging_simple_numbers">
                  <ul className="pagination justify-content-center" style={{ paddingTop: 15 }}>
                     <li className={`paginate_button page-item previous ${totalPages <= 1 || page === 1 ? 'disabled' : ''}`}>
                        <a className="page-link" onClick={() => { this.setPage(page - 1) }}>
                           <i className="fa fa-lg fa-angle-left"></i>
                        </a>
                     </li>
                     {this.getPages().map(p => {

                        return (
                           <li className={`paginate_button page-item ${p === page ? 'active' : ''}`}>
                              <a className="page-link" onClick={() => { p !== '...' && this.setPage(p) }}>{p}</a>
                           </li>
                        )
                     })}
                     <li className={`paginate_button page-item previous ${page >= totalPages || totalPages <= 1 ? 'disabled' : ''}`}>
                        <a className="page-link" onClick={() => { this.setPage(page + 1) }}>
                           <i className="fa fa-lg fa-angle-right"></i>
                        </a>
                     </li>
                  </ul>
               </div>
            </div>
         </>
      )
   }

   setPage(page) {
      this.props.app.setPage(page);
   }
}

export const Pagination = (props, content) => {
   return React.createElement(PaginationClass, props, content);
}