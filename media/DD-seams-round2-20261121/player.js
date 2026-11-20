(() => {
  'use strict';
  const videos = [...document.querySelectorAll('video')];
  const status = document.querySelector('#status');
  let light = true, command = 0;
  const modeName = () => light ? '轻量预览' : '精确预览';
  const overlay = v => v.parentElement.querySelector('.video-start');
  const showStart = (v, message = '▶ 点击播放') => {
    const button = overlay(v);
    button.hidden = v.readyState >= 2 && !v.error;
    button.disabled = false;
    button.textContent = message;
  };
  function stopAll() {
    ++command;
    videos.forEach(v => { v.pause(); showStart(v); });
  }
  function poster(v) {
    if (!v.getAttribute('poster')) v.poster = v.dataset.poster;
  }
  function playWithDeadline(v) {
    let timer;
    return Promise.race([
      v.play(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('视频加载超时')), 20000); })
    ]).finally(() => clearTimeout(timer));
  }
  async function playOne(v, ticket) {
    if (ticket !== command) return 'cancelled';
    poster(v);
    const button = overlay(v);
    button.hidden = false;
    button.disabled = true;
    button.textContent = '正在加载…';
    const precise = !light && v.canPlayType('video/webm; codecs="vp9"');
    const urls = precise ? [v.dataset.precise, v.dataset.light] : [v.dataset.light];
    for (const url of urls) {
      if (ticket !== command) return 'cancelled';
      try {
        v.preload = 'auto';
        if (v.getAttribute('src') !== url || v.error) { v.src = url; v.load(); }
        v.currentTime = 0;
        await playWithDeadline(v);
        if (ticket !== command) return 'cancelled';
        button.hidden = true;
        button.disabled = false;
        return 'playing';
      } catch (_) {
        if (ticket !== command) return 'cancelled';
        v.pause();
      }
    }
    button.hidden = false;
    button.disabled = false;
    button.textContent = '↻ 点击重试';
    return 'failed';
  }
  async function playGroup(group, label) {
    stopAll();
    const ticket = command, pending = [...group];
    let started = 0, failed = 0;
    const progress = () => { if (ticket === command) status.textContent = `${label}：${started}/${group.length} 段已开始播放${failed ? `，${failed}段可点击重试` : ''} · ${modeName()}`; };
    progress();
    const worker = async () => {
      while (pending.length && ticket === command) {
        const result = await playOne(pending.shift(), ticket);
        if (result === 'playing') ++started;
        if (result === 'failed') ++failed;
        progress();
      }
    };
    // Bound simultaneous starts; all requested clips still play after loading.
    await Promise.all(Array.from({length: Math.min(4, group.length)}, worker));
  }
  videos.forEach(v => {
    overlay(v).onclick = async () => {
      const ticket = command;
      const result = await playOne(v, ticket);
      if (ticket === command) status.textContent = result === 'playing' ? `已开始播放 · ${modeName()}` : result === 'failed' ? '加载失败，可点击重试或直接打开轻量视频。' : '已暂停';
    };
    v.addEventListener('loadeddata', () => { overlay(v).hidden = true; });
    v.addEventListener('error', () => { overlay(v).hidden = false; overlay(v).disabled = false; overlay(v).textContent = '↻ 点击重试'; });
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { poster(e.target); observer.unobserve(e.target); } });
    }, {rootMargin: '80px'});
    videos.forEach(v => observer.observe(v));
  } else videos.slice(0, 6).forEach(poster);
  document.querySelectorAll('[data-play-method]').forEach(button => {
    button.onclick = () => playGroup(videos.filter(v => v.dataset.method === button.dataset.playMethod), '本方法');
  });
  document.querySelector('#play').onclick = () => playGroup(videos, '全部视频');
  document.querySelector('#pause').onclick = () => { stopAll(); status.textContent = '全部已暂停'; };
  document.querySelector('#visible').onclick = () => {
    const visible = videos.filter(v => {
      const r = v.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    });
    playGroup(visible, '当前可见视频');
  };
  document.querySelector('#mode').onclick = () => {
    const wasPlaying = videos.filter(v => !v.paused);
    stopAll();
    light = !light;
    videos.forEach(v => {
      if (v.hasAttribute('src')) {
        v.removeAttribute('src'); v.preload = 'none'; v.load(); showStart(v);
      }
    });
    document.querySelector('#mode').textContent = light ? '切换精确预览' : '切换轻量预览';
    status.textContent = light ? '轻量预览：点击播放才加载。检查细微闪动可切换精确预览或清晰版。' : '精确预览：缩放后YUV420逐帧无损，文件较大；仅点击播放时加载。';
    if (wasPlaying.length) playGroup(wasPlaying, '切换画质并从头播放');
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopAll(); status.textContent = '页面离开前台，视频已暂停'; }
  });
})();
