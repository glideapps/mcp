# Listing assets

Everything uploaded to the Partner Center offer alongside the app package.

| File | Where it goes | Spec |
| --- | --- | --- |
| `marketplace-icon-300.png` | Marketplace listings → Marketplace icon | 300x300, under 512 KB |
| `screenshot-1-confirmation.png` | Marketplace listings → Screenshots, first | 1366x768, under 1024 KB |
| `screenshot-2-projects.png` | Screenshots, second | " |
| `screenshot-3-database.png` | Screenshots, third | " |
| `screenshot-4-created.png` | Screenshots, fourth | " |
| `screenshot-5-app.png` | Screenshots, fifth | " |
| `glide-testing-instructions.pdf` | Additional certification info | PDF, persists across submissions |

The confirmation screenshot leads because Agent Store validation guideline 9 grades
disclosure and confirmation for actions, and that shot is the direct evidence.

Screenshots were captured against the reviewer org on 2026-09-21, after the test agent
was renamed to **Glide** and given the package icons so the name and logo match the
listing. Browser chrome, the signed-in user's name, and one production URL naming the
internal test org were cropped or masked. No product content was altered.

`glide-testing-instructions.pdf` is the illustrated form of `../TEST-NOTES.md`. **It still
carries the three credential placeholders** — regenerate it with the real reviewer account
before uploading, or upload the notes without it. Microsoft's guidance is explicit that
reviewers cannot contact the publisher for sign-in details and that a submission without
clear instructions fails automatically.
