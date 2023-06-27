import {image, div, h2, p, a, i} from "../elements.js";
import BaseTextBlock from "../base/base-text-block.js";

export default class BannerImage extends BaseTextBlock {
   className = "py-5";
   defaultDescription = "This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.";
   style = {
      height: "80vh"
   };
   constructor(props){
      super(props);
   }

   render(){
      const {label, description, action} = this.data;
      const children = this.state.children;

      return super.render([
         div({className: "container container-fluid-xl"}, [
            div({className: "row align-items-center"}, [
               div({className: "col-12 col-md-6 order-md-2 aos-init aos-animate", "data-aos": "fade-left"}, [
                  image({
                     className: "img-fluid img-float-md-6 mb-5 mb-md-0", src: action, alt: ""
                  })
               ]),
               div({className: "col-12 col-md-6 order-md-1 aos-init aos-animate", "data-aos": "fade-in"}, [
                  div({className: "col-fix pl-xl-3 ml-auto text-center text-sm-left"}, [
                     h2({className: "display-4 enable-responsive-font-size mb-4"}, [
                        label || "Jumbo heading"
                     ]),
                     p({className: "lead text-muted mb-5"}, [
                        description
                     ]),
                     a({href: "index.html", className: "btn btn-lg btn-primary d-block d-sm-inline-block mr-sm-2 my-3 aos-init aos-animate", "data-aos": "zoom-in", "data-aos-delay": "200"}, [
                        "Let's Try ",
                        i({className: "fa fa-angle-right ml-2"})
                     ]),
                     a({href: "/docs", className: "btn btn-lg btn-subtle-primary d-block d-sm-inline-block my-3 aos-init aos-animate", target: "_blank", "data-aos": "zoom-in", "data-aos-delay": "300"}, [
                        "Documentation"
                     ])
                  ])
               ])
            ])
         ])

         /*`<div class="container container-fluid-xl">
          <!-- .row -->
          <div class="row align-items-center">
            <!-- .col-md-6 -->
            <div class="col-12 col-md-6 order-md-2 aos-init aos-animate" data-aos="fade-left">
              <img class="img-fluid img-float-md-6 mb-5 mb-md-0" src="assets/images/illustration/launch.svg" alt="">
            </div><!-- /.col-md-6 -->
            <!-- .col-md-6 -->
            <div class="col-12 col-md-6 order-md-1 aos-init aos-animate" data-aos="fade-in">
              <div class="col-fix pl-xl-3 ml-auto text-center text-sm-left">
                <h1 class="display-4 enable-responsive-font-size mb-4"> Thanks for <strong>give me a try</strong>. I'm the <strong>theme</strong> for your <strong>project</strong>! </h1>
                <p class="lead text-muted mb-5"> Build rich and beautiful experiences for your project. Increase your productivity and grow your business. </p>
                <a href="index.html" class="btn btn-lg btn-primary d-block d-sm-inline-block mr-sm-2 my-3 aos-init aos-animate" data-aos="zoom-in" data-aos-delay="200">Let's Try <i class="fa fa-angle-right ml-2"></i></a>
                <a href="/docs" class="btn btn-lg btn-subtle-primary d-block d-sm-inline-block my-3 aos-init aos-animate" target="_blank" data-aos="zoom-in" data-aos-delay="300">Documentation</a>
              </div>
            </div><!-- /.col-md-6 -->
          </div><!-- /.row -->
        </div>`*/
      ])
   }
}