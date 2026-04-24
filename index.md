---
title: Home
description: 개인 글과 작업 기록을 모아두는 블로그 홈
---

<section class="hero">
  <p class="eyebrow">Personal Blog</p>
  <h1>{{ site.title }}</h1>
  <p class="hero-copy">{{ site.description }}</p>
</section>

<section class="post-list">
  <h2>Latest Posts</h2>
  <ul>
    {% for post in site.posts %}
      <li>
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        <span>{{ post.date | date: "%Y.%m.%d" }}</span>
        {% if post.description %}
          <p>{{ post.description }}</p>
        {% endif %}
      </li>
    {% endfor %}
  </ul>
</section>
