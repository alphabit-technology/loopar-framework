'use strict';

import AuthContext from '@context/auth-context';
import { loopar } from 'loopar';
import { useEffect, useState } from "react";
import { Clock, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { useWorkspace } from '@workspace/workspace-provider';
import {Link} from "@link"

const TokenError = ({ type }) => {
  const isExpired = type === "expired";

  return (
    <div className="flex flex-col items-start gap-3 p-7">
      <span className={`text-xs font-medium px-2 py-1 rounded ${
        isExpired
          ? "bg-amber-100 text-amber-700"
          : "bg-red-100 text-red-700"
      }`}>
        {isExpired ? "Link expired" : "Invalid link"}
      </span>

      <p className="text-base font-medium  leading-snug">
        {isExpired
          ? "This link is no longer valid"
          : "We couldn't verify this link"
        }
      </p>

      <p className="text-sm text-gray-500 leading-relaxed">
        {isExpired
          ? "Password reset links expire after 30 minutes for security reasons. Request a new one and use it right away."
          : "This link may have already been used or is malformed. Request a new one if you need to recover your account."
        }
      </p>

      <hr className="w-full border-t border-gray-200" />
      <Link
        variant="destructive"
        className="w-full gap1"
        to="/auth/recoveryPassword" 
        notControlled
      >
        <ArrowRight size={13} /> Request a new link
      </Link>
      <Link
        className="w-full gap-1"
        variant="ghost"
        to="/auth/login" 
        notControlled
      >
        <ArrowRight size={13} /> Back to login
      </Link>
    </div>
  );
};

const ResetPassword = ({ children }) => {
  const [status, setStatus] = useState("loading"); // loading | valid | expired | invalid
  const {navigate} = useWorkspace()

  useEffect(() => {
    const checkToken = async () => {
      const token = new URLSearchParams(window.location.search).get("token");

      if (!token) {
        window.location.href = "/auth/recoveryPasswordRequest";
        return;
      }

      const res = await loopar.api.get("Auth", "validateResetToken", { query: { token } });

      setStatus(res.valid ? "valid" : res.reason);
    };

    checkToken();
  }, []);

  if (status === "loading") return null;
  if (status === "expired") return <TokenError type="expired" />;
  if (status === "invalid") return <TokenError type="invalid" />;

  return children;
};

export default class ResetPasswordForm extends AuthContext {
  constructor(props) {
    super(props);
  }

  get Document(){
    const token = new URLSearchParams(global?.location?.search).get("token");
    return {
      ...super.Document,
      data: {
        ...super.Document?.data,
        token
      }
    }
  }

  render() {
    return (
      <ResetPassword>
        {super.render()}
      </ResetPassword>
    );
  }
}