(() => {
  'use strict';
  let data=window.CORRECT_SIMPLE_D;
  let last='';
  const text=(node,value)=>{if(node&&node.textContent!==value)node.textContent=value;};
  function reconcile(){
    if(!data||typeof document==='undefined'||!document)return;
    const host=document.getElementById('current-repair');
    if(host){
      let archive=host.querySelector('#wrong-case12-archive');
      for(const article of [...host.querySelectorAll('article[id^="latest-case12-"]')]){
        if(!archive){archive=document.createElement('details');archive.id='wrong-case12-archive';const title=document.createElement('summary');title.textContent='选错案例：室内舞蹈case12，仅保留故障研究记录，不计简单案例验收';archive.append(title);host.append(archive);}
        const details=document.createElement('details');details.id=article.id;const h=article.querySelector('h3');const title=document.createElement('summary');title.textContent='错误案例记录 · '+h.textContent;h.remove();details.append(title,...article.childNodes);archive.append(details);article.remove();
      }
      for(const row of (data.native_decoder_corrected_results||[]).filter(x=>x.case==='case13')){
        const old=document.getElementById('latest-case13-'+row.method);
        if(old&&old.parentElement.id!=='old-global-decoder-archive'){
          let keep=host.querySelector('#old-global-decoder-archive');
          if(!keep){keep=document.createElement('details');keep.id='old-global-decoder-archive';const summary=document.createElement('summary');summary.textContent='保留对照：此前跨窗口latent统一解码的视频及旧逐帧图';keep.append(summary);host.append(keep);}
          keep.append(old);
        }
      }
      const table=host.querySelector('#latest-method-status');
      if(table){
        text(table.querySelector('thead tr').lastElementChild,'正确简单D · 81帧 · 固定DD81参考修复协议');
        [...table.querySelectorAll('tbody tr')].forEach((row,i)=>{const job=data.original14_status[i];if(job)text(row.lastElementChild,job.complete?'固定DD81参考的完整修复版已生成，动作与闪动待验收':'该适配组合的完整修复版尚未生成；正在按修正输入测试');});
      }
    }
    text(document.getElementById('latest-count'),`原28项中的原窗口VAE解码修正版：${data.native_decoder_corrected_count||0}/28，使用相同DD采样结果、不重复计数；复杂舞蹈原14方案：14条完整候选，新增${(data.additional_complex_results||[]).length}条完整研究／协议对照；正确D原14适配组合的固定DD81参考修复版：${data.original14_complete_count}/14；D额外完整对照／强度诊断${data.additional_native81_results.length}条。下方还保留原纯DD分段基线及修复版对照，修复版不重复计数。选错的室内舞蹈结果不计数。当前完整对照共${data.current_full_comparison_count||52}条（含${data.current_failed_comparison_count||4}条明确失败），不等同于论文方法数量；原28项满屏彩噪筛查${data.original28_color_only_passed_count||0}/28。整体画质待用户验收。`);
    text(document.getElementById('current-title'),'正确两例的完整结果与修复进度');
    text(document.getElementById('current-summary'),'当前验收对象：原屋顶女性复杂舞蹈，以及选项D白衬衣绿植背景的女性半身。此前室内舞蹈case12选错，已归为故障研究记录。完整生成、彩噪消除、动作一致与闪动验收分别记录。');
    const cards=document.querySelectorAll('#current-cases article');if(cards[1])cards[1].hidden=true;
    let section=document.getElementById('correct-simpleD');
    if(!section){section=document.createElement('section');section.id='correct-simpleD';section.className='recovery';document.getElementById('current-rerun').before(section);}
    const signature=JSON.stringify([data.additional_native81_results,data.original14_status,data.original14_results,data.additional_simple_repair_results,data.additional_complex_results,data.native_decoder_corrected_results,data.source_action_references,data.inference_diagnosis,data.original28_color_only_passed_count]);
    if(signature===last&&section.childElementCount)return;
    last=signature;section.replaceChildren();
    const h=document.createElement('h2');h.textContent='已纠正的简单案例 · D 白衬衣、绿植背景、女性半身';section.append(h);
    const p=document.createElement('p');p.textContent='原片f259–f339，共81个真实源帧；沿用已恢复的原生Stage2 +30°末帧。下面是本轮实际模型输出，均保留核验记录。';section.append(p);
    const anchors=document.createElement('div');anchors.className='anchors';
    for(const [src,label] of [[data.source_image,'正确D原片高光帧'],[data.stage2_image,'共同Stage2 +30°末帧']]){const f=document.createElement('figure');const image=document.createElement('img');image.src=src;image.alt=label;const c=document.createElement('figcaption');c.textContent=label;f.append(image,c);anchors.append(f);}section.append(anchors);
    const grid=document.createElement('div');grid.className='candidate-grid';
    const addRow=(row,target)=>{const article=document.createElement('article');const title=document.createElement('h3');title.textContent=row.label+` · 完整${row.frames}帧 · `+(row.quality_status==='failed'?'画质未通过':'画质待验收');const note=document.createElement('p');note.textContent=(row.color_only_screen_passed?'满屏彩噪筛查通过（逐帧缩略图及真实EOF）；这不代表细节、动作或闪动已通过。 ':'')+row.note;const video=document.createElement('video');video.controls=true;video.muted=true;video.playsInline=true;video.preload='none';video.src=row.video;const link=document.createElement('a');link.href=row.audit;link.textContent='查看实际NN输入、采样步数与全部帧核验记录';article.append(title,note,video,link);target.append(article);};
    const fixed=data.native_decoder_corrected_results||[];
    if(fixed.length){
      const panel=document.createElement('div');panel.id='native-VAE-context-repair';const title=document.createElement('h2');title.textContent=`优先验收：原窗口VAE解码修正版 ${fixed.length}/28`;
      const note=document.createElement('p');note.textContent='保留同一份DD采样结果，恢复每个窗口原有的因果解码上下文，再按源时间排列完整原生帧。只去重参考帧和EOF占位，没有视频平滑或插帧；这次是推理解码修正，不增加论文方法计数。动作、场景与剩余闪动仍待验收。';
      const list=document.createElement('div');list.className='candidate-grid native-decoder-results';for(const row of fixed){addRow(row,list);const card=list.lastElementChild;const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='查看本修正版全部真实源帧';const picture=document.createElement('img');picture.src=row.all_frames_image;picture.alt=row.label+' 全部原生帧';picture.loading='lazy';picture.style.width='100%';details.append(summary,picture);card.append(details);}panel.append(title,note);
      const diagnosis=document.createElement('details');diagnosis.id='inference-cause-diagnosis';const diagnosisTitle=document.createElement('summary');diagnosisTitle.textContent='彩噪原因、闪动修正证据与新增方法测试结论';const diagnosisText=document.createElement('p');diagnosisText.textContent='旧短窗源时间位置起点6/11与训练21不一致，且异常DD参考递归反馈会放大噪声。本批修复还明确使用固定同源生成参考，并非仅改一行即可。另已确认跨独立窗口latent统一VAE解码会引入额外闪动：同一份DD采样，恢复各窗原生VAE上下文后，D21/41静态背景变化分别下降约64%/40%；未平滑或插帧。新研究含EAV、FreeNoise、FreeLong、STG、SAGA组件；SAN两项彩噪、D的FreeLong背景漂移、复杂例无整段先验中段场景丢失共4项失败已标明。其余也仍需验收动作、人物和剩余闪动。';diagnosis.append(diagnosisTitle,diagnosisText);
      if(data.inference_diagnosis){const report=document.createElement('a');report.href=data.inference_diagnosis.report;report.textContent='查看完整原因、推理核验、论文作者来源及配对数据';const picture=document.createElement('img');picture.src=data.inference_diagnosis.plot;picture.alt='同一DD采样结果：只改变VAE上下文的静态背景帧间变化对照，非总体画质评分';picture.loading='lazy';picture.style.width='100%';diagnosis.append(report,picture);}panel.append(diagnosis);const sources=document.createElement('div');sources.className='candidate-grid original-action-references';for(const source of (data.source_action_references||[])){const card=document.createElement('article');const heading=document.createElement('h3');heading.textContent=source.label+` · f${source.source_range[0]}–f${source.source_range[1]}`;const text=document.createElement('p');text.textContent=source.role;const video=document.createElement('video');video.controls=true;video.muted=true;video.playsInline=true;video.preload='none';video.src=source.video;card.append(heading,text,video);sources.append(card);}panel.append(sources,list);section.prepend(panel);
    }
    for(const row of [...(data.original14_results||[]),...data.additional_native81_results,...(data.additional_simple_repair_results||[])]){if(row.failure_kind==='widespread_confetti'){let archive=section.querySelector('#failed-new-noise-research');if(!archive){archive=document.createElement('details');archive.id='failed-new-noise-research';const summary=document.createElement('summary');summary.textContent='新增研究失败对照：SAN噪声组件导致彩噪，已停止扩展；原28项修复未使用它';archive.append(summary);section.append(archive);}addRow(row,archive);}else addRow(row,grid);}section.append(grid);
    const complex=data.additional_complex_results||[];
    if(complex.length){const title=document.createElement('h2');title.textContent='复杂舞蹈 · 新增DD研究与协议对照 · 完整247帧';const extra=document.createElement('div');extra.className='candidate-grid';for(const row of complex)addRow(row,extra);section.append(title,extra);}
  }
  window.reconcileCorrectSimpleD=reconcile;reconcile();
  new MutationObserver(reconcile).observe(document.querySelector('main'),{childList:true,subtree:true});
  setInterval(async()=>{try{const r=await fetch('./correct-simpleD-status.json?v='+Date.now(),{cache:'no-store'});if(r.ok){data=await r.json();reconcile();}}catch(_){}},60000);
})();
