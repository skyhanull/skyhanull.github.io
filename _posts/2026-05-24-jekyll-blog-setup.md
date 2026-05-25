---
title: "Jekyll로 블로그 환경 세팅하기"
date: 2026-05-24 19:00:00 +0900
description: 로컬에서 Jekyll 블로그를 띄우기까지의 짧은 기록.
category: 개발
tags:
  - 백
  - jekyll
  - blog
  - setup
---

블로그를 만들고 싶다는 생각만 하다가, 드디어 로컬에서 Jekyll을 띄웠다.

## 했던 것

- `rbenv` 로 Ruby 3.3.5 설치
- `bundle install` 로 `github-pages` gem 설치
- `bundle exec jekyll serve` 로 로컬 서버 실행

생각보다 Ruby 버전 맞추는 게 제일 귀찮
았다. macOS 기본 Ruby(2.6)로는 최신 `github-pages` gem이 안 깔려서, `rbenv` 로 별도 버전을 따로 잡아줘야 했다.

## 앞으로

- 글을 짧게라도 자주 쓰기
- 디자인은 천천히 다듬기
- GitHub Pages로 배포해서 실제 도메인에 띄우기

완벽하지 않아도 일단 굴러가는 환경이 만들어진 게 좋다. 여기서부터 천천히.
