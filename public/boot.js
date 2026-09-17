classGrid.addEventListener('click',event=>{
  const card=event.target.closest('.class-card');
  if(!card) return;
  selectedClass=card.dataset.class;
  document.querySelectorAll('.class-card').forEach(el=>el.classList.toggle('selected',el===card));
  startBtn.disabled=false;
});

startBtn.addEventListener('click',()=>selectedClass&&initGame(selectedClass));
restartBtn.addEventListener('click',restartCurrent);
retryBtn.addEventListener('click',restartCurrent);

window.addEventListener('keydown',event=>{
  const code=event.code;
  if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(code)) event.preventDefault();
  if(!keys.has(code)) justPressed.add(code);
  keys.add(code);
  if(code==='KeyP'&&state&&!state.gameEnded){
    state.paused=!state.paused;
    showBanner(state.paused?'SHIFT PAUSED':'BACK TO WORK',550);
  }
});

window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',()=>keys.clear());

function frame(now){
  const dt=Math.min(.033,(now-last)/1000||0);
  last=now;
  update(dt);
  draw();
  justPressed.clear();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
