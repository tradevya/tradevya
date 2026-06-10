"use client";

import { useEffect } from "react";

export function PostDetailBackGuard() {
  useEffect(() => {
    window.history.pushState(window.history.state, "", window.location.href);

    function handlePopState() {
      window.location.replace("/dashboard");
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
}
