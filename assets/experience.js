let ambienceNodes=[],ambienceMaster=null;
function stopSeasonSound(fade=false){
 const nodes=ambienceNodes,master=ambienceMaster;ambienceNodes=[];ambienceMaster=null;
 const cleanup=()=>nodes.forEach(n=>{try{n.stop?.();n.disconnect();}catch{}});
 if(fade&&master&&audioCtx?.state==='running'){
  const now=audioCtx.currentTime;master.gain.cancelAndHoldAtTime(now);master.gain.linearRampToValueAtTime(0,now+1.8);setTimeout(cleanup,1900);
 }else cleanup();
}
function startSeasonSound(){
 stopSeasonSound(true);if(!soundEnabled||!farmEntered||document.hidden)return;ensureFarmAudio();if(!audioCtx)return;
 const ctx=audioCtx,now=ctx.currentTime;
 const master=ctx.createGain();master.gain.setValueAtTime(0,now);master.gain.linearRampToValueAtTime(1,now+4);master.connect(ctx.destination);ambienceMaster=master;ambienceNodes.push(master);
 const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const data=buffer.getChannelData(0);let soft=0;
 for(let i=0;i<data.length;i++){soft=(soft+Math.random()*0.08-0.04)*.98;data[i]=soft;}
 const noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;
 const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=[1000,650,750,350][currentSeason];
 const gain=ctx.createGain();gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime([.07,.04,.085,.10][currentSeason],now+4);
 noise.connect(filter).connect(gain).connect(master);noise.start();
 const pulse=ctx.createOscillator(),depth=ctx.createGain();pulse.frequency.value=[.055,.04,.05,.03][currentSeason];depth.gain.value=.005;pulse.connect(depth).connect(gain.gain);pulse.start();
 ambienceNodes.push(noise,filter,gain,pulse,depth);
 // A quiet suspended chord, softly detuned like distant orbiting signals.
 const padGain=ctx.createGain(),padFilter=ctx.createBiquadFilter();padFilter.type='lowpass';padFilter.frequency.value=380;
 padGain.gain.setValueAtTime(0,now);padGain.gain.linearRampToValueAtTime(.009,now+6);
 padFilter.connect(padGain).connect(master);
 const notes=[[130.81,196,293.66],[110,164.81,246.94],[98,146.83,220],[87.31,130.81,196]][currentSeason];
 notes.forEach((frequency,i)=>{const tone=ctx.createOscillator();tone.type='sine';tone.frequency.value=frequency;tone.detune.value=(i-1)*4;tone.connect(padFilter);tone.start();ambienceNodes.push(tone);});
 const orbit=ctx.createOscillator(),orbitDepth=ctx.createGain();orbit.frequency.value=.025;orbitDepth.gain.value=.0015;orbit.connect(orbitDepth).connect(padGain.gain);orbit.start();ambienceNodes.push(padGain,padFilter,orbit,orbitDepth);

 if(currentSeason===0||currentSeason===1){const bird=ctx.createOscillator(),birdGain=ctx.createGain(),lfo=ctx.createOscillator(),sweep=ctx.createGain();bird.frequency.value=currentSeason===0?880:1046.5;lfo.frequency.value=currentSeason===0?.3:.4;sweep.gain.value=35;birdGain.gain.value=.0004;lfo.connect(sweep).connect(bird.frequency);bird.connect(birdGain).connect(master);bird.start();lfo.start();ambienceNodes.push(bird,birdGain,lfo,sweep);}
}
window.addEventListener('pagehide',()=>stopSeasonSound());
