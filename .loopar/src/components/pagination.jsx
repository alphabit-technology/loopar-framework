import DivComponent from "$div";
import {Button} from "@/components/ui/button";
import {Link} from "@link";

export default class PaginationClass extends DivComponent {
  className = "row align-items-center aside-footer p-2";
  style = { width: "100%" };

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
        startPage > 2 && pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages) {
        endPage < totalPages - 1 && pages.push("...");
        pages.push(totalPages);
      }

      return pages;
    }
  }

  render() {
    const { page, pageSize, totalRecords, totalPages } = this.pagination;

    const initial = (page - 1) * pageSize + 1;
    const final =
      page * pageSize > totalRecords ? totalRecords : page * pageSize;

    return (
      <div className="flex-col-2 justify-content flex flex-row border bg-slate-100/80 py-2 pr-2 dark:bg-slate-900/60">
        <div className="w-full p-3 pt-4">
            Showing {initial} to {final} of {totalRecords} entries
        </div>
        <div className="w-full">
            <ul
              className="flex flex-row justify-end gap-1"
            >
              <li
                className={`paginate_button page-item previous ${
                  totalPages <= 1 || page === 1 ? "disabled" : ""
                }`}
              >
                <a
                  className="page-link"
                  onClick={() => {
                    this.setPage(page - 1);
                  }}
                >
                  <i className="fa fa-lg fa-angle-left"></i>
                </a>
              </li>
              {this.getPages().map((p) => {
                return (
                  <Button 
                    onClick={() => p !== "..." && this.setPage(p)} 
                    variant={p === page ? "destructive" : "secondary"}
                  >{p}</Button>
                  /*<Button
                    className={`page-link ${
                      p === page ? "bg-slate-950/60" : ""
                    }`}
                    variant="secondary"
                    onClick={() => {
                      p !== "..." && this.setPage(p);
                    }}
                  />*/
                  /*<li
                    className={`paginate_button page-item w-15 btn bg-slate-800/80  ${
                      p === page ? "bg-slate-950/60" : ""
                    }`}
                    onClick={() => {
                        p !== "..." && this.setPage(p);
                      }}
                  >
                    <a
                      className="page-link"
                      onClick={() => {
                        p !== "..." && this.setPage(p);
                      }}
                    >
                      {p}
                    </a>
                  </li>*/
                );
              })}
              <li
                className={`paginate_button page-item previous ${
                  page >= totalPages || totalPages <= 1 ? "disabled" : ""
                }`}
              >
                <a
                  className="page-link"
                  onClick={() => {
                    this.setPage(page + 1);
                  }}
                >
                  <i className="fa fa-lg fa-angle-right"></i>
                </a>
              </li>
            </ul>
        </div>
      </div>
    );
  }

  setPage(page) {
    this.props.app.setPage(page);
  }
}

/*export const Pagination = (props, content) => {
  return React.createElement(PaginationClass, props, content);
};
*/