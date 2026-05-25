---
title: Home
description: 개인 글과 작업 기록을 모아두는 블로그 홈
---

<section class="article-list">
  {% for post in site.posts %}
    <article class="article-item">
      <div class="article-meta">
        {% if post.category %}
          <span class="article-category">{{ post.category }}</span>
          <span class="article-dot">•</span>
        {% endif %}
        <span class="article-date">{{ post.date | date: "%B %d, %Y" }}</span>
        {% if post.content %}
          {% assign words = post.content | number_of_words %}
          {% assign read_time = words | divided_by: 200 | plus: 1 %}
          <span class="article-dot">•</span>
          <span class="article-readtime">{{ read_time }} min read</span>
        {% endif %}
      </div>
      <h2 class="article-title">
        <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      </h2>
      {% if post.description %}
        <p class="article-excerpt">{{ post.description }}</p>
      {% else %}
        <p class="article-excerpt">{{ post.content | strip_html | truncate: 160 }}</p>
      {% endif %}
      <div class="article-author">
        <span class="article-author-avatar" aria-hidden="true">{{ site.author.name | default: site.title | slice: 0, 1 | upcase }}</span>
        <span class="article-author-name">{{ site.author.name | default: site.title }}</span>
      </div>
    </article>
  {% endfor %}
</section>

{% if site.posts.size == 0 %}
  <p class="empty-state">아직 작성된 글이 없습니다.</p>
{% endif %}
