import { getCurrentUser } from "../auth";
import FeedbackForm from "./feedback-form";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const user = await getCurrentUser();
  if (!user) return <main className="feedback-page"><section className="feedback-card"><h1>欢迎给我们提出建议</h1><p>请先创建匿名账号或登录，再提交反馈。</p><a className="primary-link" href="/" target="_top">返回登录</a></section></main>;
  return <main className="feedback-page"><section className="feedback-card"><a className="back-link" href="/" target="_top">← 返回心屿</a><p className="eyebrow">一起把心屿变得更好</p><h1>欢迎给我们提出建议</h1><p>无论是想要的新功能、使用中遇到的问题，还是一句感受，我们都会认真阅读。</p><FeedbackForm /></section></main>;
}
