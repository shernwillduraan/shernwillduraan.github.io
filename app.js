const API='https://script.google.com/macros/s/AKfycbwxgOfgGp5IsOvTpxvwqT1lLzIHYG6wvIqlCilmJPfAKqDyax5k5tcI0O-yK7ZhXov2rg/exec';
const form=document.getElementById('registrationForm');
if(form){
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  const notice=document.getElementById('notice'),button=form.querySelector('button');
  const d=new FormData(form);
  notice.className='notice show'; notice.textContent='Submitting your registration...';
  button.disabled=true; button.textContent='PROCESSING...';
  try{
   await fetch(API,{method:'POST',mode:'no-cors',body:new URLSearchParams({action:'register',fullName:d.get('fullName'),email:d.get('email'),whatsapp:d.get('whatsapp'),experience:d.get('experience'),goal:d.get('goal')})});
   notice.textContent='Registration submitted. Your details have been received. Payment is the next step.';
   button.textContent='REGISTRATION RECEIVED'; form.reset();
  }catch(err){notice.textContent='We could not reach the registration service. Please try again.';button.disabled=false;button.textContent='CONTINUE';}
 });
}
const login=document.getElementById('loginForm');
if(login){
 login.addEventListener('submit',async e=>{
  e.preventDefault();
  const notice=document.getElementById('notice'),button=login.querySelector('button');
  notice.className='notice show';notice.textContent='Checking your access...';button.disabled=true;
  try{
   const r=await fetch(API,{method:'POST',body:new URLSearchParams({action:'login',email:document.getElementById('email').value.trim(),accessCode:document.getElementById('code').value.trim()})});
   const j=await r.json();
   if(j.success){sessionStorage.setItem('hybridStudent',JSON.stringify(j.student));location.href='student-dashboard.html';}
   else{throw new Error(j.error||'Login details were not accepted.');}
  }catch(err){notice.textContent=err.message;button.disabled=false;}
 });
}
