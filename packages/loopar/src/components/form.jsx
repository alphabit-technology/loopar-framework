/*class Form extends HTML{
    constructor(props) {
        super(props);
        this.props['class'] = (this.props['class'] ? this.props['class']  + " " : "")  + 'element';

        return this.template().on("submit", (obj, event) => {
            event.preventDefault();
            let data = this.form_data(this.elements)
            console.log(data);
        });
    }

    template(){
        return super.tag("form");
    }
}

const form = (options) => {
    return new Form(options);
}*/