const API='https://script.google.com/macros/s/AKfycbyN7uLMdAO1G30h_9qwBSH0FEunS6LS7tN7APiznB6ATpDt80sy0-rwpyBDSoCPWVCntw/exec';
window.HYBRID_API=API;

const form=document.getElementById('registrationForm');
if(form){
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const notice=document.getElementById('notice');
    const button=form.querySelector('button');
    const d=new FormData(form);

    notice.className='notice show';
    notice.textContent='Sending your registration...';
    button.disabled=true;
    button.textContent='PROCESSING...';

    const payload={
      action:'register',
      fullName:d.get('fullName'),
      email:d.get('email'),
      whatsapp:d.get('whatsapp'),
      experience:d.get('experience'),
      goal:d.get('goal')
    };

    try{
      // text/plain is a CORS-safelisted content type. The Apps Script
      // backend expects JSON in the request body.
      await fetch(API,{
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=UTF-8'},
        body:JSON.stringify(payload)
      });

      notice.textContent='Your registration request has been sent. This page cannot verify the server response. If you do not hear from the Academy, please contact the Academy before submitting again.';
      button.textContent='REQUEST SENT';
      form.reset();
    }catch(err){
      notice.textContent='We could not send your registration. Please check your internet connection and try again.';
      button.disabled=false;
      button.textContent='SUBMIT REGISTRATION';
    }
  });
}

// Secure student login is not yet implemented in the currently deployed
// backend. Do not send passwords or access codes to an unsupported endpoint.
const login=document.getElementById('loginForm');
if(login){
  login.addEventListener('submit',e=>{
    e.preventDefault();
    const notice=document.getElementById('notice');
    notice.className='notice show';
    notice.textContent='Student login is being connected. Please check back after the Academy confirms that your secure access is ready.';
  });
}

document.querySelectorAll('.menu').forEach(m=>
  m.addEventListener('click',()=>document.querySelector('.nav nav')?.classList.toggle('open'))
);
