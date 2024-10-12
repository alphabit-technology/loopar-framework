import React from "react";
import BaseWorkspace from "$workspace/base/base-workspace";
import {Link} from "@link"
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import { useWorkspace } from "@workspace/workspace-provider";

const Layout = (({ ...props }) => {
  useEffect(() => {
    particlesJS.load('particles-js', '/demo/particles.json', function() {
      console.log('callback - particles.js config loaded');
    });
  }, []);

  return (
    <div className="absolute h-full w-full">
      <section
        className="flex h-full"
      >
        <div
          className={`p-5 sm:p-10 w-full lg:w-[524px] ease-induration-100 overflow-auto duration-100 ease-in`}
        >
          <div className="mb-4 w-full grid  place-items-center">
            <div className="mb-3">
              <img
                src="/assets/images/logo.svg"
                alt="My Happy SVG"
                style={{ height: 28, width: 140 }}
              />
            </div>
            <h1 className="h3">Sing In</h1>
          </div>
          {props.children}
        </div>
        <div className="w-full hidden lg:block">
          <div 
            id="particles-js" 
            className="particles-js w-full h-full bg-cover bg-center bg-no-repeat bg-fixed bg-gray-100 dark:bg-gray-800  overflow-auto duration-100 ease-in"
            style={{
              "background-image": "url(/assets/images/illustration/builder.svg)"
            }}
          >
            <div className="absolute p-10 sm:p-20">
              <h2 className="text-4xl text-slate-800 dark:text-slate-100 font-bold">Building the Automated Future</h2>
              <Link variant="ghost" className="text-lg" _target="_blank" to="https://github.com/alphabit-technology/loopar-framework">
                <ArrowRightIcon className="mr-2"/>
                Visit the Documentation
              </Link>
            </div>
            <script src="/particles.js" sync="true" defer="true" />
          </div>
        </div>
      </section>
    </div>
  );
});

export default function AuthWorkspace(props) {
  const { getDocuments } = useWorkspace();

  return (
    <BaseWorkspace>
      <Layout {...props}>
        {/*--//authworkspace-outlet--*/}
        {getDocuments()}
      </Layout>
    </BaseWorkspace>
  )
}