
'use strict';

import FormContext from "@context/form-context"
import { loopar } from "loopar";
import fileManager from "@global/file-manager.js";

const UserInfo = ({user}) => {
  const profile_picture = fileManager.getImage({image: user.profile_picture}, "image")

  return (
    <div className="flex flex-col items-center gap-3 pb-5 border-b border-border/40 mb-4 p-4">
      <div className="relative size-[150px] rounded-full bg-purple-200 flex items-center justify-center text-2xl font-medium text-purple-800">
        {loopar.utils.avatarLetter(user.name)} 
        <img src={profile_picture} className="absolute w-full h-full"/>
        {/* <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-background border border-border/60 flex items-center justify-center cursor-pointer">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </div> */}
      </div>
  
      <div className="text-center">
        <div className="text-sm font-medium">{user.name || 'User'}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{user.user_type || 'Web'}</div>
      </div>
  
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-teal-500" />
        <span className="text-xs text-teal-700">Active</span>
      </div>
    </div>
  )
}

export default class ProfileForm extends FormContext {
  canUpdate = false;
  hasHeader = false;
  constructor(props){
    super(props);
  }

  render(){
    const {Document} = this.props;
    
    return super.render(null, {
      user_info: () => (
        <UserInfo user={Document.data}/>
      )
    })
  }
}