"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { Check, Heart, LoaderCircle, Menu, MessageCircle, PencilLine, Share2, Trash2, Upload, X } from "lucide-react";
import { MEMBER_FEATURES_ENABLED } from "@/lib/member-features";

type Kind = "listing" | "market" | "job" | "board";
type PostStatus = "ACTIVE" | "SOLD" | "HIDDEN";
type EditablePost = {
  id: string;
  kind: Kind;
  category: string;
  type: string;
  title: string;
  body: string;
  region: string;
  district?: string;
  price?: number | null;
  seats?: number | null;
  premium?: number | null;
  deposit?: number | null;
  contact?: string;
  images?: string[];
  authorName?: string;
  status?: PostStatus;
  demo?: boolean;
};
type Comment = { id: string; body: string; authorName: string; createdAt: string; authorId?: string };
type Problem = { message: string; login?: boolean };

const regions = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const categories: Record<Kind, { value: string; label: string }[]> = {
  listing: [{ value: "ADULT", label: "성인 PC방" }, { value: "NORMAL", label: "일반 PC방" }, { value: "OTHER", label: "기타 매장" }],
  market: [{ value: "PC", label: "PC / 부품" }, { value: "MONITOR", label: "모니터" }, { value: "CHAIR", label: "의자 / 책상" }, { value: "OTHER", label: "기타 용품" }],
  job: [{ value: "HIRE", label: "직원 채용" }, { value: "RESUME", label: "일자리 구해요" }],
  board: [{ value: "FREE", label: "자유게시판" }, { value: "TIPS", label: "운영 노하우" }, { value: "NEWS", label: "업계 소식" }, { value: "GAME", label: "게임 이야기" }, { value: "CUSTOMER", label: "문의 / 제안" }],
};

function postHref(post: Pick<EditablePost, "id" | "kind" | "category">) {
  const id = encodeURIComponent(post.id);
  return post.kind === "listing" ? `/pc-room/${id}` : post.kind === "market" ? `/market/${id}` : post.kind === "job" ? `/job/${id}` : `/board/${encodeURIComponent(post.category)}/${id}`;
}

class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "same-origin", ...init });
  const parsed: unknown = await response.json().catch(() => ({}));
  const data = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  if (!response.ok) throw new ApiError(typeof data.error === "string" ? data.error : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", response.status, typeof data.code === "string" ? data.code : undefined);
  return data as T;
}

function json(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function problemFrom(error: unknown): Problem {
  if (MEMBER_FEATURES_ENABLED && error instanceof ApiError && error.code === "PROFILE_REQUIRED") {
    window.location.assign(`/join?return_to=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    return { message: "프로필 등록 화면으로 이동합니다." };
  }
  return { message: error instanceof Error ? error.message : "연결을 확인한 뒤 다시 시도해 주세요.", login: MEMBER_FEATURES_ENABLED && error instanceof ApiError && error.status === 401 };
}

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function SignInLink({ children = "로그인하기" }: { children?: React.ReactNode }) {
  const returnTo = useSyncExternalStore(subscribeToLocation, () => window.location.pathname + window.location.search, () => "/");
  if (!MEMBER_FEATURES_ENABLED) return null;
  return <a href={`/signin-with-chatgpt?return_to=${encodeURIComponent(returnTo)}`} target="_top" className="text-link">{children}</a>;
}

function ErrorNotice({ problem }: { problem: Problem | null }) {
  return problem ? <div className="alert alert-error" role="alert">{problem.message}{problem.login && <> <SignInLink /></>}</div> : null;
}

function BusyLabel({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return <>{busy && <LoaderCircle size={16} className="spin" aria-hidden="true" />}{children}</>;
}

export function PostEditor({ post, kind: initialKind = "listing", category: initialCategory, type: initialType }: { post?: EditablePost; kind?: Kind; category?: string; type?: string }) {
  const startKind = post?.kind || initialKind;
  const [kind, setKind] = useState<Kind>(startKind);
  const [category, setCategory] = useState(post?.category || initialCategory || categories[startKind][0].value);
  const [type, setType] = useState(post?.type || initialType || (startKind === "job" ? "HIRE" : startKind === "board" ? "POST" : "SELL"));
  const [images, setImages] = useState<string[]>(post?.images || []);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  if (!MEMBER_FEATURES_ENABLED) return null;

  function changeKind(value: Kind) {
    setKind(value);
    setCategory(categories[value][0].value);
    setType(value === "job" ? "HIRE" : value === "board" ? "POST" : "SELL");
    setProblem(null);
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length || uploading) return;
    setProblem(null);
    setUploadMessage("");
    if (images.length + files.length > 5) { setProblem({ message: "사진은 최대 5장까지 등록할 수 있습니다." }); return; }
    const selected = Array.from(files);
    if (selected.some(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) { setProblem({ message: "JPG, PNG, WEBP 이미지 파일을 선택해 주세요." }); return; }
    if (selected.some(file => file.size > 5 * 1024 * 1024)) { setProblem({ message: "사진 한 장의 크기는 5MB 이하여야 합니다." }); return; }
    setUploading(true);
    let count = 0;
    try {
      for (const file of selected) {
        const form = new FormData();
        form.append("file", file);
        const result = await api<{ url: string }>("/api/uploads", { method: "POST", body: form });
        if (!result.url) throw new Error("업로드한 사진의 주소를 받지 못했습니다.");
        setImages(previous => [...previous, result.url]);
        count++;
      }
      setUploadMessage(`${count}장의 사진을 추가했습니다.`);
    } catch (error) { setProblem(problemFrom(error)); }
    finally { setUploading(false); if (uploadRef.current) uploadRef.current.value = ""; }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uploading) return;
    const form = new FormData(event.currentTarget);
    const number = (name: string) => { const value = String(form.get(name) || "").trim(); return value === "" ? null : Number(value); };
    const payload = {
      kind, category: kind === "job" ? type : category, type,
      title: String(form.get("title") || "").trim(), body: String(form.get("body") || "").trim(),
      region: String(form.get("region") || (kind === "board" ? "전국" : "")), district: String(form.get("district") || "").trim(),
      price: kind === "board" ? null : number("price"), seats: kind === "listing" ? number("seats") : null,
      premium: kind === "listing" ? number("premium") : null, deposit: kind === "listing" ? number("deposit") : null,
      contact: kind === "board" ? "" : String(form.get("contact") || "").trim(), images,
    };
    if (payload.title.length < 2 || payload.body.length < 10) { setProblem({ message: "제목은 2자 이상, 내용은 10자 이상 입력해 주세요." }); return; }
    setProblem(null);
    setBusy(true);
    try {
      const result = await api<{ post: EditablePost }>(post ? `/api/posts/${encodeURIComponent(post.id)}` : "/api/posts", json(post ? "PATCH" : "POST", payload));
      if (!result.post?.id) throw new Error("저장 결과를 확인하지 못했습니다. 내 글 목록을 확인해 주세요.");
      window.location.assign(postHref(result.post));
    } catch (error) { setProblem(problemFrom(error)); setBusy(false); }
  }

  const knownCategories = categories[kind].some(item => item.value === category) ? categories[kind] : [...categories[kind], { value: category, label: category === "NOTICE" ? "공지사항" : category }];
  return <form className="editor-form" onSubmit={submit}>
    <div className="form-grid">
      <label className="field">게시판<select className="input" value={kind} disabled={!!post || busy} onChange={event => changeKind(event.target.value as Kind)}><option value="listing">PC방 매매</option><option value="market">중고장터</option><option value="job">구인구직</option><option value="board">커뮤니티</option></select></label>
      {kind !== "job" && <label className="field">카테고리<select className="input" value={category} disabled={busy} onChange={event => setCategory(event.target.value)}>{knownCategories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}
      {kind !== "board" && <label className="field">거래 구분<select className="input" value={type} disabled={busy} onChange={event => setType(event.target.value)}>{kind === "job" ? <><option value="HIRE">직원 구해요</option><option value="RESUME">일자리 구해요</option></> : <><option value="SELL">{kind === "listing" ? "매매합니다" : "판매합니다"}</option><option value="BUY">{kind === "listing" ? "매장 구합니다" : "구매합니다"}</option></>}</select></label>}
    </div>
    <label className="field">제목 <span className="required">*</span><input className="input" name="title" defaultValue={post?.title} placeholder="어떤 소식을 나누고 싶으신가요?" required minLength={2} maxLength={120} disabled={busy} /></label>
    <div className="form-grid">
      <label className="field">지역 {kind !== "board" && <span className="required">*</span>}<select className="input" name="region" defaultValue={post?.region || ""} required={kind !== "board"} disabled={busy}><option value="">{kind === "board" ? "지역 선택 (선택사항)" : "시 / 도를 선택하세요"}</option>{post?.region && !regions.includes(post.region) && <option value={post.region}>{post.region}</option>}{regions.map(region => <option key={region} value={region}>{region}</option>)}</select></label>
      <label className="field">시 / 군 / 구<input className="input" name="district" defaultValue={post?.district} placeholder="예: 강남구" maxLength={40} disabled={busy} /></label>
    </div>
    {kind !== "board" && <div className="form-grid">
      <label className="field">{kind === "job" ? "월 급여 (만원)" : "희망 가격 (만원)"}<input className="input" name="price" type="number" min="0" max="1000000000" step="1" defaultValue={post?.price ?? ""} placeholder="미입력 시 협의" disabled={busy} /><small className="muted">만원 단위로 입력해 주세요. 예: 1천만 원 → 1000</small></label>
      {kind === "listing" && <label className="field">PC 좌석 수<input className="input" name="seats" type="number" min="0" max="9999" step="1" defaultValue={post?.seats ?? ""} placeholder="예: 80" disabled={busy} /></label>}
      <label className="field">연락처<input className="input" name="contact" defaultValue={post?.contact} placeholder="전화번호 또는 이메일 (선택사항)" maxLength={100} disabled={busy} /><small className="muted">입력한 연락처는 게시글에 공개됩니다.</small></label>
    </div>}
    {kind === "listing" && <div className="form-grid"><label className="field">보증금 (만원)<input className="input" name="deposit" type="number" min="0" max="1000000000" step="1" defaultValue={post?.deposit ?? ""} placeholder="선택사항" disabled={busy} /></label><label className="field">권리금 (만원)<input className="input" name="premium" type="number" min="0" max="1000000000" step="1" defaultValue={post?.premium ?? ""} placeholder="선택사항" disabled={busy} /></label></div>}
    <label className="field">내용 <span className="required">*</span><textarea className="input" name="body" defaultValue={post?.body} rows={12} required minLength={10} maxLength={20000} disabled={busy} placeholder={kind === "listing" ? "매장 위치, 시설 및 사양, 운영 현황, 거래 조건을 자세히 작성해 주세요.\n다른 사람의 개인정보와 허위 정보는 등록할 수 없습니다." : kind === "job" ? "담당 업무, 근무 지역과 시간, 급여 및 지원 방법을 자세히 작성해 주세요." : "내용을 10자 이상 작성해 주세요."} /></label>
    <div className="field"><span>사진 <span className="muted">{images.length} / 5</span></span><div className="upload-grid">{images.map((url, index) => <div className="upload-preview" key={url}><img src={url} alt={`첨부 사진 ${index + 1}`} width={144} height={108} /><button className="icon-button" type="button" disabled={busy || uploading} aria-label={`첨부 사진 ${index + 1} 삭제`} onClick={() => setImages(previous => previous.filter((_, current) => current !== index))}><X size={16} /></button></div>)}</div><label className={`upload-button btn btn-secondary${busy || uploading || images.length >= 5 ? " disabled" : ""}`}><Upload size={17} aria-hidden="true" />{uploading ? "사진 업로드 중…" : "사진 추가"}<input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy || uploading || images.length >= 5} onChange={event => void uploadFiles(event.target.files)} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} /></label><small className="muted">JPG, PNG, WEBP · 장당 5MB 이하 · 최대 5장</small><span className="muted" aria-live="polite">{uploadMessage}</span></div>
    <ErrorNotice problem={problem} />
    <div className="form-actions"><a href={post ? postHref(post) : "/"} className="btn btn-secondary">취소</a><button className="btn btn-primary" type="submit" disabled={busy || uploading}><BusyLabel busy={busy}>{busy ? "저장 중…" : post ? "수정 완료" : "게시글 등록"}</BusyLabel></button></div>
  </form>;
}

export function ProfileForm({ initialNickname = "", initialRegion = "", returnTo }: { initialNickname?: string; initialRegion?: string; returnTo?: string }) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [saved, setSaved] = useState(false);
  if (!MEMBER_FEATURES_ENABLED) return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setProblem(null); setSaved(false);
    try {
      await api("/api/profile", json("POST", { nickname: String(form.get("nickname") || "").trim(), region: String(form.get("region") || "") }));
      setSaved(true);
      if (returnTo?.startsWith("/") && !/[\\\u0000-\u001f\u007f]/.test(returnTo)) {
        const destination = new URL(returnTo, window.location.origin);
        const pathname = decodeURIComponent(destination.pathname);
        const reserved = /^\/(?:api|signin-with-chatgpt|signout-with-chatgpt|callback)(?:\/|$)/i.test(pathname);
        if (destination.origin === window.location.origin && !reserved && !/[\\\u0000-\u001f\u007f]/.test(pathname)) window.location.assign(destination.pathname + destination.search + destination.hash);
      }
    } catch (error) { setProblem(problemFrom(error)); }
    finally { setBusy(false); }
  }
  return <form className="profile-form" onSubmit={submit} onChange={() => setSaved(false)}><label className="field">닉네임 <span className="required">*</span><input className="input" name="nickname" defaultValue={initialNickname} autoComplete="nickname" placeholder="커뮤니티에서 사용할 이름" minLength={2} maxLength={20} required disabled={busy} /><small className="muted">2~20자. 게시글과 댓글에 표시됩니다.</small></label><label className="field">활동 지역 <span className="required">*</span><select className="input" name="region" defaultValue={initialRegion} required disabled={busy}><option value="">지역을 선택하세요</option>{initialRegion && !regions.includes(initialRegion) && <option value={initialRegion}>{initialRegion}</option>}{regions.map(region => <option key={region} value={region}>{region}</option>)}</select></label><ErrorNotice problem={problem} />{saved && <div className="alert alert-success" role="status"><Check size={17} aria-hidden="true" />프로필을 저장했습니다. <a href="/mypage" className="text-link">내 정보 보기</a></div>}<button className="btn btn-primary" disabled={busy} type="submit"><BusyLabel busy={busy}>{busy ? "저장 중…" : "프로필 저장"}</BusyLabel></button></form>;
}

export function DetailActions({ postId, initialFavorite = false, canEdit = false, status = "ACTIVE", demo = false, kind, category }: { postId: string; initialFavorite?: boolean; canEdit?: boolean; status?: string; demo?: boolean; kind?: Kind; category?: string }) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [busy, setBusy] = useState("");
  const [problem, setProblem] = useState<Problem | null>(null);
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function toggleFavorite() {
    if (!MEMBER_FEATURES_ENABLED || busy || demo) return;
    setBusy("favorite"); setProblem(null); setMessage("");
    try { const result = await api<{ favorited: boolean }>(`/api/posts/${encodeURIComponent(postId)}/favorite`, { method: "POST" }); if (typeof result.favorited !== "boolean") throw new Error("관심 글 저장 상태를 확인하지 못했습니다."); setFavorite(result.favorited); setMessage(result.favorited ? "관심 글에 저장했습니다." : "관심 글에서 해제했습니다."); }
    catch (error) { setProblem(problemFrom(error)); }
    finally { setBusy(""); }
  }
  async function share() {
    setMessage(""); setProblem(null);
    const url = window.location.href.split("#")[0];
    try { await navigator.clipboard.writeText(url); setMessage("게시글 주소를 복사했습니다."); setShareUrl(""); }
    catch { setShareUrl(url); setMessage("아래 주소를 선택해 복사해 주세요."); }
  }
  async function markSold() {
    if (!MEMBER_FEATURES_ENABLED || busy || demo) return;
    setBusy("sold"); setProblem(null); setMessage("");
    try { await api(`/api/posts/${encodeURIComponent(postId)}`, json("PATCH", { status: "SOLD" })); setCurrentStatus("SOLD"); setMessage("거래 완료로 변경했습니다."); window.location.reload(); }
    catch (error) { setProblem(problemFrom(error)); }
    finally { setBusy(""); }
  }
  async function removePost() {
    if (!MEMBER_FEATURES_ENABLED || busy || demo || !canEdit) return;
    setBusy("delete"); setProblem(null); setMessage("");
    try {
      const result = await api<{ ok: boolean }>(`/api/posts/${encodeURIComponent(postId)}`, { method: "DELETE" });
      if (!result.ok) throw new Error("게시글 삭제 결과를 확인하지 못했습니다.");
      const destination = kind === "listing" ? "/pc-room" : kind === "market" ? "/market" : kind === "job" ? "/job" : kind === "board" ? `/board/${encodeURIComponent(category || "FREE")}` : "/mypage";
      window.location.assign(destination);
    } catch (error) { setProblem(problemFrom(error)); setBusy(""); }
  }
  return <div className="detail-actions-wrap">
    <div className="detail-actions">
      {MEMBER_FEATURES_ENABLED && <button className={`btn ${favorite ? "btn-primary" : "btn-secondary"}`} type="button" onClick={() => void toggleFavorite()} disabled={!!busy || demo} aria-pressed={favorite}><Heart size={17} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />{favorite ? "관심 글 저장됨" : "관심 글 저장"}</button>}
      <button className="btn btn-secondary" type="button" onClick={() => void share()}><Share2 size={17} aria-hidden="true" />공유하기</button>
      {MEMBER_FEATURES_ENABLED && canEdit && !demo && <>
        <a className="btn btn-secondary" href={`/write?edit=${encodeURIComponent(postId)}`}><PencilLine size={17} aria-hidden="true" />수정하기</a>
        {currentStatus === "ACTIVE" && kind !== "board" && <button type="button" className="btn btn-secondary" disabled={!!busy} onClick={() => void markSold()}><BusyLabel busy={busy === "sold"}>{kind === "job" ? "모집 완료로 변경" : "거래 완료로 변경"}</BusyLabel></button>}
        <button type="button" className="btn btn-danger" disabled={!!busy} onClick={() => { setConfirmDelete(previous => !previous); setProblem(null); }} aria-expanded={confirmDelete} aria-controls="confirm-post-delete"><Trash2 size={16} aria-hidden="true" />삭제</button>
      </>}
    </div>
    {MEMBER_FEATURES_ENABLED && confirmDelete && canEdit && !demo && <div id="confirm-post-delete" className="alert" role="group" aria-label="게시글 삭제 확인"><p>이 게시글을 삭제할까요? 공개 목록에서 숨겨지며, 작성자 화면에서는 복구할 수 없습니다.</p><div className="form-actions"><button type="button" className="btn btn-secondary" disabled={!!busy} onClick={() => setConfirmDelete(false)}>취소</button><button type="button" className="btn btn-danger" disabled={!!busy} onClick={() => void removePost()}><BusyLabel busy={busy === "delete"}>{busy === "delete" ? "삭제 중…" : "게시글 삭제"}</BusyLabel></button></div></div>}
    {demo && <p className="muted">화면을 둘러보기 위한 예시 글입니다.{MEMBER_FEATURES_ENABLED && " 관심 글 저장과 댓글은 실제 게시글에서 이용할 수 있습니다."}</p>}
    <ErrorNotice problem={problem} /><p className="action-feedback muted" role="status">{message}</p>
    {shareUrl && <label className="field">공유 주소<input className="input" value={shareUrl} readOnly onFocus={event => event.target.select()} /></label>}
  </div>;
}

export function Comments({ postId, initialComments = [], userId, demo = false }: { postId: string; initialComments?: Comment[]; userId?: string | null; demo?: boolean }) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!MEMBER_FEATURES_ENABLED || busy || demo || !body.trim()) return;
    setBusy(true); setProblem(null); setMessage("");
    try { const result = await api<{ comment: Comment }>(`/api/posts/${encodeURIComponent(postId)}/comments`, json("POST", { body: body.trim() })); if (!result.comment?.id) throw new Error("댓글 저장 결과를 확인하지 못했습니다."); setComments(previous => [...previous, result.comment]); setBody(""); setMessage("댓글을 등록했습니다."); }
    catch (error) { setProblem(problemFrom(error)); }
    finally { setBusy(false); }
  }
  return <section className="comments-section"><h2 className="section-heading"><MessageCircle size={19} aria-hidden="true" />댓글 <span className="count">{comments.length}</span></h2>{comments.length ? <ul className="comment-list">{comments.map(comment => <li className="comment" key={comment.id}><div className="comment-meta"><strong>{comment.authorName}</strong><time dateTime={comment.createdAt}>{formatDate(comment.createdAt)}</time></div><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{comment.body}</p></li>)}</ul> : <div className="empty-state compact">아직 댓글이 없습니다.{MEMBER_FEATURES_ENABLED && " 첫 이야기를 남겨 주세요."}</div>}{MEMBER_FEATURES_ENABLED && (demo ? <p className="muted">예시 글에는 댓글을 등록할 수 없습니다.</p> : userId ? <form className="comment-form" onSubmit={submit}><label className="field"><span className="sr-only">댓글 내용</span><textarea className="input" value={body} onChange={event => { setBody(event.target.value); setMessage(""); }} rows={3} maxLength={2000} required disabled={busy} placeholder="서로를 존중하는 따뜻한 댓글을 남겨 주세요." /></label><div className="form-actions"><span className="muted">{body.length} / 2,000</span><button className="btn btn-primary" type="submit" disabled={busy || !body.trim()}><BusyLabel busy={busy}>{busy ? "등록 중…" : "댓글 등록"}</BusyLabel></button></div></form> : <div className="alert">댓글을 남기려면 <SignInLink>로그인</SignInLink>해 주세요.</div>)}<ErrorNotice problem={problem} /><p className="muted" role="status">{message}</p></section>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" });
}

const symbols = ["🍒", "🍋", "🍇", "🍀", "⭐", "💎"];
export function FreeSlot() {
  const [credits, setCredits] = useState(1000);
  const [reels, setReels] = useState(["🍒", "⭐", "💎"]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("무료 연습 포인트 1,000점으로 시작하세요.");
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  function spin() {
    if (spinning || credits < 50) return;
    setSpinning(true); setCredits(previous => previous - 50); setMessage("릴이 돌아갑니다…");
    timeout.current = setTimeout(() => {
      const next = [0, 1, 2].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
      const unique = new Set(next).size;
      const prize = unique === 1 ? 500 : unique === 2 ? 100 : 0;
      setReels(next); setCredits(previous => previous + prize); setSpinning(false);
      setMessage(prize ? `${unique === 1 ? "세 개 일치!" : "두 개 일치!"} ${prize} 연습 포인트를 받았어요.` : "이번에는 일치하는 그림이 없어요. 가볍게 즐겨 주세요.");
      timeout.current = null;
    }, 650);
  }
  function reset() { if (spinning) return; setCredits(1000); setReels(["🍒", "⭐", "💎"]); setMessage("연습 포인트를 1,000점으로 초기화했습니다."); }
  return <section className="slot-game panel"><div className="slot-kicker">JUST FOR FUN</div><h2>잠깐, 쉬어 가세요</h2><p className="muted">결제·환전·경품이 없는 무료 미니게임입니다.</p><div className="slot-balance"><span>연습 포인트</span><strong>{credits.toLocaleString("ko-KR")} <small>P</small></strong></div><div className={`slot-reels${spinning ? " is-spinning" : ""}`} aria-label={spinning ? "릴 회전 중" : `결과: ${reels.join(" ")}`}>{reels.map((symbol, index) => <span key={index} className="slot-reel" aria-hidden="true">{symbol}</span>)}</div><p className="slot-message" role="status">{message}</p><div className="form-actions"><button type="button" className="btn btn-secondary" disabled={spinning} onClick={reset}>포인트 초기화</button><button type="button" className="btn btn-primary" disabled={spinning || credits < 50} onClick={spin}><BusyLabel busy={spinning}>{spinning ? "돌아가는 중…" : "한 번 돌리기 · 50P"}</BusyLabel></button></div>{credits < 50 && !spinning && <p className="muted">포인트를 초기화하면 다시 즐길 수 있습니다.</p>}<div className="slot-rules"><span>같은 그림 2개 <strong>100P</strong></span><span>같은 그림 3개 <strong>500P</strong></span></div><p className="muted">포인트는 이 화면에서만 사용하는 가상 점수이며 금전적 가치가 없습니다.</p></section>;
}

export function AdminPanel() {
  const [posts, setPosts] = useState<EditablePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("ALL");
  async function load() {
    if (!MEMBER_FEATURES_ENABLED) return;
    setLoading(true); setProblem(null);
    try { const result = await api<{ posts: EditablePost[] }>("/api/admin/posts"); setPosts(result.posts || []); }
    catch (error) { setProblem(problemFrom(error)); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    if (!MEMBER_FEATURES_ENABLED) return;
    const controller = new AbortController();
    api<{ posts: EditablePost[] }>("/api/admin/posts", { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setPosts(result.posts || []); })
      .catch(error => { if (!controller.signal.aborted) setProblem(problemFrom(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  async function moderate(post: EditablePost, status: PostStatus) {
    if (!MEMBER_FEATURES_ENABLED || busyId || post.demo) return;
    setBusyId(post.id); setProblem(null); setMessage("");
    try { await api(`/api/admin/posts/${encodeURIComponent(post.id)}`, json("PATCH", { status })); setPosts(previous => previous.map(item => item.id === post.id ? { ...item, status } : item)); setMessage(`“${post.title}” 게시글을 ${status === "HIDDEN" ? "숨김" : status === "SOLD" ? "거래 완료" : "공개"} 상태로 변경했습니다.`); }
    catch (error) { setProblem(problemFrom(error)); }
    finally { setBusyId(null); }
  }
  const filtered = posts.filter(post => filter === "ALL" || post.status === filter);
  if (!MEMBER_FEATURES_ENABLED) return null;
  return <section className="admin-panel">
    <div className="form-actions"><label className="field">표시 상태<select className="input" value={filter} onChange={event => setFilter(event.target.value)}><option value="ALL">전체 게시글</option><option value="ACTIVE">공개 중</option><option value="SOLD">거래 완료</option><option value="HIDDEN">숨김</option></select></label><button type="button" className="btn btn-secondary" disabled={loading || !!busyId} onClick={() => void load()}>새로고침</button></div>
    <ErrorNotice problem={problem} /><p role="status" className="muted">{message}</p>
    {loading ? <div className="empty-state" role="status">게시글을 불러오는 중…</div> : filtered.length ? <div className="admin-list">{filtered.map(post => <article className="admin-row" key={post.id}>
      <div><span className={`pill ${post.status === "HIDDEN" || post.demo ? "pill-muted" : ""}`}>{post.demo ? "예시" : post.status === "HIDDEN" ? "숨김" : post.status === "SOLD" ? "거래 완료" : "공개"}</span><h3>{post.status === "HIDDEN" ? post.title : <a href={postHref(post)}>{post.title}</a>}</h3><p className="muted">{post.authorName} · {post.region} · {post.category}</p></div>
      {post.demo ? <p className="muted">예시 글은 수정할 수 없습니다.</p> : <div className="form-actions">
        {post.status !== "ACTIVE" && <button type="button" className="btn btn-secondary" disabled={!!busyId} onClick={() => void moderate(post, "ACTIVE")}><Check size={15} aria-hidden="true" />공개</button>}
        {post.status !== "SOLD" && post.kind !== "board" && <button type="button" className="btn btn-secondary" disabled={!!busyId} onClick={() => void moderate(post, "SOLD")}>거래 완료</button>}
        {post.status !== "HIDDEN" && <button type="button" className="btn btn-danger" disabled={!!busyId} onClick={() => void moderate(post, "HIDDEN")}><BusyLabel busy={busyId === post.id}>숨김</BusyLabel></button>}
      </div>}
    </article>)}</div> : !problem && <div className="empty-state">해당 상태의 게시글이 없습니다.</div>}
  </section>;
}

export function MobileMenu({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function close(event: KeyboardEvent) { if (event.key === "Escape") { setOpen(false); ref.current?.querySelector("button")?.focus(); } }
    function outside(event: PointerEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("keydown", close); document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", outside); };
  }, [open]);
  return <div className="mobile-menu" ref={ref}><button type="button" className="icon-button mobile-menu-toggle" aria-label={open ? "메뉴 닫기" : "전체 메뉴 열기"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(previous => !previous)}>{open ? <X size={23} /> : <Menu size={23} />}</button>{open && <nav id="mobile-navigation" className="mobile-navigation" aria-label="모바일 메뉴" onClick={() => setOpen(false)}><a href="/pc-room">PC방 매매</a><a href="/market">중고장터</a><a href="/job">구인구직</a><a href="/board/FREE">커뮤니티</a><a href="/board/TIPS">운영 노하우</a><a href="/slot">무료 슬롯 체험</a>{MEMBER_FEATURES_ENABLED && <>{signedIn ? <><a href="/mypage">내 정보</a><a href="/signout-with-chatgpt?return_to=/" target="_top">로그아웃</a></> : <><a href="/signin-with-chatgpt?return_to=/" target="_top">로그인</a><a href="/join">회원가입</a></>}<a href="/write" className="mobile-write"><PencilLine size={16} aria-hidden="true" />글쓰기</a></>}</nav>}</div>;
}
