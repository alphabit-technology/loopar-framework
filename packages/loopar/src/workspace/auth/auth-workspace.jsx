import React from "react";
import BaseWorkspace from "@workspace/base/base-workspace";
import {Link} from "@link"
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useWorkspace } from "@workspace/workspace-provider";
import Particles from "@particles";

const Layout = (({ ...props }) => {
  return (
    <div className="vaul-drawer-wrapper flex flex-col min-h-screen">
      <meta name="robots" content="noindex, nofollow"/>
      <section
        className="flex-grow flex"
      >
        <div
          className={`p-5 sm:p-10 w-full lg:w-[524px] ease-induration-100 overflow-auto duration-100 ease-in relative z-10 h-screen bg-background/70`}
        >
          <div className="flex flex-col w-full h-full">
            <div className="mb-4 w-full grid  place-items-center">
              <div className="mb-3">
                <img
                  src="/assets/public/images/loopar.svg"
                  alt="loopar"
                  style={{ height: 28, width: 140 }}
                />
              </div>
            </div>
            <div className="flex-grow rounded-lg">
              {props.children}
            </div>
          </div>
        </div>
        <div className="w-full flex-col hidden lg:flex">
          <Particles 
            fullScreen={true} 
            className="absolute w-full h-dvh bg-cover bg-center bg-no-repeat bg-fixed overflow-auto duration-100 ease-in bg-purple-900/5 z-0"
            data={{
              "particles_settings": JSON.stringify({
                "particles.number.value":6,
                "particles.shape.type":"edge",
                "particles.opacity.value.max":0.31,
                "particles.size.value.min":10,
                "particles.size.value.max":1000,
                "particles.color.value":"#433271",
                "particles.move.enable":true,
                "particles.move.speed.min":1,
                "particles.move.speed.max":3,
                "particles.move.random":true,
                "particles.links.enable":false,
              }),
              key: "authparticlessettings"
            }}
          >
            <div className="relative p-10 sm:p-20 ">
              <h2 className="text-4xl text-slate-800 dark:text-slate-100 font-bold">Building the Automated Future</h2>
              <Link variant="ghost" className="text-lg" _target="_blank" to="https://loopar.build/Doc">
                <ArrowRightIcon className="mr-2"/>
                Visit the Documentation
              </Link>
            </div>
          </Particles>
        </div>
      </section>
    </div>
  );
});

export default function AuthWorkspace(props) {
  const { __DOCUMENTS__ } = useWorkspace();

  return (
    <BaseWorkspace>
      <Layout {...props}>
        {__DOCUMENTS__}
      </Layout>
    </BaseWorkspace>
  )
}