# Card signature

A project card is a dark poster for a GitHub profile README: a picture at the top that fades into the card,
a serif headline, one or two lines on what the project gives the user, a pill button and a row of icons.
One `card.png` serves both GitHub themes: its dark body stands out on white, and transparent rounded
corners with a faint light ring keep its edge on GitHub's dark background.

<img src="cards/obsidian-hovered-table-of-content/card.png" width="250" alt="Example: the Hovered Table of Content card">

## ProjectCard

Each project has one `cards/<slug>/card.json`. Its shape is the `ProjectCard` type in
[`src/card.ts`](src/card.ts) and the JSON Schema in [`schema/card.schema.json`](schema/card.schema.json):

```ts
interface ProjectCard {
  version: 1;
  repository: string; // GitHub owner/name of the project; the card links there
  headline: string;   // project name with a dot, at most 2 lines (~44 chars)
  sub: string;        // what it gives the user, at most 2 lines (~120 chars)
  cta: string;        // pill button, usually "View on GitHub"
  owner: string;      // bottom left, usually the GitHub user
  icons: CardIcon[];  // up to 3, bottom right
  image: {
    x: number;        // 0–100, horizontal focus
    y: number;        // 0–100, vertical focus
    zoom: number;     // 100–220
    height: number;   // 45–72, share of the card the picture covers
  };
}

type CardIcon = 'obsidian' | 'typescript' | 'plugin' | 'javascript' | 'css' | 'markdown'
  | 'react' | 'nodedotjs' | 'python' | 'ruby' | 'github';
```

Next to `card.json` lies the picture, `art.png` (or `.jpg`, `.webp`), and the rendered `card.png`.

Icon marks come from [simple-icons](https://simpleicons.org) (CC0). To add one, put its name and path
into [`src/icons.ts`](src/icons.ts) and its key into the `enum` in the schema; the tests check both agree.

## Design

| | |
| --- | --- |
| Canvas | 750 × 1050 PNG (5:7), transparent corners, shown at `width="250"` |
| Background | `#191c22`, text `#f3efe6`, subtitle at 70 % and footer at 82 % opacity |
| Edge | 2 px inner ring, `rgba(255, 255, 255, .1)`, radius 26 px |
| Picture | Full width, top 57 % by default (750 × 598 lands 1:1), fades into the background from its middle |
| Headline | Playfair Display 400, 64 px, line height 1.06, balanced, at most 2 lines |
| Subtitle | Instrument Sans 400, 26 px, line height 1.4, at most 2 lines |
| Button | Instrument Sans 24 px in a 1.5 px outline pill with a ↗ arrow |
| Footer | Owner on the left; icons at 42 px separated by ✦ sparks on the right, 36 px from the bottom |

`npm run render` refuses a card whose headline or sub runs past 2 lines or whose text runs into the footer.

## Writing the copy

- **headline**: the project name, ending with a dot: `Hovered Table of Content.`
- **sub**: one or two plain sentences about what the user gets, not how it is built.
- **cta**: what the button does, usually `View on GitHub`.
- **icons**: platform first, then language, then kind of project.
- **image**: a screenshot or illustration with its subject in the middle, about 750 × 600 px.
  A dark picture blends best; start from `{ "x": 50, "y": 50, "zoom": 100, "height": 57 }`.

## Asking Claude for a card

> Make a ProjectCard `card.json` for the GitHub repository OWNER/NAME, following SIGNATURE.md and
> schema/card.schema.json in itsNikolay/itsNikolay. Read the repository's README and package metadata.
> The headline is the project name with a dot; the sub is one or two plain sentences on what it gives
> the user, at most 120 characters; the cta is "View on GitHub"; the owner is OWNER; pick up to 3 icons
> from the schema. Start the image at { "x": 50, "y": 50, "zoom": 100, "height": 57 }. Answer with the JSON only.
