import Link from "next/link";
import { chatGPTSignInPath, getChatGPTUser } from "../chatgpt-auth";
import FeedbackForm from "./feedback-form";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const user = await getChatGPTUser();
  if (!user) {
    return <main className="feedback-page"><section className="feedback-card"><h1>欢迎给我们提出建议</h1><p>登录后即可提交反馈。</p><a className="primary-link" href={chatGPTSignInPath("/feedback")} target="_top">登录并继续</a></section></main>;
  }
  return <main className="feedback-page"><section className="feedback-card"><Link className="back-link" href="/">← 返回心屿</Link><p className="eyebrow">一起把心屿变得更好</p><h1>欢迎给我们提出建议</h1><p>无论是想要的新功能、使用中遇到的问题，还是一句感受，我们都会认真阅读。</p><FeedbackForm /></section></main>;
}
