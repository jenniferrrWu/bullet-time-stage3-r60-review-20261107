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
      const table=host.querySelector('#latest-method-status');
      if(table){
        text(table.querySelector('thead tr').lastElementChild,'正确简单D · 白衬衣绿植半身 · 81帧');
        [...table.querySelectorAll('tbody tr')].forEach((row,i)=>{const job=data.original14_status[i];if(job)text(row.lastElementChild,job.complete?'正确D完整结果已生成，等待动作与闪动验收':'正确D新版完整结果尚未生成；正在按修正输入测试');});
      }
    }
    text(document.getElementById('latest-count'),`复杂舞蹈原14方案：14条完整候选，新增${(data.additional_complex_results||[]).length}条完整研究方案；正确简单D原14方案：${data.original14_complete_count}/14条完整结果；另有${data.additional_native81_results.length}条D原生81帧及${(data.additional_simple_repair_results||[]).length}条接缝修复对照。选错的室内舞蹈结果不计数。整体通过仍为0。`);
    text(document.getElementById('current-title'),'正确两例的完整结果与修复进度');
    text(document.getElementById('current-summary'),'当前验收对象：原屋顶女性复杂舞蹈，以及选项D白衬衣绿植背景的女性半身。此前室内舞蹈case12选错，已归为故障研究记录。完整生成、彩噪消除、动作一致与闪动验收分别记录。');
    const cards=document.querySelectorAll('#current-cases article');if(cards[1])cards[1].hidden=true;
    let section=document.getElementById('correct-simpleD');
    if(!section){section=document.createElement('section');section.id='correct-simpleD';section.className='recovery';document.getElementById('current-rerun').before(section);}
    const signature=JSON.stringify([data.additional_native81_results,data.original14_status,data.original14_results,data.additional_simple_repair_results,data.additional_complex_results]);
    if(signature===last&&section.childElementCount)return;
    last=signature;section.replaceChildren();
    const h=document.createElement('h2');h.textContent='已纠正的简单案例 · D 白衬衣、绿植背景、女性半身';section.append(h);
    const p=document.createElement('p');p.textContent='原片f259–f339，共81个真实源帧；沿用已恢复的原生Stage2 +30°末帧。下面是本轮实际模型输出，均保留核验记录。';section.append(p);
    const anchors=document.createElement('div');anchors.className='anchors';
    for(const [src,label] of [[data.source_image,'正确D原片高光帧'],[data.stage2_image,'共同Stage2 +30°末帧']]){const f=document.createElement('figure');const image=document.createElement('img');image.src=src;image.alt=label;const c=document.createElement('figcaption');c.textContent=label;f.append(image,c);anchors.append(f);}section.append(anchors);
    const grid=document.createElement('div');grid.className='candidate-grid';
    const addRow=(row,target)=>{const article=document.createElement('article');const title=document.createElement('h3');title.textContent=row.label+` · 完整${row.frames}帧 · 画质待验收`;const note=document.createElement('p');note.textContent=row.note;const video=document.createElement('video');video.controls=true;video.muted=true;video.playsInline=true;video.preload='none';video.src=row.video;const link=document.createElement('a');link.href=row.audit;link.textContent='查看实际NN输入、采样步数与全部帧核验记录';article.append(title,note,video,link);target.append(article);};
    for(const row of [...(data.original14_results||[]),...data.additional_native81_results,...(data.additional_simple_repair_results||[])])addRow(row,grid);section.append(grid);
    const complex=data.additional_complex_results||[];
    if(complex.length){const title=document.createElement('h2');title.textContent='复杂舞蹈 · 新增DD研究方法 · 完整247帧';const extra=document.createElement('div');extra.className='candidate-grid';for(const row of complex)addRow(row,extra);section.append(title,extra);}
  }
  window.reconcileCorrectSimpleD=reconcile;reconcile();
  new MutationObserver(reconcile).observe(document.querySelector('main'),{childList:true,subtree:true});
  setInterval(async()=>{try{const r=await fetch('./correct-simpleD-status.json?v='+Date.now(),{cache:'no-store'});if(r.ok){data=await r.json();reconcile();}}catch(_){}},60000);
})();
