import MetaComponent from "@meta-component";
import { FormWrapper } from "@context/form-context";
import BaseForm from "@context/base/base-form";

export default class InstallerContext extends BaseForm {
  notRequireChanges = true;
  constructor(options) {
    super(options);
  }

  render(content = []) {
    const meta = this.props.meta;

    return super.render([
      <FormWrapper meta={meta} docRef={this}>
        <MetaComponent elements={JSON.parse(meta.__ENTITY__.doc_structure)} parent={this} />
        {content}
      </FormWrapper>
    ]);

    return super.render([
      ...this.props.__ENTITY__.STRUCTURE.map(el => {
        if (el.data.hidden) return null;
        return Element(el.element,
          {
            docRef: this,
            meta: {
              ...el,
            },
            //...(el.data.action ? {onClick: () => this.send({action: el.data.action})} : {}),
          }
        )
      })
    ]);
  }

  async install() {
    await this.send({ action: "install" });
  }

  async connect() {
    await this.send({ action: "connect" });
  }
}