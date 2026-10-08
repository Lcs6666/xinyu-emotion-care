import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "./chatgpt-auth";
import XinyuApp from "./xinyu-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();

  if (!user) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-logo">♡</div>
          <p className="eyebrow">心屿 · 情绪日记</p>
          <h1>给情绪一座安静的小岛</h1>
          <p className="login-copy">
            登录后，你的心情记录、自定义心情和图片会按账号独立保存。不同用户之间互不相见。
          </p>
          <a className="primary-link" href={chatGPTSignInPath("/")} target="_top">
            使用 ChatGPT 登录
          </a>
          <p className="privacy-note">我们只使用登录身份来区分记录，不在页面中公开你的邮箱。</p>
        </section>
      </main>
    );
  }

  return (
    <XinyuApp
      user={{ name: user.displayName, email: user.email }}
      signOutPath={chatGPTSignOutPath("/")}
    />
  );
}
