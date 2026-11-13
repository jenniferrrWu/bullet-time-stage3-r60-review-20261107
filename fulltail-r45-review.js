const visible = new Set();
const button = document.getElementById('playAll');
let together = false;
let startMs = 0;

const targetTime = () => ((performance.now() - startMs) / 1000) % 8.242;

function loadRow(row) {
  for (const video of row.querySelectorAll('video[data-src]')) {
    if (!video.hasAttribute('src')) {
      video.src = video.dataset.src;
      video.load();
    }
  }
}

function unloadRow(row) {
  for (const video of row.querySelectorAll('video')) {
    video.pause();
    if (video.hasAttribute('src')) {
      video.removeAttribute('src');
      video.load();
    }
  }
}

function startRow(row) {
  loadRow(row);
  for (const video of row.querySelectorAll('video')) {
    if (!video.hasAttribute('src')) continue;
    const seek = () => {
      try {
        video.currentTime = Math.min(targetTime(), Math.max(0, video.duration - 0.03));
      } catch (_) {}
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });
    video.play().catch(() => {});
  }
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      visible.add(entry.target);
      loadRow(entry.target);
      if (together) startRow(entry.target);
    } else {
      visible.delete(entry.target);
      unloadRow(entry.target);
    }
  }
}, { threshold: 0.1 });

for (const row of document.querySelectorAll('tbody tr')) observer.observe(row);

async function refresh() {
  try {
    const response = await fetch('./fulltail-r45-results.json?v=' + Date.now());
    if (!response.ok) throw Error(response.status);
    const data = await response.json();
    let ready = 0;
    for (const row of document.querySelectorAll('tbody tr')) {
      const item = data.jobs[row.dataset.key];
      if (!item) continue;
      const status = row.querySelector('.status');
      status.textContent = item.status === 'ready_for_visual_review'
        ? '247 帧完成，待目视验收'
        : item.status === 'running'
          ? `推理中 ${item.windows_completed || 0}/${item.total_windows || 4} 窗口`
          : item.status === 'queued' ? '排队中' : '失败，见记录';
      status.title = item.error || '';
      status.className = 'status ' + (item.status === 'ready_for_visual_review' ? 'ready' : '');

      const cell = row.querySelector('.result');
      if (item.video && !cell.querySelector('video')) {
        const video = document.createElement('video');
        video.controls = true;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'none';
        video.poster = item.poster;
        video.dataset.src = item.video;
        cell.replaceChildren(video);
      }
      if (item.video) ready++;

      const baseline = data.jobs.dd_baseline;
      const baselineVideo = row.querySelector('video.baseline');
      if (baseline?.video && !baselineVideo.dataset.src) {
        baselineVideo.dataset.src = baseline.video;
        baselineVideo.poster = baseline.poster;
      }
      if (visible.has(row)) {
        loadRow(row);
        if (together) startRow(row);
      }
    }
    document.getElementById('totals').textContent =
      `已完成 ${ready}/${Object.keys(data.jobs).length} 项完整 247 帧 Stage3 实验；视频仅在所在行进入屏幕时加载，滚动离开即释放播放器。`;
  } catch (error) {
    document.getElementById('totals').textContent = '状态更新中：' + error;
  }
}

button.onclick = () => {
  together = !together;
  button.textContent = together ? '一起暂停' : '所有视频一起播';
  if (together) {
    startMs = performance.now();
    for (const row of visible) startRow(row);
  } else {
    for (const video of document.querySelectorAll('video')) video.pause();
  }
};

setInterval(() => {
  if (!together) return;
  const time = targetTime();
  for (const row of visible) {
    for (const video of row.querySelectorAll('video')) {
      if (video.readyState >= 1 && Math.abs(video.currentTime - time) > 0.35) {
        video.currentTime = Math.min(time, Math.max(0, video.duration - 0.03));
      }
    }
  }
}, 1000);

refresh();
setInterval(refresh, 60000);
