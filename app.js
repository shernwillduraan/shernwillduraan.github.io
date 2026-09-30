const API='https://script.google.com/macros/s/AKfycbwxgOfgGp5IsOvTpxvwqT1lLzIHYG6wvIqlCilmJPfAKqDyax5k5tcI0O-yK7ZhXov2rg/exec';
window.HYBRID_API=API;
const form=document.getElementById('registrationForm');
if(form){form.addEventListener('submit',async e=>{
 e.preventDefault(); const notice=document.getElementById('notice'),button=form.querySelector('button'),d=new FormData(form);
 notice.className='notice show'; notice.textContent='Submitting your registration...'; button.disabled=true; button.textContent='PROCESSING...';
 try{await fetch(API,{method:'POST',mode:'no-cors',body:new URLSearchParams({action:'register',fullName:d.get('fullName'),email:d.get('email'),whatsapp:d.get('whatsapp'),experience:d.get('experience'),goal:d.get('goal')})});
 notice.textContent='Registration received. Keep your email available for the next enrollment step.'; button.textContent='REGISTRATION RECEIVED'; form.reset();
 }catch(err){notice.textContent='We could not reach the registration service. Please try again.';button.disabled=false;button.textContent='SUBMIT REGISTRATION';}
});}
const login=document.getElementById('loginForm');
if(login){login.addEventListener('submit',async e=>{
 e.preventDefault(); const notice=document.getElementById('notice'),button=login.querySelector('button'); notice.className='notice show';notice.textContent='Checking your access...';button.disabled=true;
 try{const email=document.getElementById('email').value.trim(),accessCode=document.getElementById('code').value.trim();const r=await fetch(API,{method:'POST',body:new URLSearchParams({action:'login',email,accessCode})});const j=await r.json();if(j.success){sessionStorage.setItem('hybridStudent',JSON.stringify({...j.student,accessCode}));location.href='student-dashboard.html';}else throw new Error(j.error||'Login details were not accepted.');}
 catch(err){notice.textContent=err.message||'Login could not be completed.';button.disabled=false;}
});}
document.querySelectorAll('.menu').forEach(m=>m.addEventListener('click',()=>document.querySelector('.nav nav')?.classList.toggle('open')));
