(() => {
  'use strict';
  const summary = document.getElementById('current-summary');
  const count = document.getElementById('current-count');
  const casesNode = document.getElementById('current-cases');
  const methodsNode = document.getElementById('current-methods');
  const updated = document.getElementById('current-updated');
  const repairNode = document.getElementById('current-repair');
  let requiresRepairAudit = false;
  let requiresContext81Audit = false;
  let requiresFixedBackgroundAudit = false;
  let requiresIndependentNoiseAudit = false;
  let requiresJointAudit = false;
  let requiresReferenceAudit = false;
  let lastPayload = null;
  const labels = {
    pending_input_audit: '输入及执行代码恢复中',
    waiting_original_endpoint: '等待原始无损 Stage2 末帧',
    held_for_diagnosis: '暂缓扩展，先查共同故障', queued: '排队中', running: '整段生成中', failed: '执行失败，待修复',
    initial_diagnostic_running: '首窗接口核验中，不计完整结果', initial_diagnostic_complete: '首窗接口检查完成，等待整段基线验证', waiting_core_fulltail_gate: '待共同故障完整修复验证', generated: '原生输出已生成，完整核验待完成'
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
  function complete(job, spec, method) {
    const audit = job.audit || {};
    if (requiresReferenceAudit) return job.status === 'verified_eof' && audit.passed === true &&
      audit.output_frames === spec.real_frames && Array.isArray(audit.source_range) && audit.source_range.length === 2 &&
      audit.source_range.every((frame, index) => frame === spec.source_range[index]) && audit.stage2_endpoint_sha256 === spec.endpoint_sha256 &&
      audit.actual_original_method === method.key && audit.native_context_frames === method.window_frames &&
      audit.all_actual_native_window_calls_and_inputs_verified === true &&
      audit.all_original_source_and_condition_PIL_hashes_verified === true &&
      audit.all_native_windows_original_G1_target_source_and_camera_first_latents_aligned === true &&
      audit.all_actual_sampled_latents_verified_and_assembled_without_RGB_recurrence === true &&
      audit.only_later_reference_latents_discarded_output_source_order_once === true &&
      audit.all_lossless_global_native_RGB_hashes_verified === true &&
      audit.method_binding_verified === true &&
      audit.native_denoise_body_unchanged_only_decode_tail_skipped === true &&
      audit.source_time_offset_training21_verified === true;
    if (requiresJointAudit) return job.status === 'verified_eof' && audit.passed === true &&
      audit.output_frames === spec.real_frames && Array.isArray(audit.source_range) && audit.source_range.length === 2 &&
      audit.source_range.every((frame, index) => frame === spec.source_range[index]) && audit.stage2_endpoint_sha256 === spec.endpoint_sha256 &&
      audit.actual_original_method === method.key && audit.native_context_frames === method.window_frames &&
      audit.first_latent_pinning_verified === true && audit.original_source_frame_order_verified === true && audit.method_binding_verified === true &&
      audit.global_shared_noise_and_latent_trajectory_verified === true && audit.actual_all_native_model_windows_verified === true &&
      audit.actual_source_and_camera_sliced_with_each_model_window_verified === true && audit.native_core_reference_qualifications_verified === true &&
      audit.no_generated_RGB_reencoding_feedback_verified === true && audit.native_RGB_lossless_full_EOF_verified === true &&
      audit.core_time_position_repair_verified === true;

    return job.status === 'verified_eof' && audit.passed === true && audit.output_frames === spec.real_frames &&
      Array.isArray(audit.source_range) && audit.source_range.length === 2 &&
      audit.source_range.every((frame, index) => frame === spec.source_range[index]) &&
      audit.stage2_endpoint_sha256 === spec.endpoint_sha256 &&
      audit.window_chain_verified === true && audit.first_latent_pinning_verified === true &&
      audit.original_source_frame_order_verified === true && audit.method_binding_verified === true &&
      (!requiresRepairAudit || audit.core_time_position_repair_verified === true) &&
      (!requiresIndependentNoiseAudit || (audit.per_window_noise_schedule_verified === true && audit.distinct_window_noise_tensors_verified === true && audit.native_RGB_lossless_handoff_verified === true && audit.fixed_observed_target_background_depth_verified === true)) &&
      (!requiresFixedBackgroundAudit || (audit.fixed_observed_target_background_depth_verified === true && audit.kept_native_output_endpoint_chain_verified === true)) &&
      (!requiresContext81Audit || (audit.native81_context_verified === true && audit.kept_native_output_endpoint_chain_verified === true && audit.discarded_context_predictions_not_counted_as_output === true));
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
      requiresRepairAudit = Boolean(data.repair_campaign?.version);
      requiresContext81Audit = data.repair_campaign?.version === 'native81_context_v2';
      requiresFixedBackgroundAudit = data.repair_campaign?.version === 'fixed_target_background_depth_v3';
      requiresIndependentNoiseAudit = data.repair_campaign?.version === 'per_window_noise_lossless_v6';
      requiresJointAudit = data.repair_campaign?.version === 'joint_method_denoising_v11';
      requiresReferenceAudit = data.repair_campaign?.version === 'reference_owned_latents_v13';
      const payload = JSON.stringify([data.summary, data.cases, data.methods, data.jobs, data.repair_diagnosis, data.repair_campaign]);
      if (payload === lastPayload) return;
      if (repairNode && data.repair_diagnosis) {
        const fragment = document.createDocumentFragment();
        for (const finding of data.repair_diagnosis.findings || []) fragment.append(element('p', finding));
        for (const evidence of data.repair_diagnosis.evidence || []) if (mediaPath(evidence.image)) {
          const detail = element('details'); detail.append(element('summary', evidence.label));
          const image = element('img'); image.src = evidence.image; image.alt = evidence.label;
          image.style.width = '100%'; image.style.maxWidth = '1280px'; image.style.maxHeight = 'none'; image.style.float = 'none';
          detail.append(image); fragment.append(detail);
        }
        const archive = element('a', '查看修复前失败记录（不计入修复版）'); archive.href = data.repair_diagnosis.prior_bad_campaign || './recovery-before-time-position-repair-20261115.json';fragment.append(archive);
        repairNode.replaceChildren(fragment);
      }
      const ids = ['case13', 'case12'];
      const caseCards = document.createDocumentFragment();
      for (const id of ids) {
        const spec = data.cases[id];
        const card = element('article');
        if (mediaPath(spec.endpoint_preview)) {
          const image = element('img'); image.src = spec.endpoint_preview;
          image.alt = spec.endpoint_kind === 'new_native' ? spec.label + '本轮新生成的原生 Stage2 末帧' : spec.original_lossless_endpoint_recovered ? spec.label + '原始 Stage2 末帧' : spec.label + '历史缩略图，仅供辨认';
          card.append(image);
        }
        card.append(element('h3', spec.label));
        card.append(element('p', `源帧 f${spec.source_range[0]}–f${spec.source_range[1]}，共 ${spec.real_frames} 帧；${spec.stage2_angle_label}。`));
        card.append(element('p', spec.input_status, 'state'));
        card.append(element('code', (spec.endpoint_kind === 'new_native' ? '本轮新原生末帧 SHA256：' : '原始末帧 SHA256：') + spec.endpoint_sha256));
        if (spec.original_endpoint_sha256) card.append(element('p', '历史末帧仍缺失，本轮输入与历史文件不同；14 个方案统一使用上述新原生末帧。'));
        if (mediaPath(spec.stage2_video)) {
          const detail = element('details'); detail.append(element('summary', '查看本轮原生 Stage2'));
          detail.append(video(spec.stage2_video)); card.append(detail);
        }
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
          const finished = complete(job, spec, method);
          let message = labels[job.status] || '等待执行';
          if (finished) {
            verified++;
            if (job.quality === 'passed') {passed++; message = '画质通过；帧数与输入已核对';}
            else message = (job.quality === 'failed' ? '画质未通过' : '画质待审，尚未通过验收') + '；帧数与输入已核对';
          } else if (job.status === 'verified_eof') message = '完整审计证据不齐，尚不能计为完成';
          if (job.status === 'running') message += job.joint_global_trajectory ? ` ${job.global_steps_completed || 0}/50 步；每步 ${job.model_windows_per_step} 个 ${method.window_frames} 帧窗` : ` ${job.windows_completed || 0}/${job.total_windows || '?'} 窗`;
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
      count.textContent = `本轮帧数与输入核对：${verified} / ${data.methods.length * ids.length}；画质通过：${passed} / ${data.methods.length * ids.length}。`;
      casesNode.replaceChildren(caseCards); methodsNode.replaceChildren(rows);
      lastPayload = payload;
    } catch (error) {
      summary.textContent = '读取本轮状态失败：' + error.message + '。以下历史结果不代表本轮进度。';
    }
  }
  refresh(); setInterval(refresh, 60000);
})();
