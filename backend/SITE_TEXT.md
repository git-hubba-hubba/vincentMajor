# Application text editing

Sign in as an administrator, open **Admin**, and scroll to **Edit application text**.
Choose a section, search for the existing wording, select a field, edit it, and
select **Save text**. **Reset to original** removes an override. Formatted headings
may have separate fields for each styled phrase.

Overrides are stored in the existing SQLite database in `site_text`; existing
database backups include them. Public visitors load overrides on opening the app
and when the browser window regains focus. Admin saves update the current app
immediately. Only the `admin` role can save changes. Text is plain text, limited
to 5,000 characters per field; HTML is rendered as text.

Posts, events, member details, business listings, and message bodies keep their
existing content editors. Site text editing changes labels and application copy
without changing navigation targets, permissions, or stored member content.

## Adding a field during development

Wrap new application copy with `SiteText` and a stable `contentKey`, then add the
same `{key, section, text}` record to `backend/siteText.json` and
`frontend/cms-arlington/cms-admin-arl/src/data/siteText.json`. Keep existing keys
when revising defaults so saved overrides remain connected. Both services keep
their own catalog to support deployment from their separate root directories;
the API regression test checks that the catalogs match.

For static arrays, `SiteText section="SectionName"` can resolve the field using
its original text. Use explicit keys for new fields when possible. `SiteText`
returns text without an extra HTML element, preserving its surrounding layout.

Run `node --test features.test.js` in `backend` and `npm run build` plus
`npx eslint src` in the frontend after making changes.
