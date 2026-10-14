const API='https://script.google.com/macros/s/AKfycbyN7uLMdAO1G30h_9qwBSH0FEunS6LS7tN7APiznB6ATpDt80sy0-rwpyBDSoCPWVCntw/exec';
window.HYBRID_API=API;
const $=id=>document.getElementById(id);
const show=(node,message,kind='')=>{if(!node)return;node.className='notice show'+(kind?' '+kind:'');node.textContent=message;};
async function api(payload){
  const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams(payload)});
  const data=await response.json();
  if(!data||data.success!==true)throw new Error(data&&data.error?data.error:'The Academy service did not confirm the request.');
  return data;
}
const registration=$('registrationForm');
if(registration){
  registration.addEventListener('submit',async e=>{
    e.preventDefault();const notice=$('notice'),button=registration.querySelector('button'),d=new FormData(registration);
    button.disabled=true;button.textContent='SUBMITTING…';show(notice,'Submitting your registration securely…');
    const payload={action:'register',fullName:d.get('fullName'),email:d.get('email'),whatsapp:d.get('whatsapp'),experience:d.get('experience'),goal:d.get('goal')};
    try{
      const result=await api(payload);
      show(notice,'Registration saved successfully. Student ID: '+result.studentId+'. Check your email for confirmation. Your login code will be sent only after payment is verified.');
      button.textContent='REGISTRATION RECEIVED';registration.reset();
    }catch(err){
      show(notice,'We could not verify the registration response. '+(err.message||'Please try again in a moment. If you receive a confirmation email, do not submit a duplicate registration.'));
      button.disabled=false;button.textContent='SUBMIT REGISTRATION';
    }
  });
}
const login=$('loginForm');
if(login){
  const portal=$('studentPortal');
  function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function renderPortal(student,modules){
    if(!portal)return;
    portal.innerHTML='<section class="panel" style="margin-top:24px;padding:24px;border:1px solid #514329;background:#0b0b09"><span class="eyebrow">STUDENT PORTAL · ACTIVE</span><h2 style="color:#e4c46d">Welcome, '+esc(student.fullName)+'</h2><p style="color:var(--muted)">Student ID: '+esc(student.studentId)+' · '+esc(student.email)+'</p><p>Your account is active. Keep your access code private.</p><h3>YOUR LEARNING PATHWAY</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">'+modules.map((m,i)=>'<article style="padding:16px;border:1px solid #332b1c;background:#080807"><span style="color:#d4af37">MODULE '+String(i+1).padStart(2,'0')+'</span><h3>'+esc(m)+'</h3><p style="color:var(--muted);font-size:13px">Included in your Academy program.</p></article>').join('')+'</div><button id="studentLogout" class="button ghost" type="button" style="margin-top:18px">SIGN OUT</button></section>';
    $('studentLogout').addEventListener('click',()=>{sessionStorage.removeItem('htaStudentEmail');sessionStorage.removeItem('htaStudentCode');if(portal)portal.innerHTML='';login.classList.remove('hidden');show($('notice'),'You have signed out.');});
    login.classList.add('hidden');
  }
  async function signIn(email,code){
    const result=await api({action:'login',email,accessCode:code});
    const dash=await api({action:'studentDashboard',email,accessCode:code});
    sessionStorage.setItem('htaStudentEmail',email);sessionStorage.setItem('htaStudentCode',code);
    show($('notice'),'Login successful. Your student portal is ready.');
    renderPortal(result.student,dash.modules||[]);
  }
  login.addEventListener('submit',async e=>{
    e.preventDefault();const email=$('email').value.trim(),code=$('code').value.trim(),button=login.querySelector('button');
    button.disabled=true;button.textContent='SIGNING IN…';show($('notice'),'Verifying your student account…');
    try{await signIn(email,code);}catch(err){show($('notice'),err.message||'Unable to sign in.');}
    finally{button.disabled=false;button.textContent='SIGN IN';}
  });
  const savedEmail=sessionStorage.getItem('htaStudentEmail'),savedCode=sessionStorage.getItem('htaStudentCode');
  if(savedEmail&&savedCode){signIn(savedEmail,savedCode).catch(()=>{sessionStorage.removeItem('htaStudentEmail');sessionStorage.removeItem('htaStudentCode');});}
}
document.querySelectorAll('.menu').forEach(m=>m.addEventListener('click',()=>document.querySelector('.nav nav')?.classList.toggle('open')));
