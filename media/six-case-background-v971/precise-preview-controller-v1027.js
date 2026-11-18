const videos = [...document.querySelectorAll('video')];
const statusLabel = document.getElementById('play-status');
const modeButton = document.getElementById('preview-mode');
const supportsExact = Boolean(document.createElement('video').canPlayType('video/webm; codecs="vp9"'));
let exactMode = supportsExact;
let playGeneration = 0;
function desiredSource(video) {
  return video.dataset.exactSrc ? (exactMode ? video.dataset.exactSrc : video.dataset.lightSrc) : video.dataset.src;
}
function load(video) {
  if (video.getAttribute('src')) return;
  video.dataset.usedFallback = '';
  video.src = desiredSource(video);
  video.load();
}
for (const video of videos) {
  video.addEventListener('error', () => {
    if (video.dataset.exactSrc && video.dataset.usedFallback !== 'yes' && video.getAttribute('src') !== video.dataset.lightSrc) {
      video.dataset.usedFallback = 'yes';
      video.src = video.dataset.lightSrc;
      video.load();
    } else {
      video.dispatchEvent(new Event('player-load-failed'));
    }
  });
}
function ready(video) {
  return new Promise(resolve => {
    let timer;
    const finish = ok => {
      clearTimeout(timer);
      video.removeEventListener('loadedmetadata', loaded);
      video.removeEventListener('player-load-failed', failed);
      resolve(ok);
    };
    const loaded = () => finish(true);
    const failed = () => finish(false);
    video.addEventListener('loadedmetadata', loaded);
    video.addEventListener('player-load-failed', failed);
    timer = setTimeout(failed, 45000);
    load(video);
    if (video.readyState >= 1) finish(true);
    else if (video.error && video.dataset.usedFallback === 'yes') failed();
  });
}
const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  if (entry.target.tagName === 'VIDEO') load(entry.target);
  else if (entry.target.dataset.src && !entry.target.src) entry.target.src = entry.target.dataset.src;
  observer.unobserve(entry.target);
}), {rootMargin: '100px'});
videos.forEach(video => observer.observe(video));
document.querySelectorAll('.input-card img[data-src]').forEach(img => observer.observe(img));
document.getElementById('play').onclick = async () => {
  const generation = ++playGeneration;
  statusLabel.textContent = '正在加载全部视频…';
  const loaded = await Promise.all(videos.map(ready));
  if (generation !== playGeneration) return;
  const playable = videos.filter((video, i) => loaded[i]);
  playable.forEach(video => { video.muted = true; video.currentTime = 0; });
  await Promise.allSettled(playable.map(video => video.play()));
  if (generation !== playGeneration) { videos.forEach(video => video.pause()); return; }
  const failed = videos.length - playable.length;
  const fallback = videos.filter(video => video.dataset.usedFallback === 'yes').length;
  statusLabel.textContent = failed ? `${playable.length}个视频已播放；${failed}个暂未加载成功` :
    `全部视频从头播放；${exactMode ? '最新修正版使用精确预览' : '当前为轻量兼容预览'}` + (fallback ? `，${fallback}个已切换兼容播放` : '');
};
document.getElementById('pause').onclick = () => {
  ++playGeneration;
  videos.forEach(video => video.pause());
  statusLabel.textContent = '已暂停全部';
};
function updateModeLabel() {
  modeButton.textContent = exactMode ? '切换轻量预览' : '切换精确预览';
  modeButton.disabled = !supportsExact;
}
updateModeLabel();
modeButton.onclick = async () => {
  ++playGeneration;
  exactMode = !exactMode;
  updateModeLabel();
  const latest = videos.filter(video => video.dataset.exactSrc);
  await Promise.all(latest.map(async video => {
    const resume = !video.paused;
    const position = video.currentTime;
    video.pause();
    video.removeAttribute('src');
    if (await ready(video)) {
      video.currentTime = Math.min(position, Math.max(0, video.duration - 0.05));
      if (resume) await video.play().catch(() => {});
    }
  }));
  statusLabel.textContent = exactMode ? '最新六例已切换精确预览；其他方法保持原视频' : '最新六例已切换轻量预览；精确验收请切回';
};
document.querySelectorAll('details.evidence').forEach(detail => detail.addEventListener('toggle', () => {
  if (detail.open) detail.querySelectorAll('img[data-src]').forEach(img => { if (!img.getAttribute('src')) img.src = img.dataset.src; });
}));
document.getElementById('history').addEventListener('toggle', event => {
  if (event.target.open) {
    const frame = event.target.querySelector('iframe');
    if (!frame.getAttribute('src')) frame.src = frame.dataset.src;
  }
});
const labels = ['复杂 · 屋顶女舞者', '简单 · 原选项 D 半身', 'Hard · 男舞者', '室内女舞者·弯腰与落地', '高机位男舞者·抬膝转身', '女舞者·交叉摆臂与转身'];
document.querySelectorAll('tbody tr').forEach(row => row.querySelectorAll('td').forEach((cell, i) => { cell.dataset.label = labels[i]; }));
