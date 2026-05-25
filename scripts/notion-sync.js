import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";
import https from "node:https";
import crypto from "node:crypto";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
  console.error("✗ NOTION_TOKEN / NOTION_DATABASE_ID 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const POSTS_DIR = "_posts";
const ASSETS_DIR = "assets/images/posts";
const SITE_BASEURL = process.env.JEKYLL_BASEURL || "";

const notion = new Client({ auth: NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

await fs.mkdir(POSTS_DIR, { recursive: true });
await fs.mkdir(ASSETS_DIR, { recursive: true });

function getProp(props, name) {
  return props[name];
}

function getTitle(props) {
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (p?.type === "title") return p.title?.[0]?.plain_text || "";
  }
  return "";
}

function getDate(props) {
  const candidates = ["날짜", "Date", "date"];
  for (const k of candidates) {
    if (props[k]?.date?.start) return props[k].date.start;
  }
  return new Date().toISOString();
}

function getSelectValue(prop) {
  if (!prop) return null;
  if (prop.type === "select") return prop.select?.name || null;
  if (prop.type === "status") return prop.status?.name || null;
  return null;
}

function getStatus(props) {
  const candidates = ["상태", "Status", "status"];
  for (const k of candidates) {
    const v = getSelectValue(props[k]);
    if (v) return v;
  }
  return null;
}

function getCategory(props) {
  const candidates = ["카테고리", "Category", "category"];
  for (const k of candidates) {
    const v = getSelectValue(props[k]);
    if (v) return v;
  }
  return null;
}

function getTags(props) {
  const candidates = ["태그", "Tags", "tags"];
  for (const k of candidates) {
    const p = props[k];
    if (p?.type === "multi_select") {
      return (p.multi_select || []).map((t) => t.name);
    }
  }
  return [];
}

function getRichText(props, candidates) {
  for (const k of candidates) {
    const p = props[k];
    if (!p) continue;
    if (p.type === "rich_text") {
      return (p.rich_text || []).map((r) => r.plain_text).join("");
    }
    if (p.type === "title") {
      return (p.title || []).map((r) => r.plain_text).join("");
    }
  }
  return "";
}

function slugify(str, fallback) {
  if (!str) return fallback;
  const cleaned = str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return cleaned || fallback;
}

function escapeYaml(str) {
  if (!str) return "";
  return String(str).replace(/"/g, '\\"').replace(/\n/g, " ");
}

async function fetchAllPublished() {
  const results = [];
  let cursor = undefined;
  do {
    const resp = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
    });
    results.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);
  return results.filter((page) => {
    const status = getStatus(page.properties);
    return status === "Published";
  });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fssync.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadImage(res.headers.location, dest).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", reject);
  });
}

function extToFromUrl(url) {
  try {
    const u = new URL(url);
    const ext = path.extname(u.pathname).toLowerCase();
    if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(ext)) return ext;
  } catch (_) {}
  return ".png";
}

async function localizeImages(markdown, pageId) {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const tasks = [];
  const replacements = [];
  let match;
  while ((match = re.exec(markdown)) !== null) {
    const [full, alt, url] = match;
    if (!/^https?:\/\//.test(url)) continue;
    if (!url.includes("notion") && !url.includes("amazonaws")) continue;
    const ext = extToFromUrl(url);
    const hash = crypto.createHash("md5").update(url.split("?")[0]).digest("hex").slice(0, 10);
    const filename = `${pageId.replace(/-/g, "").slice(0, 8)}-${hash}${ext}`;
    const localPath = path.join(ASSETS_DIR, filename);
    const publicPath = `/${ASSETS_DIR}/${filename}`;
    replacements.push({ full, alt, publicPath });
    if (!fssync.existsSync(localPath)) {
      tasks.push(
        downloadImage(url, localPath).catch((err) => {
          console.warn(`  ! 이미지 다운로드 실패: ${err.message}`);
        })
      );
    }
  }
  await Promise.all(tasks);
  for (const r of replacements) {
    markdown = markdown.replace(r.full, `![${r.alt}](${SITE_BASEURL}${r.publicPath})`);
  }
  return markdown;
}

async function syncPage(page) {
  const props = page.properties;
  const title = getTitle(props);
  if (!title) {
    console.warn(`  ! 제목 없는 페이지 건너뜀: ${page.id}`);
    return;
  }
  const dateIso = getDate(props);
  const dateOnly = dateIso.split("T")[0];
  const category = getCategory(props);
  const tags = getTags(props);
  const slugRaw = getRichText(props, ["슬러그", "Slug", "slug"]);
  const description = getRichText(props, ["설명", "Description", "description"]);
  const slug = slugify(slugRaw, page.id.replace(/-/g, "").slice(0, 12));
  const filename = `${dateOnly}-${slug}.md`;
  const filepath = path.join(POSTS_DIR, filename);

  const mdBlocks = await n2m.pageToMarkdown(page.id);
  const mdResult = n2m.toMarkdownString(mdBlocks);
  let body = mdResult.parent || "";
  body = await localizeImages(body, page.id);

  const fmLines = [
    "---",
    `title: "${escapeYaml(title)}"`,
    `date: ${dateIso}`,
  ];
  if (description) fmLines.push(`description: ${escapeYaml(description)}`);
  if (category) fmLines.push(`category: ${category}`);
  if (tags.length > 0) {
    fmLines.push("tags:");
    for (const t of tags) fmLines.push(`  - ${t}`);
  }
  fmLines.push(`notion_id: ${page.id}`);
  fmLines.push("---", "", "");
  const content = fmLines.join("\n") + body.trim() + "\n";

  await fs.writeFile(filepath, content, "utf8");
  console.log(`  ✓ ${filename}`);
}

async function cleanupRemovedPosts(currentNotionIds) {
  const files = await fs.readdir(POSTS_DIR);
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    const full = path.join(POSTS_DIR, file);
    const text = await fs.readFile(full, "utf8");
    const match = text.match(/^notion_id:\s*([a-f0-9-]+)\s*$/m);
    if (!match) continue;
    const id = match[1].trim();
    if (!currentNotionIds.has(id)) {
      await fs.unlink(full);
      console.log(`  - 삭제 (Notion에서 제거됨): ${file}`);
    }
  }
}

console.log("→ Notion DB에서 Published 글 가져오는 중...");
const pages = await fetchAllPublished();
console.log(`  ${pages.length}개 발견`);

for (const page of pages) {
  await syncPage(page);
}

const currentIds = new Set(pages.map((p) => p.id));
await cleanupRemovedPosts(currentIds);

console.log("✓ 동기화 완료.");
