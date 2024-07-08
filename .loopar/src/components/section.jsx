import Component from "$component";
import {Droppable} from "$droppable";

export default class Section extends Component {
  render() {
    return (
      <div className="container">
        <section className="mx-auto flex max-w-[1280px] flex-row gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20">
          <Droppable
            {...this.props}
            className="flex-1"
          />
        </section>
      </div>
    );
  }
}
