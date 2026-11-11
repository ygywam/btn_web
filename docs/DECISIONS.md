# 결정 기록 (DECISIONS)

- 2026-11-10 · 백엔드 Supabase 전환 및 독립 프로젝트 분리 · 노션 종속성과 속도 제한을 해결하기 위해 Supabase PostgreSQL을 백엔드로 채택하고 G:\내 드라이브\바이브코딩\booktuning-web 폴더로 독립 분리
- 2026-11-10 · 기본 비공개 개인 서재 및 날짜별 공개 피드 채택 · 구글 로그인 기반 개인화, 모든 기록은 기본 비공개이며 사용자가 선택한 기록만 날짜별 독립 피드로 전체 공개 피드에 노출하는 아키텍처로 결정
- 2026-11-10 · 첫 사용자 스포트라이트 포스트잇 가이드 및 반응형 인트로 홍보영상 구현 · 첫 방문 시 16:9(데스크탑)/9:16(모바일) 시네마틱 모션 비디오 및 주요 UI 하이라이트 + 포스트잇 안내장 탑재
- 2026-11-10 · 구글 드라이브 환경 라이브러리 전체 동기화 및 200 OK 서버 기동 성공 · 모듈 누락 및 손상 파일을 완전 복구하고 Next.js 14 개발 서버 정상 구동(HTTP 200) 검증 완료
- 2026-11-10 · 도서 검색 버튼 UI 중복 개선 및 필터 바 정돈 · 상단 헤더의 도서 검색 버튼으로 일원화하고 중간 중복 버튼을 제거하여 모바일 필터 가독성 및 UI 일관성 확보
- 2026-11-10 · GitHub 및 Vercel 배포 환경 정비 · 임시 디렉토리 정리 및 .gitignore 무시 규칙을 강화하여 불필요하거나 민감한 파일의 원격 저장소 유출 차단
- 2026-11-10 · 더미데이터 제거, 도서 고정 기록 UX 개선 및 모달 가이드 탑재 · 하드코딩된 더미데이터를 완전히 삭제하고, 책 카드에서 기록 작성 시 해당 책이 고정되도록 개선했으며, AI 버튼명을 직관적으로 다듬고 각 모달마다 사용 가이드 팁을 추가
- 2026-11-10 · 도서 쪽수 수동 입력 및 실시간 자동 완독(Auto Complete) 로직 채택 · 카카오 API의 쪽수 부재를 해결하기 위해 담기 시 전체 쪽수를 직접 확인/입력하도록 개선하고 진도율 100% 도달 시 즉시 완독 상태로 자동 승격
- 2026-11-10 · 독서 통계 탭(Analytics) 및 AI 맞춤 도서 추천 API 구축 · 월별 완독 도서 갤러리, 작가별 독서 랭킹, 그리고 누적된 책/문장 기록을 심층 분석하여 다음 도서 3권을 추천해주는 AI 리포트 기능 탑재
- 2026-11-10 · dorms-check 권고 반영 및 개인정보 무수집 처리방침 수립 · 필수 보안 헤더 4종(X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) 및 Open Graph 메타 적용, 개인정보를 일체 수집하지 않는 안심 개인정보처리방침(/privacy) 및 이용약관(/terms) 제정 완료
- 2026-11-11 · 도서 종합 AI 독서감상문 모달, 진도·메모 쪽수 연동 및 책 사진 OCR API 탑재 · 도서별 누적 문장·메모를 종합한 서평 생성 모달(BookReportModal) 및 /api/ai/book-report, 진도 메모 입력 시 도서 current_page 자동 갱신, 모바일 카메라 촬영 기반 /api/ocr 문장 스캔 기능 구현 완료
- 2026-11-11 · ai-clone-shield 적용·검증 후 restore 복원 처리 · 소유자 정보를 반영해 aishield.config.json으로 apply를 실행했으나, verify 정적 검증기가 Next.js 기본 500.html의 application/json 스크립트(__NEXT_DATA__)를 JS 구문 오류로 오탐(error 1건)해 restore로 .next 및 생성 파일을 원복함
- 2026-11-11 · Next.js App Router 호환 ai-clone-shield 재적용 및 Vercel 배포용 정적 보호 내장 · 빌드 후 HTML 직접 변형이 React 18 하이드레이션 콘솔 오류(#425/#418/#423)를 유발하는 문제를 발견해 워터마크(ZWC+window.__AISHIELD__+meta)와 AI 고지를 layout.tsx SSR에 통합하고, public/robots.txt·public/llms.txt·LICENSE 및 e-legal 해시 매니페스트를 유지해 콘솔 에러 0건 및 watermark-check 검출(id=5bbbeabab428) 검증 완료
- 2026-11-11 · WebGLShader·LiquidButton 기반 "Tuning Your Life" 첫 진입·계정 생성 게이트 전면 교체 · src/components/ui/ 신규 구성 및 three·@radix-ui/react-slot·class-variance-authority 설치, 공용 인증 헬퍼(src/lib/auth.ts)·AuthForm 추출로 중복을 없애고 비로그인 첫 화면을 EntryGate로 교체하여 로그인 후 재진입 시 내 서재 직행 및 콘솔 에러 0건 검증 완료
- 2026-11-11 · 도서·피드·좋아요·댓글 Supabase DB 영속화 및 닉네임·권한(42501) 오류 보완 · 로컬 저장소 전용이던 서재/기록을 src/lib/db.ts·useBookTuningData.ts로 분리해 클라우드 동기화하고, FeedCard 댓글 조회·등록·삭제 및 auth.ts 세션 복구/닉네임 저장 분기 구현, schema.sql에 public 스키마/테이블 GRANT 및 UPDATE WITH CHECK 정책 추가(로컬 UI·tsc 검증 완료, 실 Supabase SQL 실행 확인 대기)
- 2026-11-11 · 소개영상 버튼 제거, 포스트잇 가이드 13단계 확장 및 통계 클릭 세부 모달 도입 · Navbar/SpotlightCoachmark에서 소개영상 제거 후 본문 5개 영역(요약 통계·필터·책장·피드·통계 탭)과 탭 자동 전환을 추가하고, StatsDetailModal/LibraryStatsBar로 읽고 있는 책·완독한 책·수집한 문장·누적 쪽수 세부 내역을 바로 확인 가능하게 개선(데스크톱/모바일 390px 콘솔 에러 0건 검증 완료)
