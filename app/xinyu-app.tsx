"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import CarePractice from "./care-practice";

type Mood = { id?: string; name: string; emoji: string; custom?: boolean };
type Entry = { id: string; date: string; mood: string; emoji: string; level: number; triggers: string[]; note: string; images: string[] };
type User = { name: string };

const baseMoods: Mood[] = [
  { name: "平静", emoji: "😌" }, { name: "开心", emoji: "😊" }, { name: "期待", emoji: "🤩" },
  { name: "感动", emoji: "🥹" }, { name: "焦虑", emoji: "😣" }, { name: "低落", emoji: "😔" },
  { name: "疲惫", emoji: "😮‍💨" }, { name: "生气", emoji: "😤" }, { name: "孤独", emoji: "🥺" },
];
const triggerOptions = ["工作 / 学业", "人际关系", "睡眠", "健康", "家庭", "社交媒体", "天气", "其他"];
const encouragements = [
  "你不需要一次解决所有事情，先照顾好下一分钟就够了。",
  "今天已经走到这里，本身就是一种努力。",
  "情绪不是你的敌人，它只是在提醒你：有些需要还没被听见。",
  "慢一点没关系，恢复也属于前进的一部分。",
  "你可以不坚强，也依然值得被温柔对待。",
];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());

export default function XinyuApp({ user }: { user: User }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [customMoods, setCustomMoods] = useState<Mood[]>([]);
  const [mood, setMood] = useState<Mood>(baseMoods[1]);
  const [date, setDate] = useState(today());
  const [level, setLevel] = useState(6);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [tab, setTab] = useState<"week" | "month">("week");
  const [cursor, setCursor] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [customName, setCustomName] = useState("");
  const [customEmoji, setCustomEmoji] = useState("🙂");
  const [cardIndex, setCardIndex] = useState(Math.floor(Date.now() / 86400000) % encouragements.length);
  const [messages, setMessages] = useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: "我在。你可以从一句“今天有点……”开始，不用整理好再说。" },
  ]);
  const [chatText, setChatText] = useState("");

  const moods = [...baseMoods, ...customMoods];
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2400); };
  const loadData = async () => {
    const response = await fetch("/api/data", { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      setEntries(data.records || []);
      setCustomMoods((data.moods || []).map((item: Mood) => ({ ...item, custom: true })));
    }
    setLoading(false);
  };

  useEffect(() => { void loadData(); }, []);

  const saveEntry = async () => {
    setSaving(true);
    const form = new FormData();
    form.set("date", date); form.set("mood", mood.name); form.set("emoji", mood.emoji);
    form.set("level", String(level)); form.set("triggers", JSON.stringify(triggers)); form.set("note", note);
    photos.forEach((file) => form.append("images", file));
    const response = await fetch("/api/records", { method: "POST", body: form });
    setSaving(false);
    if (!response.ok) { notify("保存失败，请稍后再试"); return; }
    setNote(""); setPhotos([]); await loadData(); notify("已保存。谢谢你愿意看见自己。");
  };

  const addCustomMood = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch("/api/moods", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: customName, emoji: customEmoji }) });
    const data = await response.json();
    if (!response.ok) { notify(data.error || "添加失败"); return; }
    const added = { ...data, custom: true };
    setCustomMoods((items) => [...items, added]); setMood(added); setCustomName(""); notify("已添加自定义心情");
  };

  const removeCustomMood = async (item: Mood) => {
    await fetch("/api/moods", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: item.id }) });
    setCustomMoods((items) => items.filter((x) => x.id !== item.id));
    if (mood.id === item.id) setMood(baseMoods[1]);
  };

  const weekDays = useMemo(() => {
    const now = new Date(); const weekday = now.getDay() || 7; const start = new Date(now); start.setDate(now.getDate() - weekday + 1);
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, []);
  const triggerCounts = useMemo(() => {
    const start = iso(weekDays[0]); const counts: Record<string, number> = {};
    entries.filter((entry) => entry.date >= start && entry.date <= today()).forEach((entry) => entry.triggers.forEach((x) => { counts[x] = (counts[x] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [entries, weekDays]);

  const calendarCells = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth(), first = new Date(y, m, 1), offset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(y, m, i - offset + 1); return { date: d, muted: d.getMonth() !== m }; });
  }, [cursor]);

  const companionReply = (text: string) => {
    if (/自杀|不想活|结束生命|伤害自己|伤害别人/.test(text)) return "听到你正在承受很强烈的痛苦。请不要独自面对：现在就联系当地急救服务、心理危机热线，或让可信赖的人陪在你身边。";
    if (/焦虑|紧张|害怕|慌/.test(text)) return "我听见这份紧张了。我们先不急着解决全部问题：双脚踩地，慢慢呼气 6 秒。此刻最担心的具体一件事是什么？";
    if (/累|疲惫|没力气|睡不着/.test(text)) return "你似乎已经撑了很久。今晚可以先把目标缩小到恢复一点点：喝水、关掉一个提醒，或者闭眼休息两分钟。";
    return "谢谢你愿意说出来。我会陪你慢慢讲清楚。现在这件事带给你的感受，更接近难过、焦虑、疲惫，还是别的什么？";
  };
  const sendChat = (event: FormEvent) => {
    event.preventDefault(); const text = chatText.trim(); if (!text) return;
    setMessages((items) => [...items, { role: "user", text }, { role: "ai", text: companionReply(text) }]); setChatText("");
  };

  const signOut = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.reload(); };
  const initial = user.name.trim().charAt(0).toUpperCase();
  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><span className="logo">♡</span>心屿</div>
        <div className="account"><span className="avatar">{initial}</span><span><b>{user.name}</b><small>匿名账号 · 独立保存</small></span><button onClick={() => void signOut()}>退出</button></div>
      </header>

      <main className="shell">
        <section className="card record">
          <p className="eyebrow">每日心情记录</p><h1>今天的心情，值得被看见。</h1><p className="sub">选不到合适的词？你也可以创建自己的心情。</p>
          <div className="date-row"><label htmlFor="entry-date">记录日期</label><input id="entry-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="moods" aria-label="选择心情">
            {moods.map((item) => <div className="mood-wrap" key={item.id || item.name}><button className={`mood ${mood.name === item.name ? "active" : ""}`} onClick={() => setMood(item)}><span>{item.emoji}</span>{item.name}</button>{item.custom && <button className="mood-delete" aria-label={`删除${item.name}`} onClick={() => void removeCustomMood(item)}>×</button>}</div>)}
          </div>
          <form className="custom-mood" onSubmit={addCustomMood}><span>＋ 自定义心情</span><input className="emoji-input" value={customEmoji} onChange={(e) => setCustomEmoji(e.target.value)} aria-label="心情图标" maxLength={4} /><input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="如：释然" maxLength={8} required /><button>添加</button></form>
          <div className="range-head"><span>情绪强度</span><b>{level} / 10</b></div><input type="range" min="1" max="10" value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          <div className="field-label">可能的触发因素</div><div className="chips">{triggerOptions.map((item) => <button className={`chip ${triggers.includes(item) ? "active" : ""}`} key={item} onClick={() => setTriggers((list) => list.includes(item) ? list.filter((x) => x !== item) : [...list, item])}>{item}</button>)}</div>
          <label className="field-label" htmlFor="note">想记下什么？</label><textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：下午汇报前一直很紧张，但结束后比想象中顺利……" />
          <div className="field-label photo-title">添加心情图片</div><div className="photos">{photos.map((file) => <img key={`${file.name}-${file.lastModified}`} src={URL.createObjectURL(file)} alt="待保存图片" />)}{photos.length < 3 && <label className="add-photo">＋<input type="file" accept="image/*" multiple hidden onChange={(e) => setPhotos((items) => [...items, ...Array.from(e.target.files || [])].slice(0, 3))} /></label>}</div><p className="photo-help">最多 3 张，单张不超过 3 MB；仅当前登录用户可以查看。</p>
          <button className="save" onClick={() => void saveEntry()} disabled={saving}>{saving ? "保存中…" : "保存今天的心情"}</button>
        </section>

        <section className="workspace">
          <div className="headline"><div><h2>我的情绪轨迹</h2><p>不是给情绪打分，而是慢慢认识自己的节奏。</p></div><div className="tabs"><button className={tab === "week" ? "active" : ""} onClick={() => setTab("week")}>周视图</button><button className={tab === "month" ? "active" : ""} onClick={() => setTab("month")}>月视图</button></div></div>
          {loading ? <div className="card loading">正在整理你的情绪轨迹…</div> : tab === "week" ? <>
            <div className="week-grid">{weekDays.map((day, i) => { const entry = entries.find((x) => x.date === iso(day)); return <button className={`day ${iso(day) === today() ? "today" : ""}`} key={iso(day)} onClick={() => setDate(iso(day))}><small>{["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i]}</small><b>{day.getDate()}</b>{entry ? <><strong>{entry.emoji}</strong><span>{entry.mood} · {entry.level}/10</span><p>{entry.note || "这一天没有留下文字"}</p>{entry.images[0] && <img src={entry.images[0]} alt="心情记录" />}</> : <em>·</em>}</button>})}</div>
            <div className="summary"><article className="card insight"><h3>本周触发因素</h3><p>{triggerCounts.length ? `「${triggerCounts[0][0]}」是本周最常出现的线索。` : "记录越多，越能看见反复出现的情绪线索。"}</p><div className="trigger-bars">{triggerCounts.map(([name, count]) => <div className="trigger-row" key={name}><span>{name}</span><i><u style={{ width: `${count / triggerCounts[0][1] * 100}%` }} /></i><b>{count}</b></div>)}</div></article><CarePractice moodName={mood.name} notify={notify} /></div>
          </> : <>
            <section className="card month"><div className="month-head"><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>‹</button><h3>{cursor.getFullYear()} 年 {cursor.getMonth() + 1} 月</h3><button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>›</button></div><div className="week-labels">{["一", "二", "三", "四", "五", "六", "日"].map((x) => <span key={x}>{x}</span>)}</div><div className="calendar">{calendarCells.map(({ date: day, muted }) => { const entry = entries.find((x) => x.date === iso(day)); return <button className={`cell ${muted ? "muted" : ""} ${iso(day) === today() ? "today" : ""}`} key={iso(day)} onClick={() => setDate(iso(day))}><span>{day.getDate()}</span>{entry && <><strong>{entry.emoji}</strong><small>{entry.level}/10</small></>}</button>})}</div></section>
            <section className="card gallery"><h3>心情影集</h3><div className="gallery-grid">{entries.filter((x) => x.date.startsWith(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`)).flatMap((entry) => entry.images.map((src) => <figure key={src}><img src={src} alt={`${entry.date} 的心情图片`} /><figcaption>{entry.date.slice(5)}</figcaption></figure>))}</div></section>
          </>}

          <section className="companion"><article className="card encourage"><p className="eyebrow">今日鼓励</p><blockquote>{encouragements[cardIndex]}</blockquote><button onClick={() => setCardIndex((cardIndex + 1) % encouragements.length)}>换一句</button></article><article className="card chat"><div className="chat-head"><h3>心屿陪伴</h3><span>陪伴体验模式</span></div><div className="messages">{messages.map((item, i) => <div className={`bubble ${item.role}`} key={i}>{item.text}</div>)}</div><form className="chat-form" onSubmit={sendChat}><input value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="说说此刻的感受……" maxLength={500} /><button>发送</button></form><p className="chat-note">陪伴对话不能替代专业心理咨询；出现紧急风险时请立即联系急救服务或可信赖的人。</p></article></section>
        </section>
      </main>
      <a className="feedback-fab" href="/feedback"><span>✦</span> 欢迎给我们提建议</a>
      <p className="safety">心屿不提供心理诊断或危机干预。如你有自伤或伤害他人的紧急风险，请立即联系当地急救服务、心理危机热线或可信赖的人。</p>
      <div className={`toast ${toast ? "show" : ""}`} role="status">{toast}</div>
    </div>
  );
}
