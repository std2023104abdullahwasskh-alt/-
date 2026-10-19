const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
if (!fs.existsSync('builds')) fs.mkdirSync('builds');

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.post('/api/upload', upload.single('project'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم رفع ملف' });
  
  const projectId = uuidv4();
  const projectDir = path.join('uploads', projectId);
  fs.mkdirSync(projectDir);
  
  const ext = path.extname(req.file.originalname).toLowerCase();
  
  if (ext === '.zip') {
    const zip = new AdmZip(req.file.path);
    zip.extractAllTo(projectDir, true);
    fs.unlinkSync(req.file.path);
  } else {
    fs.renameSync(req.file.path, path.join(projectDir, 'index.html'));
  }
  
  res.json({ success: true, projectId });
});

app.get('/api/preview/:id', (req, res) => {
  const indexPath = path.join('uploads', req.params.id, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(path.resolve(indexPath));
  } else {
    res.status(404).json({ error: 'غير موجود' });
  }
});

app.post('/api/build', (req, res) => {
  const { projectId, appName } = req.body;
  const buildId = uuidv4();
  const apkPath = path.join('builds', buildId + '.apk');
  fs.writeFileSync(apkPath, `APK: ${appName}`);
  
  res.json({
    success: true,
    buildId,
    apkUrl: `/download/${buildId}`
  });
});

app.get('/download/:id', (req, res) => {
  const apkPath = path.join('builds', req.params.id + '.apk');
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'app.apk');
  } else {
    res.status(404).json({ error: 'غير موجود' });
  }
});

app.listen(PORT, () => {
  console.log(`🇮🇶 تطبيقاتي العراق يعمل على المنفذ ${PORT}`);
});