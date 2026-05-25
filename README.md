# personal-blog-jekyll

GitHub Pages + Jekyll 기반 개인 블로그 스타터입니다.

## 포함된 것

- GitHub Pages 호환 Jekyll 설정
- `jekyll-seo-tag`, `jekyll-feed`, `jekyll-sitemap`
- GTM 스니펫 삽입 구조
- 기본 홈, 소개 페이지, 첫 블로그 포스트

## 빠른 시작

GitHub Pages 최신 의존성 기준으로 로컬 실행에는 Ruby 3.3 이상이 권장됩니다.

```bash
bundle install
bundle exec jekyll serve --livereload --force_polling
```

브라우저에서 `http://127.0.0.1:4000` 으로 확인할 수 있습니다.

### 옵션 설명

- `--livereload` : 파일을 저장하면 브라우저가 자동으로 새로고침됩니다.
- `--force_polling` : 폴더 경로에 한글이 포함된 경우(macOS fsnotify 미감지 이슈) 변경 감지를 폴링으로 강제합니다.

### 한글 카테고리/permalink를 쓸 때 (필수)

쉘 로케일이 `C` 면 한글 permalink 빌드 시 인코딩 에러가 납니다. `~/.zshrc` (또는 `~/.bash_profile`)에 다음을 추가하세요:

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

추가 후 `source ~/.zshrc` 또는 새 터미널을 여세요.

## 배포

1. 새 GitHub 저장소를 만듭니다.
2. 이 폴더 내용을 푸시합니다.
3. 저장소 이름을 `your-github-username.github.io` 로 만들면 루트 도메인에 바로 배포됩니다.
4. GitHub 저장소의 `Settings > Pages` 에서 배포 상태를 확인합니다.
5. 이 프로젝트에는 GitHub Actions 배포 워크플로가 포함되어 있어, 푸시 후 자동 배포되도록 구성되어 있습니다.

## 먼저 바꿔야 할 값

`_config.yml`

- `title`
- `email`
- `url`
- `author.name`
- `social.links`
- `gtm_id`
- `google_site_verification`

## GTM 연결

`_config.yml` 의 `gtm_id` 값을 실제 값으로 바꾸면 `<head>` 와 `<body>` 에 자동 삽입됩니다.

예시:

```yml
gtm_id: "GTM-ABCD123"
```

## SEO 체크 포인트

- 각 글에 `title`, `description`, `date`, `tags` 를 넣기
- 실제 배포 URL을 `url` 에 정확히 입력하기
- Search Console을 쓸 경우 `google_site_verification` 추가하기

## 로컬 빌드 참고

macOS 기본 시스템 Ruby 2.6에서는 최신 `github-pages` gem이 설치되지 않을 수 있습니다.

이 경우:

- Homebrew 또는 `rbenv` 로 Ruby 3.3 이상 설치
- 그 다음 `bundle install`
- 또는 GitHub에 푸시해서 Actions 배포로 먼저 확인
