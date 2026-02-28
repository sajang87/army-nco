# 육군 간부 병과 추천 AI

육군 19개 병과 · 51개 세부특기 중 전공·자격증·성격 기반으로 최적의 1~4지망을 추천하는 웹 앱입니다.

## 프로젝트 구조

```
army-nco/
├── index.html       # HTML 골격
├── style.css        # 스타일
├── app.js           # 추천 로직 및 동작
├── .gitignore
└── README.md
```

## 로컬 실행

별도의 서버 설치 없이 브라우저에서 `index.html` 파일을 직접 열어 실행할 수 있습니다.

## GitHub Pages 배포

1. GitHub 저장소의 `Settings` > `Pages` 메뉴로 이동
2. `Source`를 "Deploy from a branch"로 선택
3. 분기를 배포 브랜치 (예: `pages` 또는 `main`)로 선택하고, 폴더를 `/(root)`로 지정한 뒤 `Save`
4. 몇 분 뒤 `https://[username].github.io/[repository-name]/` 주소로 접속 가능
