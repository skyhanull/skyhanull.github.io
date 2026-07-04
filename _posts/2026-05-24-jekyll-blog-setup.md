---
title: "Jekyll 블로그를 만들고 Notion과 연동하기까지"
date: 2026-05-24 19:00:00 +0900
description: 로컬 Jekyll 세팅부터 GitHub Pages 배포, Notion 글을 자동으로 포스트로 올리는 것까지의 기록.
category: 개발
tags:
  - jekyll
  - blog
  - github-pages
  - notion
  - setup
---

블로그를 만들고 싶다는 생각만 하다가, 이번에 로컬 Jekyll부터 Notion 자동 연동까지 한 번에 붙였다. 만들면서 했던 작업들을 순서대로 정리해둔다.

## 1. Jekyll 로컬 환경 세팅

먼저 로컬에서 블로그를 띄우는 것부터 시작했다.

- `rbenv` 로 Ruby 3.3.5 설치
- `bundle install` 로 `github-pages` gem 설치
- `bundle exec jekyll serve` 로 로컬 서버 실행

생각보다 Ruby 버전 맞추는 게 제일 귀찮았다. macOS 기본 Ruby(2.6)로는 최신 `github-pages` gem이 안 깔려서, `rbenv` 로 별도 버전을 따로 잡아줘야 했다.

로컬 실행은 이 명령으로 고정했다.

```bash
bundle exec jekyll serve --livereload --force_polling
```

- `--livereload` : 저장하면 브라우저가 자동으로 새로고침
- `--force_polling` : 폴더 경로에 한글이 있으면 macOS가 파일 변경을 감지 못 하는 이슈가 있어서 폴링으로 강제

## 2. 한글 permalink 인코딩 이슈

한글 카테고리/permalink를 쓰니 빌드할 때 인코딩 에러가 났다. 쉘 로케일이 `C` 라서 그랬고, `~/.zshrc` 에 로케일을 잡아주니 해결됐다.

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

## 3. SEO / 배포 세팅

- `jekyll-seo-tag`, `jekyll-feed`, `jekyll-sitemap` 플러그인 추가
- `_config.yml` 에 GTM 스니펫 자동 삽입 구조 (`gtm_id` 값만 넣으면 `<head>`/`<body>` 에 삽입)
- GitHub Actions(`pages.yml`)로 푸시하면 자동 배포되도록 구성

## 4. Notion을 CMS처럼 쓰기 (핵심)

여기가 이번 작업의 메인이었다. 매번 마크다운 파일을 직접 만드는 게 번거로워서, **Notion 데이터베이스에 글을 쓰면 자동으로 블로그 포스트로 올라오게** 만들었다.

구성은 이렇다.

- `@notionhq/client` 로 Notion 데이터베이스를 읽고, `notion-to-md` 로 본문을 마크다운으로 변환
- `scripts/notion-sync.js` 가 각 페이지의 제목·날짜·카테고리·태그 속성을 프론트매터로 만들어 `_posts` 에 저장
- GitHub Actions(`notion-sync.yml`)가 **30분마다** 실행되어, 변경이 있으면 커밋·푸시하고 Pages 배포까지 트리거

```yaml
on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch:
```

동기화 스크립트는 `npm run sync` 하나로 돌아간다.

```json
"scripts": {
  "sync": "node scripts/notion-sync.js"
}
```

### 삽질 포인트

Notion 속성 이름을 코드에서 정확히 매칭해야 하는데, 대소문자나 공백이 조금만 달라도 값을 못 읽었다. 그래서 속성 이름 매칭을 **대소문자·공백 무시** 방식으로 바꿔서 안정적으로 읽히게 했다.

## 마무리

이제 Notion에 글만 쓰면 30분 안에 블로그에 자동으로 올라온다. 마크다운 파일을 직접 건드릴 일이 거의 없어졌다.

- 글은 Notion에서 편하게 쓰기
- 나머지(변환·커밋·배포)는 자동
- 디자인은 천천히 다듬기

완벽하지 않아도 일단 굴러가는 파이프라인이 만들어진 게 좋다. 여기서부터 천천히.
