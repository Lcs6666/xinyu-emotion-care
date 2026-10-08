"use client";

import { FormEvent, useState } from "react";

export default function FeedbackForm() {
  const [category, setCategory] = useState("产品建议");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function submit(event: FormEvent) {
    event.preventDefault(); setState("sending");
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ category, message }) });
      if (!response.ok) { setState("error"); return; }
      setMessage(""); setState("done");
    } catch {
      setState("error");
    }
  }
  return <form className="feedback-form" onSubmit={submit}><label>反馈类型<select value={category} onChange={(e) => setCategory(e.target.value)}><option>产品建议</option><option>功能问题</option><option>内容反馈</option><option>其他</option></select></label><label>你的建议<textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="例如：希望月视图可以按情绪筛选……" minLength={2} maxLength={2000} required /></label><button type="submit" disabled={state === "sending"}>{state === "sending" ? "提交中…" : "提交反馈"}</button>{state === "done" && <div className="feedback-success"><p className="success">谢谢你的建议，我们已经收到啦。</p><a className="primary-link" href="/" target="_top">返回心屿</a></div>}{state === "error" && <p className="error">提交失败，请稍后再试。</p>}</form>;
}
