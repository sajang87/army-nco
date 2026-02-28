const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// public 폴더의 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// 모든 요청을 index.html로 fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});
