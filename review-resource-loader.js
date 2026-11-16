(() => {
  'use strict';
  function disclosed(node) {
    for (let p=node.parentElement;p;p=p.parentElement) if(p.tagName==='DETAILS'&&!p.open)return false;
    return true;
  }
  function load(node) {
    if(!disclosed(node))return;
    if(node.dataset.reviewPoster&&!node.hasAttribute('poster'))node.setAttribute('poster',node.dataset.reviewPoster);
    const source=node.dataset.reviewSrc||node.dataset.src;
    if(source&&!node.hasAttribute('src'))node.setAttribute('src',source);
  }
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.isIntersecting&&disclosed(entry.target)){load(entry.target);observer.unobserve(entry.target);}
  },{rootMargin:'300px 0px'}):null;
  function schedule(root) {
    for(const node of root.querySelectorAll('img[data-review-src],video[data-src]')) {
      if(!disclosed(node))continue;
      if(observer)observer.observe(node);else load(node);
    }
  }
  document.addEventListener('toggle',event=>{if(event.target.tagName==='DETAILS'&&event.target.open)schedule(event.target);},true);
  document.addEventListener('pointerdown',event=>{if(event.target.tagName==='VIDEO')load(event.target);},true);
  document.addEventListener('focusin',event=>{if(event.target.tagName==='VIDEO')load(event.target);});
  schedule(document);
  window.ReviewResources={load,schedule};
})();
