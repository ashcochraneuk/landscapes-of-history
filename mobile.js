const mobileIsActive=()=>window.matchMedia('(max-width:768px)').matches;
const mobileBackdrop=document.getElementById('mobileBackdrop');
const mobileSearchInput=document.getElementById('mobileSearchInput');
const mobileSearchResults=document.getElementById('mobileSearchResults');
const mobileSearchSummary=document.getElementById('mobileSearchSummary');
const mobileSearchTabs=document.getElementById('mobileSearchTabs');

function syncProjectControls(key,on){
 document.querySelectorAll(`[data-project="${key}"]`).forEach(control=>{
  control.classList.toggle('active',on);
  const state=control.querySelector('i');
  if(state)state.textContent=on?'−':'+';
 });
}

function openMobileSheet(name){
 if(!mobileIsActive())return;
 document.querySelectorAll('.mobileSheet').forEach(sheet=>{
  const open=sheet.dataset.sheet===name;
  sheet.classList.toggle('open',open);
  sheet.setAttribute('aria-hidden',String(!open));
 });
 document.querySelectorAll('.mobileNavButton').forEach(button=>button.classList.toggle('active',button.dataset.panel===name));
 mobileBackdrop.classList.add('open');
 setTimeout(()=>map.invalidateSize(),250);
}

function closeMobileSheets(){
 document.querySelectorAll('.mobileSheet').forEach(sheet=>{sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true')});
 document.querySelectorAll('.mobileNavButton').forEach(button=>button.classList.remove('active'));
 mobileBackdrop.classList.remove('open');
 setTimeout(()=>map.invalidateSize(),250);
}

document.querySelectorAll('.mobileNavButton').forEach(button=>button.addEventListener('click',()=>{
 const sheet=document.querySelector(`[data-sheet="${button.dataset.panel}"]`);
 sheet.classList.contains('open')?closeMobileSheets():openMobileSheet(button.dataset.panel);
}));
document.querySelectorAll('.sheetClose').forEach(button=>button.addEventListener('click',closeMobileSheets));
mobileBackdrop.addEventListener('click',closeMobileSheets);
document.getElementById('mobileSearchOpen').addEventListener('click',()=>{openMobileSheet('search');setTimeout(()=>mobileSearchInput.focus(),300)});

document.querySelectorAll('.mobileProjectCard').forEach(card=>card.addEventListener('click',()=>{
 const key=card.dataset.project,p=projects[key];
 clearSearchMap();
 if(!p.layer)return;
 const on=!map.hasLayer(p.layer);
 on?p.layer.addTo(map):map.removeLayer(p.layer);
 syncProjectControls(key,on);
}));

function setMobileMapStyle(value){
 map.removeLayer(loh);map.removeLayer(osm);map.removeLayer(satelliteBasemap);
 if(value==='osm')osm.addTo(map);else if(value==='satellite')satelliteBasemap.addTo(map);else loh.addTo(map);
 document.querySelectorAll('input[name="mapStyle"],input[name="mobileMapStyle"]').forEach(input=>input.checked=input.value===value);
}
document.querySelectorAll('input[name="mobileMapStyle"]').forEach(input=>input.addEventListener('change',function(){setMobileMapStyle(this.value);closeMobileSheets()}));
document.querySelectorAll('input[name="mapStyle"]').forEach(input=>input.addEventListener('change',function(){document.querySelectorAll('input[name="mobileMapStyle"]').forEach(m=>m.checked=m.value===this.value)}));

function renderMobileResults(items){
 mobileSearchResults.innerHTML='';
 [...items].sort((a,b)=>a.name.localeCompare(b.name)).forEach(x=>{
  const button=document.createElement('button');
  button.className='mobileSearchResult';
  const icon=projects[x.key].icon.options.iconUrl;
  const place=x.locality||x.town||x.parish||x.county;
  button.innerHTML=`<img src="${icon}" alt=""><span><strong>${esc(x.name)}</strong><small>${esc(place)} · ${esc(x.project)}</small></span><i>›</i>`;
  button.onclick=()=>{closeMobileSheets();map.flyTo(x.latlng,14,{duration:.8});setTimeout(()=>x.searchMarker&&x.searchMarker.openPopup(),850)};
  mobileSearchResults.appendChild(button);
 });
}

function mobileSearch(){
 const q=norm(mobileSearchInput.value);
 mobileSearchResults.innerHTML='';mobileSearchTabs.innerHTML='';mobileSearchSummary.textContent='';
 if(!q)return;
 const matches=locations.filter(x=>norm(x.name).includes(q)||[x.town,x.locality,x.parish,x.county].some(v=>norm(v)===q));
 if(!matches.length){clearSearchMap();mobileSearchSummary.textContent=`No locations found for “${mobileSearchInput.value.trim()}”.`;return}
 clearProjects();Object.keys(projects).forEach(key=>syncProjectControls(key,false));clearSearchMap();
 matches.forEach(x=>{const marker=L.marker(x.latlng,{icon:projects[x.key].icon});marker.bindPopup(x.popupHTML);marker.addTo(searchLayer);x.searchMarker=marker});
 searchLayer.addTo(map);map.fitBounds(L.latLngBounds(matches.map(x=>x.latlng)),{padding:[45,45],maxZoom:14});
 mobileSearchSummary.textContent=`${matches.length} location${matches.length===1?'':'s'} found for “${mobileSearchInput.value.trim()}”`;
 const keys=[...new Set(matches.map(x=>x.key))];
 if(keys.length>1){
  const addTab=(label,items,on=false)=>{const tab=document.createElement('button');tab.className=`mobileSearchTab${on?' active':''}`;tab.textContent=label;tab.onclick=()=>{mobileSearchTabs.querySelectorAll('.mobileSearchTab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');renderMobileResults(items)};mobileSearchTabs.appendChild(tab)};
  addTab('All',matches,true);keys.forEach(key=>addTab(projects[key].name,matches.filter(x=>x.key===key)));
 }
 renderMobileResults(matches);
}

document.getElementById('mobileSearchButton').addEventListener('click',mobileSearch);
mobileSearchInput.addEventListener('keydown',e=>{if(e.key==='Enter')mobileSearch()});
mobileSearchInput.addEventListener('input',()=>{if(!mobileSearchInput.value.trim()){mobileSearchResults.innerHTML='';mobileSearchTabs.innerHTML='';mobileSearchSummary.textContent='';clearSearchMap()}});
window.addEventListener('resize',()=>{if(!mobileIsActive())closeMobileSheets();setTimeout(()=>map.invalidateSize(),100)});