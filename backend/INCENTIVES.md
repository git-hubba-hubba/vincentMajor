# New-user reward point incentives

| Activity | Points | How points are awarded |
| --- | ---: | --- |
| Visit website | 25 | Automatically on the first signed-in visit |
| Visit business | 50 | Admin-issued incentive code |
| Make purchase from business | 100 | Admin-issued incentive code |
| Watch video | 25 | Admin-issued incentive code |
| Attend event | 100 | Existing event attendance code; 100 is the default award |
| Find Vincent | 500 | Admin-issued incentive code |
| Register on site | 100 | Automatically when a new account is registered |

Each new-user incentive can be earned once per member, even when different
codes are used. Event attendance keeps its existing once-per-event rule and
admin-configured point amounts. Existing accounts do not receive a retroactive
registration bonus.

Open **Rewards** to view the schedule and enter a claim code. Administrators can
open **Admin → Reward point claim codes** to create, activate, or deactivate
codes and download QR images. Share codes after confirming the activity. QR
images are generated locally; their links open the site's claim form with the
code already filled in. Claims require sign-in and explicit submission.

The site does not track purchases, video completion, or physical location;
possession of an admin-issued code is the verification method for those bonuses.
Code claims, balance updates, and notifications are saved in one transaction.
Point values are defined in `incentives.js`; the client cannot choose the award.

The existing database automatically gains `incentive_codes` and
`incentive_claims` on backend startup. Run `node --test features.test.js` to check
the amounts, automatic bonuses, authorization, disabled codes, replay
protection, and existing reward redemption behavior.
