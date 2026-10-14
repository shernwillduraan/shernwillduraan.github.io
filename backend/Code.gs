/**
 * HYBRID TRADERS ONLINE ACADEMY — BACKEND 5.1
 * Uses the existing 12-column Students sheet without rewriting its headers/data.
 * Actions: register, login, studentDashboard, owner_login, owner_data,
 * owner_activate, owner_set_status, owner_logout, adminLogin, adminListStudents,
 * adminReport, adminUpdateStudent, adminLogout, health.
 *
 * IMPORTANT: Payment is not verified by a browser request. Until a verified payment
 * provider webhook is configured, the owner must verify payment and activate manually.
 */
const HT_CONFIG = {
  spreadsheetId: '', // If this is a standalone Apps Script, paste the existing Sheet ID here.
  adminEmail: 'shernwillduraan@gmail.com',
  websiteUrl: 'https://shernwillduraan.github.io/',
  packageName: 'Complete Academy Package — $100 one-time',
  sessionSeconds: 1800
};
const HT_HEADERS = {
  Students: ['Timestamp','Student ID','Full Name','Email','WhatsApp','Package','Status','Payment Status','Access Code','Activated At','Last Login','Notes'],
  Journal: ['Timestamp','Student ID','Email','Date','Instrument','Direction','Result','Notes'],
  Activity: ['Timestamp','Action','Student ID','Email','Details'],
  Progress: ['Timestamp','Student ID','Email','Module','Lessons'],
  Assessments: ['Timestamp','Student ID','Email','Module','Score','Total','Passed','Completed At']
};
function htSS_() {
  if (HT_CONFIG.spreadsheetId) return SpreadsheetApp.openById(HT_CONFIG.spreadsheetId);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Set HT_CONFIG.spreadsheetId to your existing academy Google Sheet ID.');
  return ss;
}
function setupAcademy() {
  const ss = htSS_();
  Object.keys(HT_HEADERS).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    const expected = HT_HEADERS[name];
    const first = sh.getRange(1,1,1,Math.max(expected.length, sh.getLastColumn() || 1)).getDisplayValues()[0];
    if (first.every(v => !String(v).trim())) sh.getRange(1,1,1,expected.length).setValues([expected]);
    sh.setFrozenRows(1);
  });
  return 'Academy setup complete. Existing non-empty headers and rows were preserved.';
}
function doGet(e) { return htRoute_(e); }
function doPost(e) { return htRoute_(e); }
function htRoute_(e) {
  try {
    const p = Object.assign({}, e && e.parameter ? e.parameter : {});
    if (e && e.postData && e.postData.contents && String(e.postData.type||'').indexOf('application/json') >= 0) {
      try { Object.assign(p, JSON.parse(e.postData.contents)); } catch (_) {}
    }
    const action = htClean_(p.action || 'health').toLowerCase().replace(/[-_]/g,'');
    switch (action) {
      case 'health': return htJson_({success:true,service:'Hybrid Traders Online Academy',version:'5.1',status:'online'});
      case 'register': return htRegister_(p);
      case 'login': case 'studentlogin': return htLogin_(p);
      case 'studentdashboard': return htStudentDashboard_(p);
      case 'saveprogress': return htSaveProgress_(p);
      case 'ownerlogin': return htAdminLogin_(p);
      case 'ownersetup': return htOwnerSetup_(p);
      case 'ownerdata': case 'adminliststudents': return htAdminData_(p);
      case 'owneractivate': return htAdminActivate_(p);
      case 'ownersetstatus': case 'adminupdatestudent': return htAdminSetStatus_(p);
      case 'ownerlogout': case 'adminlogout': return htAdminLogout_(p);
      case 'adminlogin': return htAdminLogin_(p);
      case 'adminreport': return htAdminReport_(p);
      default: return htJson_({success:false,error:'Unknown action: '+action});
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return htJson_({success:false,error:'The Academy service could not complete this request. Check the Apps Script execution log.'});
  }
}
function htRegister_(p) {
  const name=htClean_(p.fullName), email=htClean_(p.email).toLowerCase(), phone=htClean_(p.whatsapp);
  if (!name) return htJson_({success:false,error:'Full name is required.'});
  if (!htValidEmail_(email)) return htJson_({success:false,error:'Enter a valid email address.'});
  if (!phone) return htJson_({success:false,error:'WhatsApp number is required.'});
  setupAcademy();
  const sh=htSS_().getSheetByName('Students'), cols=htColumns_(sh), last=sh.getLastRow();
  if (last>=2) {
    const rows=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();
    for (const r of rows) if (String(r[cols.email-1]||'').trim().toLowerCase()===email) {
      return htJson_({success:false,error:'This email is already registered. Please use Student Login or contact the Academy.'});
    }
  }
  const id='HT-'+Utilities.getUuid().replace(/-/g,'').slice(0,8).toUpperCase();
  const notes='Experience: '+(htClean_(p.experience)||'Not provided')+' | Goal: '+(htClean_(p.goal)||'Not provided');
  const values={
    'Timestamp':new Date(),'Student ID':id,'Full Name':name,'Email':email,'WhatsApp':phone,
    'Package':HT_CONFIG.packageName,'Status':'Pending','Payment Status':'Payment Pending',
    'Access Code':'','Activated At':'','Last Login':'','Notes':notes
  };
  const row=Array(sh.getLastColumn()).fill('');
  Object.keys(values).forEach(k=>{ if(cols[k]) row[cols[k]-1]=values[k]; });
  sh.appendRow(row);
  htLog_('REGISTRATION',id,email,'Registration received. Experience: '+(p.experience||'Not provided'));
  let studentEmailSent=false, adminEmailSent=false;
  try {
    MailApp.sendEmail({to:email,subject:'Hybrid Traders Academy — Registration Received',
      htmlBody:'<p>Hello '+htEscape_(name)+',</p><p>Your registration has been received.</p><p><b>Student ID:</b> '+id+'</p><p><b>Status:</b> Pending payment verification.</p><p>The owner will verify your one-time $100 payment. Once confirmed, your login access code will be emailed to you.</p><p><a href="'+HT_CONFIG.websiteUrl+'student.html">Student Login</a></p><p>Real Skills. Financial Freedom. Lasting Wealth.</p>'});
    studentEmailSent=true;
  } catch(err) { console.error('Student registration email failed: '+err); }
  try {
    MailApp.sendEmail({to:HT_CONFIG.adminEmail,subject:'New Academy Registration — '+id,
      htmlBody:'<h2>New Academy Registration</h2><p><b>Name:</b> '+htEscape_(name)+'</p><p><b>Email:</b> '+htEscape_(email)+'</p><p><b>WhatsApp:</b> '+htEscape_(phone)+'</p><p><b>Student ID:</b> '+id+'</p><p><b>Experience:</b> '+htEscape_(p.experience||'Not provided')+'</p><p><b>Goal:</b> '+htEscape_(p.goal||'Not provided')+'</p><p>Payment: Payment Pending</p><p>Open the owner dashboard to review this registration.</p><p>'+HT_CONFIG.websiteUrl+'owner.html</p>'});
    adminEmailSent=true;
  } catch(err) { console.error('Admin registration email failed: '+err); }
  return htJson_({success:true,message:'Registration saved successfully.',studentId:id,status:'Pending',paymentStatus:'Payment Pending',studentEmailSent:studentEmailSent,adminEmailSent:adminEmailSent});
}
function htLogin_(p) {
  const email=htClean_(p.email).toLowerCase(), code=htClean_(p.accessCode||p.code).toUpperCase();
  if (!htValidEmail_(email)||!code) return htJson_({success:false,error:'Enter your registered email and access code.'});
  const found=htFindStudent_(email); if(!found) return htJson_({success:false,error:'No registration was found for this email.'});
  const s=found.student;
  if (String(s['Status']).toLowerCase()!=='active'||String(s['Payment Status']).toLowerCase()!=='paid')
    return htJson_({success:false,error:'Your account is not active yet. Login details are sent only after payment is verified.'});
  if (String(s['Access Code']||'').toUpperCase()!==code) {
    htLog_('LOGIN_FAILED',s['Student ID'],email,'Incorrect access code.');
    return htJson_({success:false,error:'Email or access code is incorrect.'});
  }
  found.sheet.getRange(found.row,found.cols['Last Login']).setValue(new Date());
  htLog_('STUDENT_LOGIN',s['Student ID'],email,'Student logged in successfully.');
  return htJson_({success:true,student:{studentId:s['Student ID'],fullName:s['Full Name'],email:s.Email,status:s.Status,paymentStatus:s['Payment Status'],package:s.Package}});
}
function htStudentDashboard_(p) {
  const email=htClean_(p.email).toLowerCase(), code=htClean_(p.accessCode||p.code).toUpperCase();
  const found=htFindStudent_(email);
  if(!found||String(found.student.Status).toLowerCase()!=='active'||String(found.student['Payment Status']).toLowerCase()!=='paid'||String(found.student['Access Code']).toUpperCase()!==code)
    return htJson_({success:false,error:'Please sign in again with an active student account.'});
  const progressSh=htSS_().getSheetByName('Progress'), progressData=progressSh.getLastRow()>1?progressSh.getRange(2,1,progressSh.getLastRow()-1,5).getValues():[], completedModules=[];
  progressData.forEach(r=>{if(String(r[1])===String(found.student['Student ID'])){try{const list=JSON.parse(String(r[4]||'[]'));if(Array.isArray(list)&&list.length)completedModules.push(String(r[3]));}catch(_){}}});
  return htJson_({success:true,student:{studentId:found.student['Student ID'],fullName:found.student['Full Name'],email:found.student.Email,package:found.student.Package},modules:['Market Structure','Technical Analysis','Price Action','Risk Management','Trading Psychology','Trade Execution','Live Market Analysis'],completedModules:completedModules});
}
function htSaveProgress_(p) {
  const email=htClean_(p.email).toLowerCase(), code=htClean_(p.accessCode||p.code).toUpperCase(), module=htClean_(p.module);
  const allowed=['Market Structure','Technical Analysis','Price Action','Risk Management','Trading Psychology','Trade Execution','Live Market Analysis'];
  const found=htFindStudent_(email);
  if(!found||String(found.student.Status).toLowerCase()!=='active'||String(found.student['Payment Status']).toLowerCase()!=='paid'||String(found.student['Access Code']).toUpperCase()!==code)
    return htJson_({success:false,error:'Please sign in again with an active student account.'});
  if(!allowed.includes(module))return htJson_({success:false,error:'Unknown learning module.'});
  const sh=htSS_().getSheetByName('Progress'), last=sh.getLastRow(), data=last>1?sh.getRange(2,1,last-1,5).getValues():[];
  let rowNum=0;
  for(let i=0;i<data.length;i++)if(String(data[i][1])===String(found.student['Student ID'])&&String(data[i][3])===module){rowNum=i+2;break;}
  const row=[new Date(),found.student['Student ID'],email,module,JSON.stringify(['completed'])];
  if(rowNum)sh.getRange(rowNum,1,1,row.length).setValues([row]);else sh.appendRow(row);
  htLog_('MODULE_COMPLETED',found.student['Student ID'],email,'Student marked module complete: '+module);
  return htJson_({success:true,message:'Progress saved.',module:module});
}
function htAdminLogin_(p) {
  const email=htClean_(p.email).toLowerCase(), password=String(p.password||'');
  const expected=String(HT_CONFIG.adminEmail).toLowerCase();
  const saved=PropertiesService.getScriptProperties().getProperty('HTA_OWNER_PASSWORD_SHA256');
  if(!saved) return htJson_({success:false,error:'Owner password is not configured yet. Run setupOwnerPassword() from the bound Google Sheet.'});
  if(email!==expected||!htConstantEqual_(htSha256_(password),saved)) {
    htLog_('OWNER_LOGIN_FAILED','',email,'Failed owner login attempt.');
    return htJson_({success:false,error:'Owner email or password is incorrect.'});
  }
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('HTA_OWNER_'+token,expected,HT_CONFIG.sessionSeconds);
  htLog_('OWNER_LOGIN','',email,'Owner signed in to dashboard.');
  return htJson_({success:true,token:token,expiresIn:HT_CONFIG.sessionSeconds});
}
function htRequireOwner_(p) {
  const token=htClean_(p.token);
  if(!token||token.length>200) return {ok:false,error:'Owner session is missing. Sign in again.'};
  const email=CacheService.getScriptCache().get('HTA_OWNER_'+token);
  if(email!==String(HT_CONFIG.adminEmail).toLowerCase()) return {ok:false,error:'Owner session expired. Sign in again.'};
  return {ok:true,email:email};
}
function htAdminData_(p) {
  const auth=htRequireOwner_(p); if(!auth.ok)return htJson_({success:false,error:auth.error});
  setupAcademy();
  const sh=htSS_().getSheetByName('Students'), cols=htColumns_(sh), last=sh.getLastRow(), students=[];
  if(last>=2) sh.getRange(2,1,last-1,sh.getLastColumn()).getValues().forEach(r=>{
    const o={}; Object.keys(cols).forEach(k=>o[k]=r[cols[k]-1] instanceof Date?r[cols[k]-1].toISOString():String(r[cols[k]-1]??''));
    if(!o['Student ID']&&!o.Email)return;
    students.push({studentId:o['Student ID'],fullName:o['Full Name'],email:o.Email,whatsapp:o.WhatsApp,package:o.Package,status:o.Status,paymentStatus:o['Payment Status'],accessStatus:o.Status==='Active'?'Active':'Not active',registeredAt:o.Timestamp,activatedAt:o['Activated At'],lastLogin:o['Last Login'],notes:o.Notes});
  });
  const logSh=htSS_().getSheetByName('Activity'), logRows=logSh.getLastRow()>1?logSh.getRange(Math.max(2,logSh.getLastRow()-99),1,Math.min(100,logSh.getLastRow()-1),logSh.getLastColumn()).getValues():[];
  const activity=logRows.reverse().map(r=>({timestamp:r[0] instanceof Date?r[0].toISOString():String(r[0]||''),action:String(r[1]||''),studentId:String(r[2]||''),email:String(r[3]||''),details:String(r[4]||'')}));
  const summary={total:students.length,active:students.filter(s=>s.status==='Active').length,pending:students.filter(s=>/pending/i.test(s.status)).length,paid:students.filter(s=>String(s.paymentStatus).toLowerCase()==='paid').length,suspended:students.filter(s=>s.status==='Suspended').length};
  return htJson_({success:true,students:students,activity:activity,summary:summary});
}
function htAdminActivate_(p) {
  const auth=htRequireOwner_(p); if(!auth.ok)return htJson_({success:false,error:auth.error});
  const email=htClean_(p.email).toLowerCase();
  if(String(p.paymentVerified)!=='true')return htJson_({success:false,error:'Payment verification confirmation is required.'});
  const found=htFindStudent_(email); if(!found)return htJson_({success:false,error:'Student not found.'});
  const s=found.student, code=htMakeCode_(), row=found.row, cols=found.cols;
  found.sheet.getRange(row,cols['Status']).setValue('Active');
  found.sheet.getRange(row,cols['Payment Status']).setValue('Paid');
  found.sheet.getRange(row,cols['Access Code']).setValue(code);
  found.sheet.getRange(row,cols['Activated At']).setValue(new Date());
  let sent=false;
  try { MailApp.sendEmail({to:email,subject:'Hybrid Traders Academy — Your Login Is Ready',htmlBody:'<p>Hello '+htEscape_(s['Full Name'])+',</p><p>Your payment has been verified and your Academy account is now <b>ACTIVE</b>.</p><p><b>Login email:</b> '+htEscape_(email)+'</p><p><b>Your access code:</b></p><p style="font-size:26px;font-weight:bold;letter-spacing:4px">'+code+'</p><p>Keep this code private.</p><p><a href="'+HT_CONFIG.websiteUrl+'student.html">Open Student Login</a></p><p>Hybrid Traders Online Academy</p>'}); sent=true; } catch(err) { console.error('Activation email failed: '+err); }
  htLog_('OWNER_ACTIVATE',s['Student ID'],email,'Payment verified by owner; account activated. Access email sent: '+sent);
  return htJson_({success:true,message:sent?'Student activated and access code emailed.':'Student activated, but email sending failed. Check Apps Script execution log.',emailSent:sent});
}
function htAdminSetStatus_(p) {
  const auth=htRequireOwner_(p); if(!auth.ok)return htJson_({success:false,error:auth.error});
  const email=htClean_(p.email).toLowerCase(), status=htClean_(p.status);
  const allowed=['Pending','Payment Pending','Approved','Active','Suspended'];
  if(!allowed.includes(status))return htJson_({success:false,error:'Unsupported status.'});
  const found=htFindStudent_(email); if(!found)return htJson_({success:false,error:'Student not found.'});
  if(status==='Active' && String(found.student['Payment Status']).toLowerCase()!=='paid')return htJson_({success:false,error:'Unpaid students cannot be activated. Use Verify & Activate after confirming payment.'});
  if(status==='Active')return htJson_({success:false,error:'Use Verify & Activate to generate a fresh access code and email it.'});
  found.sheet.getRange(found.row,found.cols.Status).setValue(status);
  htLog_('OWNER_STATUS_CHANGE',found.student['Student ID'],email,'Status changed to '+status+'.');
  return htJson_({success:true,message:'Student status updated.'});
}
function htAdminReport_(p) {
  const auth=htRequireOwner_(p); if(!auth.ok)return htJson_({success:false,error:auth.error});
  const type=htClean_(p.report).toLowerCase(), names={activity:'Activity',progress:'Progress',payments:'Students',assessments:'Assessments',journal:'Journal'};
  if(!names[type])return htJson_({success:false,error:'Unknown report.'});
  const sh=htSS_().getSheetByName(names[type]); if(!sh)return htJson_({success:true,data:[]});
  const last=sh.getLastRow(); const values=last>1?sh.getRange(Math.max(2,last-199),1,Math.min(200,last-1),sh.getLastColumn()).getDisplayValues().reverse():[];
  return htJson_({success:true,report:type,data:values});
}
function htAdminLogout_(p) {
  const token=htClean_(p.token); if(token)CacheService.getScriptCache().remove('HTA_OWNER_'+token);
  return htJson_({success:true,message:'Signed out.'});
}
function sendOwnerSetupLink() {
  const props=PropertiesService.getScriptProperties();
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  props.setProperty('HTA_OWNER_SETUP_TOKEN',token);
  const link=HT_CONFIG.websiteUrl+'admin.html?setup='+encodeURIComponent(token);
  MailApp.sendEmail({to:HT_CONFIG.adminEmail,subject:'Hybrid Traders Academy — Secure Owner Password Setup',
    htmlBody:'<p>A request was made to configure the owner password for Hybrid Traders Academy.</p><p><a href="'+link+'">Set your owner password securely</a></p><p>This one-time link expires after it is used. If you did not request this, ignore this email.</p>'});
  return 'Owner password setup link emailed to '+HT_CONFIG.adminEmail+'. Open that email and use the link.';
}
function htOwnerSetup_(p) {
  const props=PropertiesService.getScriptProperties();
  const expected=props.getProperty('HTA_OWNER_SETUP_TOKEN')||'';
  const supplied=htClean_(p.setupToken);
  const password=String(p.password||'');
  if(!expected||!supplied||!htConstantEqual_(expected,supplied))return htJson_({success:false,error:'This setup link is invalid or has already been used. Run sendOwnerSetupLink() again.'});
  if(password.length<14)return htJson_({success:false,error:'Choose a unique password with at least 14 characters.'});
  props.setProperty('HTA_OWNER_PASSWORD_SHA256',htSha256_(password));
  props.deleteProperty('HTA_OWNER_SETUP_TOKEN');
  htLog_('OWNER_PASSWORD_SET','',HT_CONFIG.adminEmail,'Owner password configured through one-time email link.');
  return htJson_({success:true,message:'Owner password saved securely. You can now sign in.'});
}
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Hybrid Academy').addItem('Setup / Repair Sheets','setupAcademy').addItem('Set Owner Password','setupOwnerPassword').addToUi();
}
function htFindStudent_(email) {
  if(!htValidEmail_(email))return null;
  const sh=htSS_().getSheetByName('Students'), cols=htColumns_(sh), last=sh.getLastRow();
  if(last<2)return null;
  const data=sh.getRange(2,1,last-1,sh.getLastColumn()).getValues();
  for(let i=0;i<data.length;i++) {
    const r=data[i], o={}; Object.keys(cols).forEach(k=>o[k]=r[cols[k]-1]);
    if(String(o.Email||'').trim().toLowerCase()===email)return {sheet:sh,row:i+2,cols:cols,student:o};
  }
  return null;
}
function htColumns_(sh) {
  const headers=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0], map={};
  headers.forEach((h,i)=>{const key=String(h||'').trim();if(key)map[key]=i+1;});
  ['Timestamp','Student ID','Full Name','Email','WhatsApp','Package','Status','Payment Status','Access Code','Activated At','Last Login','Notes'].forEach(k=>{if(!map[k])throw new Error('Students sheet is missing required column: '+k);});
  return map;
}
function htLog_(action,id,email,details) {
  try { setupAcademy(); const sh=htSS_().getSheetByName('Activity'); sh.appendRow([new Date(),action,id||'',email||'',details||'']); } catch(err) { console.error('Activity log failed: '+err); }
}
function htMakeCode_() { const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<10;i++)s+=chars[Math.floor(Math.random()*chars.length)];return s; }
function htValidEmail_(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s||'')); }
function htClean_(v) { return v===undefined||v===null?'':String(v).trim(); }
function htEscape_(v) { return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function htSha256_(v) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(v),Utilities.Charset.UTF_8).map(b=>{const n=b<0?b+256:b;return n.toString(16).padStart(2,'0');}).join(''); }
function htConstantEqual_(a,b) { a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0; }
function htJson_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
