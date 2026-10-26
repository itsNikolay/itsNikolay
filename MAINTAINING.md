# Maintaining the GitHub profile

GitHub renders README.md on the itsNikolay profile because this public repository matches the account name.
The page is a header and a row of project cards, each in a dark and a light version for GitHub's two themes.
SIGNATURE.md describes both.

## Add a project

1. `npm run new -- owner/name` starts `cards/<slug>/card.json`. Write its copy as SIGNATURE.md says.
   For a private repository or a store listing, set `link` to the page the card should open.
2. Save a screenshot as `cards/<slug>/art.png`, about 750 × 600 px. A light screenshot as `art-light.png` is optional.
3. `npm run render` renders the cards and the header and updates cards/README.md.
4. Paste the card's snippet from cards/README.md into the paragraph of its platform's section in README.md,
   most important project first. Separate cards with `&nbsp;&nbsp;`; three fit in a row. A new platform gets
   its own section: an `<h3 align="center">` with the platform's name above a `<p align="center">` of cards.

## Change the header

Edit `header/header.json` and run `npm run render`.

Keep the copy in English and the links working. Avoid counters, stats and other externally generated widgets
so the page stays quiet, fast and stable.
