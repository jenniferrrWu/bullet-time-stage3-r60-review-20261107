(() => {
  'use strict';
  const button = document.getElementById('playAllVideos');
  const status = document.getElementById('all-playback-status');
  const previews = window.REVIEW_PREVIEWS || {};
  let playing = false;
  let generation = 0;
  const attempted = new WeakMap();
  const successful = new Set();
  const failed = new Set();
  window.ReviewPlayback = { get isPlaying() { return playing; } };

  function update() {
    if (!playing) return;
    const videos = [...document.querySelectorAll('video')];
    const active = videos.filter(video => successful.has(video)).length;
    const failures = videos.filter(video => failed.has(video)).length;
    status.textContent = `正在播放 ${active} / ${videos.length} 段（静音循环）` +
      (failures ? `；${failures} 段加载失败，可暂停后重试` : active < videos.length ? '，其余加载中…' : '');
  }

  function prepare(video) {
    const original = video.dataset.originalSrc || video.dataset.src || video.getAttribute('src');
    if (!original) return false;
    const preview = previews[original];
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    if (preview) {
      video.dataset.originalSrc = original;
      if (video.hasAttribute('data-src')) video.dataset.src = preview;
      if (video.getAttribute('src') !== preview) video.setAttribute('src', preview);
      if (!video.nextElementSibling?.classList.contains('original-video-link')) {
        const link = document.createElement('a');
        link.className = 'original-video-link';
        link.textContent = '查看原始视频';
        link.href = original;
        link.target = '_blank';
        link.rel = 'noopener';
        video.after(link);
      }
    }
    return true;
  }

  function start(video) {
    if (!prepare(video) || attempted.get(video) === generation) return;
    const current = generation;
    attempted.set(video, current);
    successful.delete(video);
    failed.delete(video);
    video.loop = true;
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    try { video.currentTime = 0; } catch (_) { /* Metadata may still be loading. */ }
    try {
      Promise.resolve(video.play()).then(() => {
        if (!playing || current !== generation) {
          if (!playing) video.pause();
          return;
        }
        successful.add(video);
        update();
      }, () => {
        if (playing && current === generation) { failed.add(video); update(); }
      });
    } catch (_) { failed.add(video); update(); }
  }

  button.addEventListener('click', () => {
    playing = !playing;
    generation++;
    button.textContent = playing ? '一键暂停全部视频' : '一键播放全部视频';
    button.setAttribute('aria-pressed', String(playing));
    if (playing) {
      for (const video of document.querySelectorAll('video')) start(video);
      update();
    } else {
      for (const video of document.querySelectorAll('video')) video.pause();
      status.textContent = '已暂停全部视频';
    }
  });

  const observer = new MutationObserver(records => {
    const added = new Set();
    for (const record of records) for (const node of record.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.matches('video')) added.add(node);
      for (const video of node.querySelectorAll('video')) added.add(video);
    }
    for (const video of added) { prepare(video); if (playing) start(video); }
    if (added.size) update();
  });
  for (const video of document.querySelectorAll('video')) prepare(video);
  observer.observe(document.querySelector('main'), { childList: true, subtree: true });
})();
