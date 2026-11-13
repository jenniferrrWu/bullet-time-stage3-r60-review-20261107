const SOURCE = './media/case13-f845-to-end-247f-source-preview.mp4';
const SOURCE_POSTER = './media/case13-f845-source-action-first.jpg';
const rows = [...document.querySelectorAll('tbody tr[data-key]')];
const visible = new Set();
const button = document.getElementById('playAll');
let together = false, started = 0;
const clockTime = () => ((performance.now() - started) / 1000) % 8.242;
function putVideo(cell, path, poster) {
  if (!path || cell.dataset.path === path) return;
  cell.replaceChildren();
  const v = document.createElement('video');
  v.controls = true; v.muted = true; v.playsInline = true; v.preload = 'none';
  v.dataset.src = path;
  if (poster) v.poster = poster;
  cell.append(v); cell.dataset.path = path;
  if (visible.has(cell.closest('tr'))) load(cell.closest('tr'));
}
function load(row) {
  for (const v of row.querySelectorAll('video[data-src]')) {
    if (!v.src) {v.src = v.dataset.src; v.load();}
  }
}
function unload(row) {
  for (const v of row.querySelectorAll('video')) {
    v.pause(); v.removeAttribute('src'); v.load();
  }
}
function play(row) {
  load(row);
  for (const v of row.querySelectorAll('video')) {
    const sync = () => {if (Number.isFinite(v.duration)) v.currentTime = Math.min(clockTime(), Math.max(0, v.duration - .03));};
    if (v.readyState >= 1) sync(); else v.addEventListener('loadedmetadata', sync, {once:true});
    v.play().catch(() => {});
  }
}
const observer = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) {visible.add(e.target); load(e.target); if (together) play(e.target);}
    else {visible.delete(e.target); unload(e.target);}
  }
}, {threshold: .1});
for (const row of rows) {
  putVideo(row.querySelector('.source'), SOURCE, SOURCE_POSTER);
  observer.observe(row);
}
async function refresh() {
  try {
    const response = await fetch('./fulltail-r45-corrected-results.json?v=' + Date.now());
    if (!response.ok) throw Error(response.status);
    const data = await response.json();
    let ready = 0;
    for (const row of rows) {
      const item = data.jobs[row.dataset.key] || {};
      const base = data.jobs[row.dataset.baseline] || {};
      const status = row.querySelector('.status');
      status.textContent = item.review_result === 'failed' && item.status === 'ready_for_visual_review' ? '247 帧目视未通过' : item.review_result === 'failed' ? `中段已失稳；仍在跑 ${item.windows_completed || 0}/${item.total_windows || 0}` : item.status === 'ready_for_visual_review' ? '247 帧完成，待目视验收' : item.status === 'running' ? `推理中 ${item.windows_completed || 0}/${item.total_windows || 0} 窗` : item.status === 'queued' ? '排队中' : item.status === 'failed' ? '推理失败，见进度记录' : '待生成';
      status.className = 'status ' + (item.review_result === 'failed' ? 'failed' : item.status === 'ready_for_visual_review' ? 'ready' : '');
      status.title = item.review_note || item.error || '';
      if (base.video) putVideo(row.querySelector('.baseline'), base.video, base.poster);
      if (item.video) {putVideo(row.querySelector('.result'), item.video, item.poster); ready++;}
      if (visible.has(row) && together) play(row);
    }
    document.getElementById('totals').textContent = `${ready}/${rows.length} 条 247 帧整段结果已可看；只加载当前可见行。`;
  } catch (e) {document.getElementById('totals').textContent = '读取状态失败：' + e;}
}
button.onclick = () => {
  together = !together;
  button.textContent = together ? '一起暂停' : '所有视频一起播';
  if (together) {started = performance.now(); for (const row of visible) play(row);}
  else for (const v of document.querySelectorAll('video')) v.pause();
};
setInterval(() => {
  if (!together) return;
  const t = clockTime();
  for (const row of visible) for (const v of row.querySelectorAll('video')) {
    if (v.readyState >= 1 && Math.abs(v.currentTime - t) > .35)
      v.currentTime = Math.min(t, Math.max(0, v.duration - .03));
  }
}, 1000);
refresh(); setInterval(refresh, 60000);
