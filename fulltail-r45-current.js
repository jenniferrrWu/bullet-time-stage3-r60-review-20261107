(() => {
  'use strict';
  const summary = document.getElementById('current-summary');
  const count = document.getElementById('current-count');
  const casesNode = document.getElementById('current-cases');
  const methodsNode = document.getElementById('current-methods');
  const updated = document.getElementById('current-updated');
  let lastPayload = null;
  const labels = {
    pending_input_audit: '输入及执行代码恢复中',
    waiting_original_endpoint: '等待原始无损 Stage2 末帧',
    queued: '排队中', running: '原生推理中', failed: '执行失败，待修复',
    generated: '原生输出已生成，完整核验待完成'
  };
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function mediaPath(path) {
    return typeof path === 'string' && path.startsWith('./media/') && !path.includes('..');
  }
  function complete(job, spec) {
    const audit = job.audit || {};
    return job.status === 'verified_eof' && audit.passed === true && audit.output_frames === spec.real_frames &&
      Array.isArray(audit.source_range) && audit.source_range.length === 2 &&
      audit.source_range.every((frame, index) => frame === spec.source_range[index]) &&
      audit.stage2_endpoint_sha256 === spec.endpoint_sha256 &&
      audit.window_chain_verified === true && audit.first_latent_pinning_verified === true &&
      audit.original_source_frame_order_verified === true;
  }
  function video(path) {
    const node = element('video');
    node.controls = true; node.muted = true; node.playsInline = true;
    node.preload = 'none'; node.src = path;
    return node;
  }
  async function refresh() {
    try {
      const response = await fetch('./recovery-20261114-status.json?v=' + Date.now(), {cache: 'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      updated.textContent = '状态更新时间：' + new Date(data.updated_at).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'}) + '（北京时间）';
      const payload = JSON.stringify([data.summary, data.cases, data.methods, data.jobs]);
      if (payload === lastPayload) return;
      const ids = ['case13', 'case12'];
      const caseCards = document.createDocumentFragment();
      for (const id of ids) {
        const spec = data.cases[id];
        const card = element('article');
        if (mediaPath(spec.endpoint_preview)) {
          const image = element('img'); image.src = spec.endpoint_preview;
          image.alt = spec.original_lossless_endpoint_recovered ? spec.label + '原始 Stage2 末帧' : spec.label + '历史缩略图，仅供辨认';
          card.append(image);
        }
        card.append(element('h3', spec.label));
        card.append(element('p', `源帧 f${spec.source_range[0]}–f${spec.source_range[1]}，共 ${spec.real_frames} 帧；${spec.stage2_angle_label}。`));
        card.append(element('p', spec.input_status, 'state'));
        card.append(element('code', '原始末帧 SHA256：' + spec.endpoint_sha256));
        if (mediaPath(spec.source_video)) {
          const detail = element('details'); detail.append(element('summary', '查看完整源动作范围'));
          detail.append(video(spec.source_video)); card.append(detail);
        }
        caseCards.append(card);
      }
      const rows = document.createDocumentFragment(); let verified = 0, passed = 0;
      for (const method of data.methods) {
        const row = element('tr'); row.dataset.currentMethod = method.key;
        row.append(element('th', method.label));
        for (const id of ids) {
          const job = (data.jobs[id] || {})[method.key] || {};
          const spec = data.cases[id]; const cell = element('td');
          const finished = complete(job, spec);
          let message = labels[job.status] || '等待执行';
          if (finished) {
            verified++;
            if (job.quality === 'passed') {passed++; message = '完整 EOF 核验通过；画质通过';}
            else message = '完整 EOF 核验通过；' + (job.quality === 'failed' ? '画质未通过' : '画质待审');
          } else if (job.status === 'verified_eof') message = '完整审计证据不齐，尚不能计为完成';
          if (job.status === 'running') message += ` ${job.windows_completed || 0}/${job.total_windows || '?'} 窗`;
          cell.append(element('p', message, finished && job.quality === 'passed' ? 'ready' : job.quality === 'failed' ? 'failed' : 'state'));
          if (job.note) cell.append(element('small', job.note));
          if (mediaPath(job.video)) {
            if (!finished) cell.append(element('small', '局部输出／待完整核验，不能作为整段完成。'));
            cell.append(video(job.video));
          }
          row.append(cell);
        }
        rows.append(row);
      }
      summary.textContent = data.summary;
      count.textContent = `本轮完整 EOF 核验：${verified} / ${data.methods.length * ids.length}；画质通过：${passed} / ${data.methods.length * ids.length}。`;
      casesNode.replaceChildren(caseCards); methodsNode.replaceChildren(rows);
      lastPayload = payload;
    } catch (error) {
      summary.textContent = '读取本轮状态失败：' + error.message + '。以下历史结果不代表本轮进度。';
    }
  }
  refresh(); setInterval(refresh, 60000);
})();
