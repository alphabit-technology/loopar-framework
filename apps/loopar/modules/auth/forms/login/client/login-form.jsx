'use strict';

import React, {useImperativeHandle, useEffect} from 'react';
import AuthContext from '@context/auth-context';
import {useNavigate} from 'react-router';

function Login(props){
  const {children, ref} = props;
  const navigate = useNavigate();
  const afterLogin = async () => {
    navigate('/desk/Desk/view', {replace: true});
    window.location.reload();
  };

  useImperativeHandle(ref, () => ({
    afterLogin: afterLogin
  }));

  useEffect(() => {
    navigate('/auth/login', {replace: true});
  }, []);

  return children
}

export default class LoginForm extends AuthContext {
  controller = "Auth";

  constructor(props) {
    super(props);
    this.afterLogin = React.createRef();
  }

  async login() {
    await this.send({
      action: 'login',
      error: () => {
        setTimeout(() => {
          this.setError("user_name", { message: "Invalid user name or password" });
          this.setError("password", { message: "Invalid user name or password" });
        }, 10);
      },
      success: () => {
        this.afterLogin.current.afterLogin();
      }
    });
  }

  getFormValues() {
    return {
      user_name: this.user_name,
      password: this.password,
    }
  }

  render() {
    return (
    
      <Login ref={this.afterLogin}>{super.render()}</Login>
    )
  }

  /* makeEvents() {
    super.makeEvents();

    this.formFields.user_name.on('keyUp', e => {
      if (e.keyCode == 13) {
        if (e.target.value.length == 0) {
          this.formFields.password.focus();
        } else if (this.formFields.password.val().length == 0) {
          this.formFields.password.focus();
        } else {
          this.login();
        }
      }
    });

    this.formFields.password.on('keyUp', e => {
      if (e.keyCode == 13) {
        if (e.target.value.length == 0 || this.formFields.user_name.val().length == 0) {
          this.formFields.user_name.focus();
        } else {
          this.login();
        }
      }
    });
  } */
}