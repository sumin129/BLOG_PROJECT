# 네이버 맛집 블로그 게시글 자동화 앱

## 프로젝트 개요

맛집 정보와 키워드를 입력하면, 네이버 블로그 SEO에 최적화된 게시글과 썸네일을 자동 생성하는 React 웹앱.

## 기술 스택

- **Frontend**: React + Vite
- **언어**: JavaScript (JSX)
- **스타일**: Tailwind CSS
- **키워드 경쟁도 분석**: 네이버 검색 API
- **게시글 생성**: Google Gemini API (gemini-2.5-flash)
- **썸네일 캡처**: html2canvas

## 환경변수 (.env)

```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_NAVER_CLIENT_ID=your_naver_client_id
VITE_NAVER_CLIENT_SECRET=your_naver_client_secret
```

> 네이버 검색 API는 https://developers.naver.com 에서 애플리케이션 등록 후 발급
> CORS 문제로 네이버 API는 프록시 서버 또는 Vite proxy 설정 필요

## Vite 프록시 설정 (vite.config.js)

네이버 검색 API는 브라우저에서 직접 호출 시 CORS 에러 발생.
vite.config.js에 프록시 설정 추가:

```js
server: {
  proxy: {
    '/naver-api': {
      target: 'https://openapi.naver.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/naver-api/, ''),
      headers: {
        'X-Naver-Client-Id': process.env.VITE_NAVER_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.VITE_NAVER_CLIENT_SECRET,
      }
    }
  }
}
```

## 앱 구조

```
src/
├── components/
│   ├── InputForm.jsx         # 맛집 정보 + 키워드 입력
│   ├── KeywordAnalysis.jsx   # 키워드 경쟁도 분석 결과
│   ├── PostPreview.jsx       # 생성된 게시글 미리보기 + 복사
│   └── ThumbnailEditor.jsx   # 썸네일 편집 + 다운로드
├── services/
│   ├── naverApi.js           # 네이버 검색 API 호출
│   └── geminiApi.js          # Google Gemini API 호출
├── App.jsx                   # 탭 라우팅
└── main.jsx
```

## 화면 구성 (탭)

### 탭 1 — 맛집 정보 입력
- 가게명 (필수)
- 지역 / 주소 (필수)
- 음식 종류 (필수)
- 가격대
- 분위기 특징 (ex. 데이트, 회식, 혼밥)
- 특이사항 (ex. 살얼음 소주, 직원이 구워줌, 화장실 실내)
- 키워드 입력 (쉼표로 구분, 여러 개)
- [분석 시작] 버튼

### 탭 2 — 키워드 분석
- 입력된 키워드별 네이버 블로그 검색 결과 수 표시
- Claude가 최적 키워드 1개(제목용) + 3~5개(본문용) 선정
- 선정 근거 간략히 표시
- [게시글 생성] 버튼

### 탭 3 — 게시글 미리보기
- 생성된 제목 표시
- 본문 전체 미리보기 (스크롤)
- [제목 복사] [본문 복사] [전체 복사] 버튼
- [다시 생성] 버튼

### 탭 4 — 썸네일 생성
- 사진 업로드 (배경 이미지)
- 메인 문구 입력 (기본값: 가게명)
- 서브 문구 입력 (기본값: 지역 + 음식종류)
- 어두운 오버레이 투명도 슬라이더
- 텍스트 색상 선택
- 실시간 미리보기
- [PNG 다운로드] 버튼 (html2canvas로 캡처)

## 네이버 검색 API 사용법

블로그 검색 결과 수로 키워드 경쟁도 측정:

```js
// 키워드별 블로그 검색 결과 수 조회
const res = await fetch(`/naver-api/v1/search/blog.json?query=${keyword}&display=1`);
const data = await res.json();
const total = data.total; // 해당 키워드 블로그 게시글 수
```

- total이 낮을수록 경쟁 낮음 → 노출 유리
- 기준: 10만 이하 = 좋음, 30만 이하 = 보통, 30만 초과 = 경쟁 심함

## Gemini API 사용법

Gemini API는 `@google/generative-ai` 패키지 사용:

```
npm install @google/generative-ai
```

```js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const callGemini = async (prompt) => {
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  // JSON 응답 파싱 시 ```json 펜스 제거
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
};
```

### 키워드 선정 프롬프트

```js
const keywordPrompt = `
당신은 네이버 블로그 SEO 전문가입니다.
아래 키워드 목록과 각 키워드의 네이버 블로그 검색 결과 수를 보고,
제목에 사용할 최적 키워드 1개와 본문에 사용할 키워드 3~5개를 선정해주세요.

맛집 정보:
- 가게명: ${storeName}
- 지역: ${location}
- 음식종류: ${foodType}

키워드 분석 결과:
${keywords.map(k => `- "${k.word}": 블로그 ${k.total.toLocaleString()}개`).join('\n')}

선정 기준:
1. 검색 결과 수가 적을수록 노출 유리 (경쟁도 낮음)
2. 지역명+음식종류 조합이 효과적
3. 너무 광범위하거나 너무 좁은 키워드 제외
4. 제목 키워드는 가장 검색될 법한 자연스러운 표현

JSON 형식으로만 응답:
{
  "titleKeyword": "선정된 제목 키워드",
  "bodyKeywords": ["키워드1", "키워드2", "키워드3"],
  "reason": "선정 근거 한 줄 설명"
}
`;
```

### 게시글 생성 프롬프트

```js
const postPrompt = `
당신은 네이버 맛집 블로그 작성 전문가입니다.
아래 정보와 스타일 가이드를 참고해서 블로그 게시글을 작성해주세요.

## 맛집 정보
- 가게명: ${storeName}
- 주소: ${address}
- 지역: ${location}
- 음식종류: ${foodType}
- 가격대: ${priceRange}
- 분위기: ${atmosphere}
- 특이사항: ${specialNotes}
- 영업시간: ${hours}

## 키워드
- 제목 키워드: ${titleKeyword}
- 본문 키워드: ${bodyKeywords.join(', ')}

## 작성 스타일 가이드 (필수 준수)

### 말투
- 친근한 구어체, ~요/~어요/~습니다 혼용
- 흥분/감탄 표현 자주 사용: "미쳤어요", "개맛도리", "레전드", "왕왕"
- 줄임말, 신조어 자연스럽게 섞기: "렛츠고", "챱챱", "맛도리"
- 쉼표 여러개(,,), ㅋㅋ, ㅠㅠ 적절히 사용
- 혼잣말 스타일의 감탄: "대창 사랑해...", "소주 야르~하다"
- 가성비 포인트는 꼭 가격 직접 명시

### 구조 (이 순서로 작성)
1. 인사 + 방문 계기 (2~3줄, 짧게)
2. 가게명 + 위치/영업시간 소제목 → 주소, 영업시간 기재
3. 내부/분위기 소제목 → 분위기 묘사
4. 기본찬/반찬 소제목 → 반찬 묘사
5. 메인 메뉴 소제목 → 메뉴별 개인 코멘트, 취향 순위
6. 마무리 총평 + 강력 추천 멘트
7. 주소 한 번 더 기재

### SEO 규칙
- 소제목 형식: "[지역] [음식종류] 맛집 [가게명]" 패턴 사용
- 본문 키워드를 자연스럽게 2~3회 반복 삽입
- 게시글 끝에 주소 텍스트로 한 번 더 작성

제목과 본문을 아래 JSON 형식으로만 응답:
{
  "title": "제목",
  "content": "본문 전체"
}
`;
```

## 썸네일 생성 (html2canvas)

```jsx
import html2canvas from 'html2canvas';

const downloadThumbnail = async () => {
  const el = document.getElementById('thumbnail-preview');
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const link = document.createElement('a');
  link.download = `${storeName}_썸네일.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
```

썸네일 미리보기 요소 권장 크기: `width: 800px, height: 533px` (3:2 비율, 네이버 블로그 대표이미지 권장)

## 실행 권한

- 파일 생성, 수정, 삭제 모두 확인 없이 바로 실행해도 됨
- 패키지 설치 확인 없이 바로 실행해도 됨
- 터미널 명령 실행 확인 없이 바로 실행해도 됨
- 매 작업마다 허락을 구하지 말고 판단해서 진행할 것

## 코딩 컨벤션

- 응답은 항상 한국어로
- 변수명은 camelCase
- 컴포넌트는 PascalCase
- API 호출은 services/ 폴더에서만
- 에러 처리 필수 (try/catch + 사용자에게 에러 메시지 표시)
- 로딩 상태 표시 필수 (API 호출 중 스피너 or 스켈레톤)
- Gemini API 응답은 JSON.parse 전 ```json 펜스 제거 처리

## 주의사항

- Gemini API 키는 프론트에서 직접 호출 (VITE_ prefix 환경변수)
- 네이버 API CORS 문제는 Vite proxy로 해결
- html2canvas는 CORS 이미지 처리를 위해 `useCORS: true` 필수
- 업로드 이미지는 로컬 ObjectURL 사용 (서버 업로드 불필요)