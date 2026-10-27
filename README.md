# V-Lab · 가상 실험실

물리·화학·생명과학·지구과학 가상 실험(HTML 시뮬레이션)을 한곳에 모아 브라우저에서 바로 실행하는 정적 사이트입니다.
빌드 도구나 서버 없이 HTML·CSS·JS 파일만으로 동작하며 GitHub Pages에 그대로 올립니다.

- 사이트: `https://<계정>.github.io/V-Lab/`  (GitHub Pages 설정 후)
- 운영: 휘쌤

## 폴더 구조

```
V-Lab/
├─ index.html              홈 · 과목별 목록 · 검색 (해시 라우팅: #/ , #/s/chemistry , #/recent)
├─ lab.html                실험 뷰어 (lab.html?id=실험ID&exp=번호)
├─ data/labs.js            ★ 실험 등록부 — 실험을 추가할 때 고치는 유일한 파일
├─ labs/
│   ├─ physics/            과목별 실험 HTML
│   ├─ chemistry/chem-smart-lab.html
│   ├─ biology/
│   └─ earth/
├─ assets/
│   ├─ css/site.css        사이트 스타일
│   ├─ css/lab-theme.css   ★ 실험 HTML 공용 테마 (글꼴·색·버튼·패널)
│   ├─ js/site.js          공통 스크립트 (카드·헤더·테마·최근 본 실험)
│   └─ img/thumbs/         실험 썸네일
├─ templates/lab-template.html   새 실험을 만들 때 복사해서 쓰는 뼈대
└─ docs/DESIGN.md          디자인 가이드
```

## 실험 추가하기 (3단계)

1. **파일 넣기** — 받은 HTML을 `labs/<과목>/` 에 넣습니다. 파일명은 영문 소문자와 하이픈만 씁니다. (예: `labs/physics/pendulum.html`)
2. **등록부에 추가** — `data/labs.js` 의 `labs: [ ... ]` 배열 안에 아래 예시 같은 항목을 하나 추가합니다.
3. **커밋·푸시** — GitHub에 올리면 1~2분 뒤 사이트에 반영됩니다.

등록 항목 예시:

```js
{
  id: "phys-pendulum",                 // 주소에 쓰이는 고유 ID
  subject: "physics",                  // physics | chemistry | biology | earth
  title: "단진자와 역학적 에너지",
  summary: "진자의 길이와 각도를 바꾸며 주기와 에너지 전환을 관찰합니다.",
  file: "labs/physics/pendulum.html",
  author: "김물리",
  grade: ["고1"],
  unit: "통합과학 · 역학적 에너지",
  tags: ["단진자", "에너지 보존"],
  thumbnail: "assets/img/thumbs/phys-pendulum.png",   // 선택
  added: "2026-11-01"
},
```

한 파일에 실험이 여러 개면 `experiments` 배열을 추가합니다. 각 실험이 카드 하나로 표시되고, 뷰어에서 탭으로 전환됩니다.
파일 쪽에서는 주소 해시(`#exp=2`)를 읽어 해당 실험을 열어 주면 됩니다. (`templates/lab-template.html` 의 ⑧ 참고)

```js
experiments: [
  { title: "증기압력 내림", hash: "exp=1", thumb: "assets/img/thumbs/chem-smart-lab/1.png" },
  ...
]
```

## 실험 HTML 작성 규칙

- **한 파일로** 완결되게 만듭니다. 외부 라이브러리는 CDN 링크로 불러와도 됩니다.
- `<head>` 에 공용 테마를 넣으면 사이트와 디자인이 통일됩니다.
  `<link rel="stylesheet" href="../../assets/css/lab-theme.css">`
- 새로 만들 때는 `templates/lab-template.html` 을 복사해서 시작하세요. 헤더·탭·상태줄·캔버스·조작부·V-Lab 연동 코드가 들어 있습니다.
- V-Lab 뷰어 안에서 열리면 주소 해시에 `embed` 가 붙습니다. 이때 자체 헤더를 숨기려면 `body.vlab-embed` 클래스를 쓰면 됩니다. (테마 CSS가 `.lab-header` 는 자동으로 숨깁니다.)
- 애니메이션 루프는 하나만 돌리고 `requestAnimationFrame` 을 이벤트 핸들러 안에서 호출하지 않습니다. (루프가 늘어나 점점 빨라지는 문제가 생깁니다.)
- `alert()` 대신 화면 안의 `.note` 요소에 메시지를 씁니다.
- 마우스 전용 이벤트(`mousedown`)보다 `pointerdown` 을 쓰면 태블릿에서도 동작합니다.

## 썸네일

카드에 실제 실험 화면을 보여주는 것이 가장 알아보기 쉽습니다. 실험 화면을 캡처해 `assets/img/thumbs/` 에 넣고 등록부의 `thumbnail`(또는 `experiments[].thumb`) 에 경로를 적습니다. 권장 비율 16:10, 폭 800px 내외. 없으면 회색 자리표시가 나옵니다.

## 배포 (GitHub Pages)

1. GitHub 저장소 → **Settings → Pages**
2. **Source: Deploy from a branch**, Branch: `main` (또는 사용하는 브랜치), 폴더 `/ (root)` → Save
3. 1~2분 뒤 `https://<계정>.github.io/V-Lab/` 에서 확인

`.nojekyll` 파일이 있어 Jekyll 처리 없이 그대로 서비스됩니다.

## 로컬에서 확인

파일을 더블클릭해 `index.html` 을 열어도 동작합니다. (등록부를 `<script>` 로 읽기 때문)
간단한 서버로 보려면 `python3 -m http.server 8000` 후 `http://localhost:8000/` 을 엽니다.

## 화면 구성

- **홈 / 과목** — 상단 바에서 전체·물리학·화학·생명과학·지구과학 전환. 홈은 과목별 묶음, 과목 페이지는 학년·단원·정렬 필터, 검색(⌘K / Ctrl+K).
- 사이트에는 등록·관리 화면이 없습니다. 실험 추가와 수정은 저장소(파일과 `data/labs.js`)에서만 합니다.
- **뷰어** — 상단 바 아래 보조 바: 과목 / 실험 이름, 개별 실험 탭, 정보(ⓘ)·전체화면·새 창. 전체화면은 상단 바를 숨깁니다(Esc 로 복귀).
- **최근 본 실험** — `index.html#/recent`. 학생 브라우저에만 저장됩니다.
- **다크 모드** — 상단 바의 달/해 아이콘. 기본은 화이트.
