# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

This is an Obsidian vault containing **Hebrew-language educational course materials** covering IT, cybersecurity, programming, and computer science topics. The content is written for teaching purposes with lectures, exercises, and solutions.

## Vault Structure

- **`קורסים/`** - Active courses (the main working directory), organized by topic:
  - `תכנות-בסיסי` - Basic programming (Python)
  - `ליבת-המחשב` - Computer core (assembly, C, OS internals)
  - `רשתות` - Networking
  - `צד-שרת` - Server-side development (API, DevOps, Node.js)
  - `מחקר-אנדרואיד` - Android security research
  - `בודק-חדירות` - Penetration testing
  - `פריצת-אתרים` - Web hacking
  - `לינוקס בסיסי` - Basic Linux
  - `ווינדוס בסיסי` - Basic Windows
- **`archive/`** - Older/English versions of courses with a similar structure
- **`images/`** - Pasted images (mostly PNG screenshots), referenced from notes via `![[Pasted image ...]]`
- **`.obsidian/`** - Obsidian app configuration (theme: Atom, dark mode)

## File Naming Conventions

Each course follows a strict hierarchical numbering pattern:

```
קורסים/<course-name>/<N - section>/<N.M - topic>/<N.M - topic - type>.md
```

Where **type** is one of:
- **הרצאה** (lecture) - Main teaching content
- **תרגול** (exercise) - Practice problems
- **פתרון** (solution) - Exercise solutions
- **פרויקט** (project) - Hands-on projects

Example: `תכנות-בסיסי/1 - פייתון בסיסי/1.2 - בסיס הבסיס/1.2 - בסיס הבסיס - הרצאה.md`

## Content Conventions

- All active course content is written in **Hebrew** (RTL)
- Notes use standard Obsidian markdown: `![[image]]` for embedded images, `[[wikilinks]]` for internal links
- Images are stored flat in `images/` with Obsidian's default `Pasted image YYYYMMDDHHMMSS.png` naming
- Course materials are educational - they explain concepts, provide code examples, and include exercises
- The archive contains English versions of some beginner courses with a slightly different naming scheme (`lecture.md`, `exercise.md`, `solution.md` instead of Hebrew suffixes)

## Communication

- In the terminal (Claude Code), communicate in **English** only (the terminal doesn't support RTL, so Hebrew appears reversed)
- When writing course content in files, write in **Hebrew**

## Website (MkDocs)

- Always run `mkdocs serve` after making website changes to preview them - it does NOT auto-reload, so you must restart it each time
- Never use `mkdocs build` - always use `mkdocs serve`

## When Editing Content

- Maintain Hebrew language and RTL text direction for active courses
- Follow the existing numbering scheme when adding new lessons
- Keep image references as `![[Pasted image ...]]` - Obsidian resolves these from the `images/` folder
- Do not restructure the directory hierarchy without explicit request - the numbering is integral to course flow
- Never use emojis
- Never use the long middle dash (em dash). Use a regular hyphen (-) instead
- When a sentence mixes Hebrew and English words, start the line with a Hebrew character first so Obsidian's auto-RTL detection works correctly
- When writing a heading that contains an English term, first write the Hebrew translation, then a hyphen, then the English term (e.g., `## הוק - hook`)
