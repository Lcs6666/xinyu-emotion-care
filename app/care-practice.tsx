"use client";

import { useEffect, useMemo, useState } from "react";

type Practice = { id: string; icon: string; label: string; title: string; description: string; duration: number; steps: string[] };

const practices: Practice[] = [
  { id: "breath", icon: "◌", label: "呼吸", title: "一分钟舒缓呼吸", description: "跟随圆环，吸气 4 秒、停留 2 秒、呼气 6 秒。", duration: 60, steps: ["吸气，让腹部轻轻鼓起", "停留，不用憋得用力", "慢慢呼气，放松肩膀"] },
  { id: "ground", icon: "◎", label: "正念", title: "5-4-3-2-1 落地练习", description: "把注意力从脑海带回身边真实可感的事物。", duration: 90, steps: ["看见 5 样东西", "触碰 4 样东西", "听见 3 种声音", "闻到 2 种气味", "感受 1 个味道或一次呼吸"] },
  { id: "stretch", icon: "↗", label: "舒展", title: "坐姿松肩舒展", description: "不用离开座位，依次放松颈部、肩膀和手腕。", duration: 75, steps: ["下巴微收，颈后拉长", "肩膀向上提，再慢慢放下", "双手交扣，掌心向外推", "左右轻轻转动手腕", "闭眼感受身体的变化"] },
  { id: "reset", icon: "☼", label: "休息", title: "屏幕外的一分钟", description: "把视线移向远处，让眼睛和思绪一起换个焦点。", duration: 60, steps: ["看向窗外或房间最远处", "找到一种让你舒服的颜色", "喝一口水，感受温度", "放松眉心和下颌"] },
  { id: "move", icon: "↝", label: "活动", title: "轻轻唤醒身体", description: "用小幅度动作找回一点能量，不追求强度。", duration: 90, steps: ["原地踏步，手臂自然摆动", "脚尖抬起再落下", "向左右伸展身体侧面", "做三次缓慢深呼吸", "停下来感受心跳"] },
  { id: "savor", icon: "✦", label: "收藏", title: "把好心情多留一会儿", description: "用具体细节记住此刻，让快乐停留得久一点。", duration: 60, steps: ["回想刚才最开心的一个瞬间", "注意当时的画面和声音", "想一想你身体哪里最放松", "把这个瞬间写进今天的记录"] },
];

const moodOrder: Record<string, string[]> = {
  焦虑: ["breath", "ground", "reset"], 生气: ["reset", "breath", "move"], 疲惫: ["stretch", "reset", "breath"],
  低落: ["move", "ground", "stretch"], 孤独: ["ground", "move", "savor"], 开心: ["savor", "move", "ground"],
  期待: ["breath", "savor", "stretch"], 感动: ["savor", "ground", "breath"], 平静: ["savor", "stretch", "ground"],
};

export default function CarePractice({ moodName, notify }: { moodName: string; notify: (message: string) => void }) {
  const options = useMemo(() => (moodOrder[moodName] || ["breath", "ground", "stretch"]).map((id) => practices.find((item) => item.id === id)!), [moodName]);
  const [selectedId, setSelectedId] = useState(options[0].id);
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "done">("idle");
  const selected = options.find((item) => item.id === selectedId) || options[0];
  const [remaining, setRemaining] = useState(selected.duration);

  useEffect(() => { setSelectedId(options[0].id); setStatus("idle"); setRemaining(options[0].duration); }, [options]);
  useEffect(() => {
    if (status !== "running") return;
    const timer = window.setInterval(() => setRemaining((seconds) => {
      if (seconds <= 1) { setStatus("done"); return 0; }
      return seconds - 1;
    }), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  const elapsed = selected.duration - remaining;
  const progress = Math.round(elapsed / selected.duration * 100);
  const stepIndex = Math.min(selected.steps.length - 1, Math.floor(elapsed / (selected.duration / selected.steps.length)));
  const breathBeat = elapsed % 12;
  const breathPhase = breathBeat < 4 ? { label: "慢慢吸气", className: "inhale" } : breathBeat < 6 ? { label: "轻轻停留", className: "hold" } : { label: "缓缓呼气", className: "exhale" };
  const phase = selected.id === "breath" ? breathPhase.label : selected.steps[stepIndex];

  const choose = (item: Practice) => { setSelectedId(item.id); setRemaining(item.duration); setStatus("idle"); };
  const start = () => { setRemaining(selected.duration); setStatus("running"); };
  const finishFeedback = (message: string) => { notify(message); setStatus("idle"); setRemaining(selected.duration); };

  return <article className="card care care-interactive">
    <div className="care-kicker"><span>为此刻推荐</span><small>根据「{moodName}」调整</small></div>
    <div className="practice-tabs" role="tablist" aria-label="选择关怀练习">{options.map((item) => <button key={item.id} className={`practice-tab ${selected.id === item.id ? "active" : ""}`} onClick={() => choose(item)}><i>{item.icon}</i><span>{item.label}</span></button>)}</div>
    {status === "idle" && <div className="practice-intro"><h3>{selected.title}</h3><p>{selected.description}</p><div className="practice-meta"><span>约 {Math.ceil(selected.duration / 60)} 分钟</span><button onClick={() => choose(options[(options.findIndex((item) => item.id === selected.id) + 1) % options.length])}>换一个</button></div><button className="practice-primary" onClick={start}>开始练习</button></div>}
    {(status === "running" || status === "paused") && <div className="practice-live" aria-live="polite"><div className={`practice-orb ${selected.id === "breath" ? breathPhase.className : "steady"}`} style={{ background: `conic-gradient(#2c6656 ${progress}%, #dfeae2 ${progress}% 100%)` }}><div><strong>{Math.floor(remaining / 60)}:{pad(remaining % 60)}</strong><span>{phase}</span></div></div><div className="step-track">{selected.steps.map((step, index) => <span key={step} className={index <= stepIndex ? "active" : ""} title={step} />)}</div><p className="current-step">{phase}</p><div className="practice-controls"><button onClick={() => setStatus(status === "running" ? "paused" : "running")}>{status === "running" ? "暂停" : "继续"}</button><button onClick={() => { setStatus("idle"); setRemaining(selected.duration); }}>结束练习</button></div></div>}
    {status === "done" && <div className="practice-done"><div className="done-mark">✓</div><h3>这一小步，完成了</h3><p>不用追求立刻变好，愿意停下来照顾自己已经很重要。</p><div><button onClick={() => finishFeedback("已记录：此刻感觉轻松了一点")}>感觉好一点</button><button onClick={() => finishFeedback("没关系，允许感受慢慢变化")}>差不多</button></div></div>}
  </article>;
}

const pad = (value: number) => String(value).padStart(2, "0");
