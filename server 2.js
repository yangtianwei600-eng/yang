const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const PASSWORD = 'limon2025';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 60 * 1000;
const loginAttempts = {};

app.use(session({
  secret: 'limon-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

function requireLogin(req, res, next) {
  if (req.session.loggedIn) return next();
  res.redirect('/');
}

app.get('/', (req, res) => {
  if (req.session.loggedIn) return res.redirect('/home');
  res.send(getLoginPage());
});

app.post('/login', (req, res) => {
  const ip = req.ip;
  const now = Date.now();
  if (!loginAttempts[ip]) loginAttempts[ip] = { count: 0, lockUntil: 0 };
  const record = loginAttempts[ip];
  if (now < record.lockUntil) {
    const wait = Math.ceil((record.lockUntil - now) / 1000);
    return res.json({ success: false, message: `Too many attempts. Wait ${wait}s.` });
  }
  setTimeout(() => {
    if (req.body.password === PASSWORD) {
      record.count = 0;
      req.session.loggedIn = true;
      res.json({ success: true });
    } else {
      record.count++;
      if (record.count >= MAX_LOGIN_ATTEMPTS) {
        record.lockUntil = now + LOCKOUT_TIME;
        record.count = 0;
      }
      res.json({ success: false, message: 'Wrong password.' });
    }
  }, 500);
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/home', requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views/home.html'));
});

app.get('/api/photos', requireLogin, (req, res) => {
  const files = fs.readdirSync(path.join(__dirname, 'uploads'))
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));
  res.json(files);
});

app.post('/upload', requireLogin, upload.single('photo'), (req, res) => {
  if (!req.file) return res.json({ success: false, message: 'No file.' });
  res.json({ success: true, filename: req.file.filename });
});

app.delete('/photo/:filename', requireLogin, (req, res) => {
  const file = path.join(__dirname, 'uploads', path.basename(req.params.filename));
  if (fs.existsSync(file)) fs.unlinkSync(file);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));

function getLoginPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>with you</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{
  min-height:100vh;
  display:flex;align-items:center;justify-content:center;
  font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif;
  background:#060610;overflow:hidden;
}
canvas#bg{position:fixed;inset:0;z-index:0;}
.card{
  position:relative;z-index:10;
  background:rgba(255,255,255,0.05);
  backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:28px;padding:52px 44px;width:360px;
  box-shadow:0 8px 48px rgba(0,0,0,0.5);
  text-align:center;
  animation:cardIn 0.8s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes cardIn{from{opacity:0;transform:scale(0.88) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
.icon{font-size:44px;margin-bottom:18px;display:block;animation:pulse 3s ease infinite;}
@keyframes pulse{0%,100%{filter:drop-shadow(0 0 8px rgba(125,211,255,0.4))}50%{filter:drop-shadow(0 0 20px rgba(125,211,255,0.9))}}
h1{font-size:22px;font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:6px;}
.sub{font-size:13px;color:rgba(255,255,255,0.3);margin-bottom:32px;}
input[type=password]{
  width:100%;padding:14px 18px;
  background:rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.1);
  border-radius:14px;font-size:15px;
  color:rgba(255,255,255,0.9);outline:none;
  margin-bottom:14px;transition:all 0.25s;
  caret-color:#7dd3ff;
}
input[type=password]::placeholder{color:rgba(255,255,255,0.2);}
input[type=password]:focus{
  background:rgba(125,211,255,0.07);
  border-color:rgba(125,211,255,0.35);
  box-shadow:0 0 0 3px rgba(125,211,255,0.1);
}
button{
  width:100%;padding:14px;
  background:linear-gradient(135deg,#7dd3ff,#a78bfa,#f472b6);
  border:none;border-radius:14px;
  color:white;font-size:15px;font-weight:600;
  cursor:pointer;transition:all 0.25s;
  box-shadow:0 4px 20px rgba(125,211,255,0.2);
}
button:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(125,211,255,0.35);}
.msg{margin-top:14px;font-size:13px;color:#f472b6;min-height:18px;}
</style>
</head>
<body>
<canvas id="bg"></canvas>
<div class="card">
  <span class="icon">✦</span>
  <h1>Welcome back</h1>
  <p class="sub">This space is just for us</p>
  <input type="password" id="pw" placeholder="Enter password" autocomplete="current-password"/>
  <button onclick="doLogin()">Enter</button>
  <p class="msg" id="msg"></p>
</div>
<script>
const canvas=document.getElementById('bg');
const ctx=canvas.getContext('2d');
let W,H,pts=[];
function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
resize();window.addEventListener('resize',resize);
for(let i=0;i<100;i++) pts.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:Math.random()*1.2+0.2,a:Math.random(),da:(Math.random()-0.5)*0.01,dx:(Math.random()-0.5)*0.25,dy:(Math.random()-0.5)*0.25,c:Math.random()>0.5?'125,211,255':'244,114,182'});
(function loop(){
  ctx.fillStyle='rgba(6,6,16,0.15)';ctx.fillRect(0,0,W,H);
  pts.forEach(p=>{
    p.x+=p.dx;p.y+=p.dy;p.a+=p.da;
    if(p.a<0||p.a>1)p.da*=-1;
    if(p.x<0)p.x=W;if(p.x>W)p.x=0;
    if(p.y<0)p.y=H;if(p.y>H)p.y=0;
    ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,p.a));
    ctx.shadowBlur=10;ctx.shadowColor='rgba('+p.c+',0.8)';
    ctx.fillStyle='rgba('+p.c+',1)';
    ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });
  requestAnimationFrame(loop);
})();
document.getElementById('pw').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin();});
async function doLogin(){
  const pw=document.getElementById('pw').value;
  const msg=document.getElementById('msg');
  if(!pw){msg.textContent='Please enter password.';return;}
  msg.textContent='...';
  const r=await fetch('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
  const data=await r.json();
  if(data.success)window.location.href='/home';
  else{msg.textContent=data.message||'Wrong password.';document.getElementById('pw').value='';}
}
</script>
</body></html>`;
}
