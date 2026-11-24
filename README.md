# Moira:Studio

**From the first story pitch to a programme on air, with nothing to install but OBS.**

Moira:Studio is a newsroom and a studio director for small journalism teams:

- **Moira:Desk** — the newsroom: news conference, scripts, editorial checks and the running order.
- **Moira:Director** — a gallery screen in Chrome that plays the running order out through OBS:
  cameras, VTs, graphics and straps, with timings and a TAKE button.
- **Moira:Bridge** (optional) — a small local helper that lets Director cut a Blackmagic ATEM switcher.

**[Open the desk](https://moiranews.github.io/moirastudio/)** · **[Open Director](https://moiranews.github.io/moirastudio/director/director.html)** · You’ll need a newsroom code.

## Set up your own Studio

You need a free [Supabase](https://supabase.com) account, a GitHub account and, on the studio machine, [OBS](https://obsproject.com) and Chrome.

1. **Copy this repository** to your own GitHub account. It must be public for free GitHub Pages.
2. **Create a Supabase project.** In its SQL Editor, run `supabase-schema.sql`. It's safe to run again: that's how you upgrade.
3. **Turn on sign-in methods** under Authentication → Sign In / Providers: **Anonymous** (students and Director join with a code) and **Email** (admins and tutors).
4. **Connect the pages to your project:** put your project URL and publishable key in `config.js`. They're the only settings, and they're safe in public code: the database's access rules protect everything.
5. **Publish:** in your repository, Settings → Pages → Source: **GitHub Actions**. Each push to `main` deploys to `https://<you>.github.io/<repository>/`.
6. **Make yourself an admin:** in Supabase, Authentication → Users → Add user (tick *Auto Confirm User*), then run the two lines in the ADMIN section of `supabase-schema.sql`.
7. **Create a newsroom:** open `admin.html` on your site, sign in and choose **New newsroom** (type **TV**). Note its code: it's shown once.

Optional: the `link-preview` Edge Function (in `supabase/functions/`) fills in headlines when a BBC News or Manchester Evening News link is pitched. Deploy it with the Supabase CLI; without it, pitchers type the headline.

## Get a show on air

On the studio machine:

1. **OBS:** Tools → WebSocket Server Settings → enable it and set a password.
2. **Import the scenes:** Scene Collection → Import → `director/Moira_Director_scenes.json` (download it from your site or this repository), then switch to it.
   Put each camera or capture device in `CAM_1`, `CAM_2`, `CAM_3`, **below** `MOIRA_L3` (the strap).
3. **Sound:** add the presenter's mic under Settings → Audio as a global device, **not** inside a scene, or it goes silent during every VT.
4. **Media:** keep VTs and graphics in one folder on that machine, named as the desk's clip tags say (`FILE: 0423-FLOODS.mp4`).
5. **Open Director** from your site in Chrome. Click the cog:
   - **OBS:** the address (`ws://127.0.0.1:4455`), the password and the media folder, then **Connect**. Chrome may ask to allow access to devices on your local network: allow it.
   - **Newsroom:** enter the newsroom's code, choose the newsroom and **Follow**.

Space or F12 is TAKE. The running order updates from the desk as the team works.

**ATEM (optional):** install [Node.js](https://nodejs.org), then in `director/`: `npm install`, copy `bridge/config.example.json` to `bridge/config.json`, set `atemIp` and add your site's address to `allowedOrigins`, and run `npm run bridge`. In Director, cog → ATEM.

---

# Using Moira:Desk

**From the first story pitch to a bulletin ready for production.**

Moira:Desk is a shared editorial workspace for student newsrooms. It brings the news conference, script writing, editorial checks and running order together, so your team can see what is being proposed, what has been picked and what still needs work.

The running order drives the studio: Moira:Director plays it out through OBS.

**[Open Moira:Desk](https://moiranews.github.io/moirastudio/)** · You’ll need a newsroom code from your tutor or editor.

## Join your newsroom

Open the desk, enter your name and the code for your group, and you’re ready to work. There’s no separate student account or password to create.

Use the same browser to return to your newsroom. If you move to another computer or clear your browser’s saved data, you’ll need to join again. Keep your newsroom code within your group.

## Start with the news conference

The **Conference** tab gives the whole team a shared board for the morning meeting.

- **Pitch a story.** Add a short title (the slug), the angle in a line and who pitched it. Anyone in the newsroom can contribute.
- **Pitch from PA.** With PA Explore open in another window, drag a story's headline onto the pitch box. Its PA slug, headline line (as the angle) and link fill in; check and edit them, then press **+**. You can also copy a PA link and paste it into the box. The pitch is marked **PA**, and if it's picked the link stays with the story, beside the pitch brief in the script editor, so whoever writes it can follow it up. The link never goes into the script or the prompter. Only the slug, that line and the link are kept, not PA's story text. If a drop doesn't bring the headline across, type it in.
- **Follow up a BBC News or MEN story.** Paste (or drop) a BBC News or Manchester Evening News link into the pitch box. The story's headline fills the angle box (unless you've already typed one); add a slug, check the angle and your name, then press **+**. The pitch appears as a light red **FOLLOW-UP · BBC** or **FOLLOW-UP · MEN** card, showing the dates the page claims ("Page claims: published … / updated …"). Sites update these, so don't treat them as when the story happened. These are someone else's journalism, so the card stays red, and the producer sees **Pending** instead of **Pick**, until three questions are answered: *When did this actually happen?* (from the copy, not the page timestamp), *Who is the original source?* (not "BBC" or "MEN") and *What's new, or what's our angle?* Whoever pitched it, or the producer, answers them with the card's pencil, which can also fix the slug. Each answer needs at least 3 characters. Once answered, the card turns white, shows the answers and can be picked. The picked story's script starts with a **follow-up note** of these answers in [square brackets]: delete it once the story is written. If it's left in, it's treated as a production direction, not words to read.
- **Choose a producer.** The person leading the bulletin clicks **I’m the producer**. Everyone can see who is making the decisions.
- **Pick the stories.** The producer adds selected pitches to the running order and chooses how each will be covered. The pitch’s angle stays with the story as a writing brief.
- **Assign reporters.** New picks use the “Pitched by” name as their reporter. The producer can change or clear the Reporter field on a picked pitch, choosing a suggested name or typing another. Press Enter or leave the field to save. Close any open story editor before changing its assignment here.
- **Keep track of decisions.** Spike a pitch that isn’t going ahead, with an optional reason. An untouched picked story can be dropped back into the pitches if plans change.
- **Discuss feedback.** Notes from the executive producer (EP) appear alongside the pitches for the group to consider.

To hand over the producer role, choose **Step down** so someone else can take over. Your tutor can help if the producer is no longer available.

## Build the bulletin

Move to **Running order** to turn the selected stories into a programme.

Write scripts, add reporter and presenter names, choose story formats and set durations. Arrange the stories in the order you want them, then compare the total running time with your target.

The desk helps you keep track of the work:

- **Editorial checks** show which stories need checking, are checked OK or need more work.
- **Editing indicators** show who has a story open. One person edits a story at a time, while others work on different stories.
- **Timing estimates** help you judge how long a script will take to read, including any timed clips.
- **Floated stories** stay in the running order but are held out of the bulletin. Stories below **END OF PROGRAMME** are also held back from sending.

Save your changes before leaving a story. If a save fails, the editor keeps your text open and shows an error so you can retry.

## Read from the prompter

Choose **Prompter** at the top of the desk to open your newsroom’s scripts as an autocue in a new tab. It uses the same browser session, so join the newsroom on the desk first.

The prompter follows the running order above **END OF PROGRAMME**, leaving out floated stories. Clip cues and production directions appear alongside the words to read; straps are hidden. Adjust the text size and scrolling speed, jump between stories, or use full screen and mirroring for autocue glass. Press **Space** to scroll or pause.

On a phone, use the [mobile prompter](https://moiranews.github.io/moirastudio/prompt_mob.html). Enter your newsroom code directly; there is no need to open the desk first. It shows the whole bulletin above **END OF PROGRAMME**, excluding floated stories, with touch controls for scrolling speed and text size. Script changes wait until you pause. Touching the script pauses automatic scrolling so you can swipe to find your place.

Landscape uses a compact status bar and controls to leave more room for the script. Tap **⛶ Full screen** to enter browser full screen where supported, with only Start/Pause and **Show controls** left on screen. Where full screen is unavailable, the page offers to hide its own controls. On iPhone, use Safari’s **Share → Add to Home Screen**, leave **Open as Web App** on if shown, then launch the new icon to read without Safari’s toolbar and tabs. You may need to enter the newsroom code again in that app. **Show controls** returns to the normal layout and pauses scrolling.

**Keep screen awake**, under **Reading settings**, is on by default and also works while paused. The status at the top confirms whether the phone granted it. If the phone declines or releases it, use the retry button in settings; older browsers or power-saving settings may prevent it. Switching to another app pauses scrolling and releases the screen lock. Returning checks for current scripts and requests the lock again; tap **Start** to resume. Internet access is needed to join and fetch updates; if the connection drops, the page keeps the loaded text and displays a connection notice. Offline reopening is not supported.

Script updates wait until you pause, so live edits do not move the text mid-read. The prompter is read-only: its controls do not change the shared running order.

## Prepare scripts for production

Use **+ Clip**, **+ Strap** and **+ Direction** above the script to add clip details, on-screen names and production instructions. The **Blocks** preview shows how the script will be broken into production blocks.

**+ Clip** adds a filename to the clip tag, such as `FILE: 1122-FLOODS.mp4`. Export the clip into the studio's media folder under exactly that name. If the clip is already in the folder (an archive or agency clip, say), replace the suggestion with its filename. The director looks for that file, and a clip with no `FILE:` can't be played. To switch camera, put `[CAM 2]` on its own line.

The programme is every story above **END OF PROGRAMME**, leaving out floated stories and section headings.

## Social newsrooms

Some newsrooms make a short social media bulletin instead of a programme. Your administrator sets this when the newsroom is created: the **Running order** tab is marked **SOCIAL**.

A social running order starts with **INTRO** and **OUTRO**. Stories picked at conference, or added with **Add story**, go in above the outro. Drag a story by its handle (press and hold on a phone), or use the ▲ ▼ arrows, to move it; the bin deletes it, and you can rescue it again this session. The coloured dot is the editorial check. **Approx. runtime** is an estimate from the words and clip lengths, to the nearest 5 seconds.

The page has three columns: the running order, the story you've selected, and its picture plan (on a smaller screen they stack). Selecting a story shows it; click any of its fields, or **Edit**, to change it. Only one person can edit a story at a time, so **Save** or **Cancel** when you're done. A story can have up to 20 sections, so one item can also be a longer piece, such as an explainer, built from several blocks. For each section, write what's said, choose the **picture treatment** (presenter, presenter overlay, presenter split, dual footage, full footage or a graphic), add any **on-screen text** and the length of any **clip with sound**. Where the presenter is out of shot, the words are labelled **Voiceover**. The **picture plan** shows the 9:16 layout of the section you're working on, with its caption and credit. A word count shows whether a story is within the brief's 30–40 words.

**Media & credits** asks where the pictures come from (PA, your own footage, or elsewhere), a link, what it shows and the on-screen credit. For PA, tick **Newsroom Ready** and **No embargo** once you've checked them in PA Explore. Dual footage has two shots, each with its own source and credit. A story shows **Media ready** once everything is filled in. **Review** sets the editorial check and shows the script the desk saves from your sections: cues in [square brackets] appear on the prompter, and the on-screen text is kept off it.

**Production sheet** prints, or saves as a PDF, everything the person editing in CapCut or Edits needs: the order, each section's words and picture, clip lengths, on-screen text, sources and credits, with any missing credit flagged. After the table comes a storyboard: each section drawn as its picture-plan frame, with its picture, time and words underneath. **Captions (.srt)** downloads the words read out as a captions file to import into the video editor. It leaves out the [cues] and on-screen text, and its timings are estimates (with a gap for each clip's own sound), so line the captions up with the video in the edit.

## For tutors and executive producers

[Open the tutor desk](https://moiranews.github.io/moirastudio/tutor.html) and sign in with your staff email and password. You’ll see only the newsrooms your administrator has assigned to you.

Each newsroom has a card showing its producer, how the conference is going (pitched, picked, spiked and undecided), the running order and its running time, editorial checks (OK, needs work, to check and not checked yet, in the same colours as the running order) and how much EP feedback it has. The page refreshes itself every 30 seconds; the line beside the title shows when it last updated, or in red if a refresh failed. Use **List** for one row per newsroom, which is handy when you have many groups. Type in **Find a newsroom** to filter by name.

Tick newsrooms (click anywhere on a card’s heading) to work with several at once. A bar along the bottom of the screen shows what you’ve ticked and offers **Open EP wall**, **Send alert** and **Report…**. Ticks stay in place while you search, and **Select all** acts on the newsrooms showing.

If a student needs the newsroom code, choose **Join code** on the newsroom’s card. This displays a separate student join code enabled by your administrator; it does not reveal or change the main code. The button appears only when a tutor code is available.

The **EP wall** shows the ticked groups’ pitches side by side for discussion or projection, with undecided and picked pitches in separate groups and spiked pitches folded away. Click a pitch to add or change a note guiding the group, while the editorial decisions stay with each group’s producer. New pitches are marked **NEW** for 30 seconds. Along the top, the **source mix** counts how the pitches on the wall were added (**Original** for typed-in, **Wire** for PA, **Follow-up** for BBC News and MEN), with each newsroom's own mix under its name. Follow-up cards show **Answers missing** or **Ready**; click one to show its outlet, headline, "Page claims" dates and three answers in large type for the room (Esc or a click closes it, and **Add EP note** is there too). This works in Present mode as well. Click a newsroom’s name to focus on it in larger type, then use **←** and **→** to move between groups and **Esc** to return to all of them. **A+** and **A−** change the text size. **Hide notes** takes your notes off the projected wall, though students still see them. **Present** (or **P**) hides the controls and stops clicks opening notes during the meeting; **Show controls** or **P** brings them back.

To call groups back or share a quick update, tick their newsrooms and choose **Send alert**. Messages can be up to 240 characters. Students receive a live alert that stays until dismissed, with a short chime when their browser allows sound. Students joining within five minutes can also see the latest alert.

After a session, choose **Review & feedback** on a newsroom’s card to read its running order and scripts from top to bottom and leave EP feedback, either on the bulletin as a whole or on a story. To quote part of a script, select the words before choosing **Add feedback**. It appears as “EP” feedback in the newsroom’s report, not on the student desk, so share the report with the group afterwards. Any tutor assigned to the newsroom can edit or delete any feedback.

Choose **Report** on a card for one newsroom, or **Report…** in the bottom bar for every ticked newsroom. The report is a shareable page with each newsroom's source mix and pipeline (pitched, promoted, in the running order), the pitches, decisions and EP notes, every follow-up in full (outlet, headline, link, "Page claims" dates and the three answers word for word), the PA pitches with their links, the running order and EP feedback; tick **Include scripts** to add the scripts. Use it for a debrief or to keep a record of the session. Generate the report before starting a new conference, as earlier pitches leave the current board and report.

To hand newsrooms to a new group, tick them and choose **Reset…**. This starts a new conference, frees the producer role, deletes every story and script, removes all members and clears the EP alert. A social newsroom goes back to just its intro and outro. The name, type (TV or social), join codes and tutors stay, so old members could rejoin with the same code. Choose **Make a report first** in the dialog if you want a record, as a reset can't be undone.

Your administrator manages staff access, starts fresh conferences, resets producer roles, clears running orders and changes join codes. Ask them if a newsroom or join code is missing. On a shared computer, sign out of the tutor desk when you finish.

## Finishing on a shared computer

Save your work, then choose **Sign out** beside your name to remove your name and newsroom access from that browser. Signing out also releases any producer roles and editing locks held by that browser, including in other tabs. This does not delete your team’s stories. You’ll need the newsroom code to join again.

## Feedback and help

Found a problem, have a suggestion, or want to share how Moira:Desk worked in your newsroom?

**[Email Andy Dickinson at a.dickinson@mmu.ac.uk](mailto:a.dickinson@mmu.ac.uk?subject=Moira%3ADesk%20feedback)**

If you’re reporting a problem, include what you were trying to do, what happened and any error message. For help joining your current session, ask your tutor or editor for the newsroom code.
