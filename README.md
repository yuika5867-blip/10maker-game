# 🧙‍♂️ 10 MASTERS - 10 만들기 연금술의 모험

> 10을 만드는 연산 연습을 3가지 재미있는 미니게임으로 즐기고, 골드를 모아 **10의 수호자** 도전에 성공하세요!

---

## 🎮 게임 특징 및 구성

### 1. 3가지 미니게임 (제한시간 20~30초)
* **🎈 짝꿍 팝! (Pair Pop)**: 제한시간 **25초**. 합이 10이 되는 짝(예: 3+7, 2+8)을 스피디하게 터뜨리는 터치 게임.
* **🧱 10 블록 퍼즐 (Make 10 Combo)**: 제한시간 **30초**. 숫자 블록 2개 이상을 선택해 합이 10이 되게 폭파하는 연산 퍼즐. (3개 이상 조합 시 콤보 골드 보너스!)
* **⚡ 짝꿍 스피드 퀴즈 (Target 10 Dash)**: 제한시간 **20초**. `7 + ? = 10`, `10 - 4 = ?` 수식의 빈칸 정답을 순발력 있게 클릭하는 스피드 타임어택.

### 2. 🪙 골드 보상 & 🛡️ 10의 수호자 도전
* 미니게임 플레이 성과 및 콤보에 따라 골드를 획득합니다.
* 모은 **🪙 100 Gold**로 최종 관문인 **10의 수호자 도전**에 진입할 수 있습니다.
* 수호자가 출제하는 **10 만들기 문제 10개**를 타임어택으로 풀어 체력을 깎고 350 Gold와 랭킹 기록을 쟁취하세요!

### 3. 🏆 명예의 전당 (Global & Local Leaderboard)
* **골드 부자 TOP 10**
* **미니게임 클리어 TOP 10**
* **수호자 파괴자 TOP 10 (타임어택)**
* Firebase Firestore DB를 통해 전 세계 플레이어들과 실시간 랭킹을 공유합니다!

---

## 🔥 Firebase 연동 가이드

본 프로젝트는 Firebase Auth(Google 로그인, 익명 로그인)와 Firestore DB를 사용합니다.

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트를 생성합니다.
2. **Authentication** 메뉴에서 `Google` 및 `익명 (Anonymous)` 로그인 방식을 **활성화**합니다.
3. **Firestore Database** 메뉴에서 데이터베이스를 테스트 모드로 생성합니다.
4. **프로젝트 설정 > 내 앱 (웹 앱)**에서 발급받은 Firebase SDK Config를 복사합니다.
5. [`firebase-config.js`](./firebase-config.js) 파일의 `firebaseConfig` 객체 내용을 본인의 설정 정보로 교체합니다:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 🐙 GitHub 올리는 방법

프로젝트 루트 폴더에서 아래 명령어들을 실행합니다:

```bash
# 1. Git 저장소 초기화
git init

# 2. 파일 스테이징 및 커밋
git add .
git commit -m "Feat: 10 Masters Web Game with Firebase & Vercel ready"

# 3. GitHub 레포지토리 연결 및 푸시
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/10-masters-game.git
git push -u origin main
```

---

## 🚀 Vercel 배포 방법

1. [Vercel](https://vercel.com/) 계정에 로그인합니다.
2. **Add New Project**를 누르고 GitHub 계정을 연결한 후, 생성한 `10-masters-game` 레포지토리를 선택(Import)합니다.
3. Framework Preset을 **Other** 또는 **HTML/Static**으로 둔 후 **Deploy**를 클릭합니다.
4. 배포가 완료되면 몇 초 만에 라이브 URL이 생성되어 전 세계에 공개됩니다! 🎉
