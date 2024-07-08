import Component from "$component";
import loopar from "$loopar";
import React from "react";
import {Pagination} from "$pagination";

export default class DocumentHistory extends Component {
  blockComponent = true;
  className = "card card-fluid";

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      collapsed: this.getStatusCollapsable(),
      history: [],
    };
  }

  async getHistory() {
    const data = await loopar.method("Document History", "history", {
      documentName: this.props.document,
      documentId: this.props.document_id,
      page: this.currentPage || 1,
    });

    this.setState({
      history: data.meta.rows,
      pagination: data.meta.pagination,
    });
  }

  async search() {
    await this.getHistory();
  }

  get pagination() {
    return this.state.pagination || {};
  }

  componentDidMount() {
    this.getHistory();
  }

  setPage(page) {
    this.currentPage = page;
    this.search();
  }

  render() {
    const data = {
      label: "History",
    };

    super.render(
      <>
        <div className="card-header">
          <h6>
            <a
              className="btn btn-reset"
              onClick={() => {
                this.toggleHide();
              }}
            >
              <span className="mr-2">{data.label}</span>
              <span className="collapse-icon ml-2">
                <i
                  className={`fas fa-chevron-${
                    this.state.collapsed ? "down" : "up"
                  }`}
                  onClick={() => {
                    this.toggleHide();
                  }}
                />
              </span>
            </a>
          </h6>
        </div>
        <div
          ref={(el) => (this.container = el)}
          className={`card-body collapse show element sub-element ${
            this.props.bodyClassName || ""
          }`}
          style={this.state.collapsed ? { display: "none" } : {}}
        >
          <ul className="timeline">
            {this.state.history.map((row, key) => {
              const icon =
                row.action === "Created"
                  ? "fa-plus"
                  : row.action === "Updated"
                  ? "fa-edit"
                  : "fa-trash";
              return (
                <li className="timeline-item" key={key}>
                  <div className="timeline-figure">
                    <span className="tile tile-circle tile-sm">
                      <i className={`fa ${icon} fa-lg`} />
                    </span>
                  </div>
                  <div className="timeline-body">
                    <div className="media">
                      <div className="media-body">
                        <h6 className="timeline-heading">
                          <a href="#" className="text-link">
                            {row.user}
                          </a>
                          {" " + row.action}
                        </h6>
                        <p className="timeline-date d-sm-none">{row.date}</p>
                      </div>
                      <div className="d-sm-block">
                        <span className="timeline-date">{row.date}</span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pagination
            pagination={this.pagination}
            app={this}
          />
        </div>
      </>
    );
  }

  getStatusCollapsable() {
    const { document, document_id } = this.props;
    const collapsed = localStorage.getItem(`${document}${document_id}`);
    return collapsed === null ? true : collapsed === "true";
  }

  toggleHide() {
    const { document, document_id } = this.props;
    const collapsed = this.getStatusCollapsable();

    localStorage.setItem(`${document}${document_id}`, !collapsed);

    this.setState({
      collapsed: !collapsed,
    });
  }
}
