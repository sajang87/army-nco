# 육군 간부 병과 추천 AI

육군 19개 병과 · 51개 세부특기 중 전공·자격증·성격 기반으로 최적의 1~4지망을 추천하는 웹 앱입니다.

## 프로젝트 구조

```
army-nco/
├── public/
│   ├── index.html   # HTML 골격
│   ├── style.css    # 스타일
│   └── app.js       # 추천 로직 및 동작
├── server.js        # Express 서버
├── package.json
├── .gitignore
└── README.md
```

## 로컬 실행

```bash
npm install
npm start
# → http://localhost:3000
```

## GitHub + Railway 배포

1. GitHub에 이 폴더를 저장소로 push
2. [railway.app](https://railway.app) 접속 → New Project → Deploy from GitHub repo
3. 저장소 선택 후 자동 배포 완료

Railway는 `package.json`의 `start` 스크립트(`node server.js`)를 자동으로 실행하며,  
`PORT` 환경변수도 자동으로 주입됩니다.
