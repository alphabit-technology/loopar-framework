import BaseTextBlock from "$base-textblock";
import {Card, CardHeader, CardContent, CardDescription} from "@card";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import loopar from "$loopar";
import { v4 as uuidv4 } from "uuid";

export default class TextBlockIcon extends BaseTextBlock {
  droppable = false;
  className = "card shadow";
  dontHaveBackground = true;

  render() {
    const data = this.props.data || {};
    const { label = "Text Block", text } = data;

    return (
      <>
        <Card>
          <CardHeader>
            <CardDescription className="justify-left flex gap-3">
              <Avatar className={`rounded-3 h-14 w-14 bg-slate-300 dark:bg-slate-800`}>
                <AvatarFallback className={`bg-transparent text-2xl font-bold`}>{loopar.utils.avatar(label)}</AvatarFallback>
              </Avatar>
              <p>
                <h4 className="text-2xl break-all">{label}</h4>
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h6 className='text-slate-500 dark:text-slate-400 text-pretty'>{text}</h6>
          </CardContent>
        </Card>
      </>
    )
    return super.render(
      <>
        <div className="card shadow">
          <div className="card-body p-4">
            <div className="d-sm-flex align-items-start text-center text-sm-left">
              <img
                src={((this.getSrc() || [])[0] || {}).src}
                className="mr-sm-4 mb-3 mb-sm-0"
                width="72"
              />
              <div className="flex-fill">
                <h3 className="mt-0">{label}</h3>
                <p className="text-muted font-size-lg">{text}</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
