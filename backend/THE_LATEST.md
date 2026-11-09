# The Latest

The blue homepage card opens the Community feed with **The Latest** selected.
It is the first category and shows updates newest first, including older updates.
The Youth filter has been removed; its existing posts remain in All.

To publish an update, sign in as an administrator, open **Community → Create post**,
and select **The Latest**. Add a title, message, and either a video link or an
MP4/WebM upload (up to 20 MB and one hour). Publish a new post for each daily
update to preserve the archive. Cover images are optional. Visitors can watch
without signing in; likes, comments, and shares use the existing member controls.

Supported links are YouTube (including Shorts), Vimeo, direct MP4/WebM/MOV files,
and Cloudinary video URLs. Embedding must be allowed by the video's host. A link
to open the original video is provided beside each player. Production uploads use
the existing Cloudinary cloud name and unsigned upload preset; that preset must
permit video uploads. External links work without uploading a file.

On the first backend start after upgrading, the schema migration adds `video_url`
and moves existing admin-authored Community posts containing recognizable video
links to The Latest. It preserves post IDs, authors, dates, likes, comments, and
shares. It runs once. Posts using unsupported hosts or plain text references can
be moved manually: edit the post, select The Latest, and add a supported video
link. No production content is accessed or changed by local development.

The Admin Posts editor also supports the new category and video URL. To upload a
file, use the Community post editor. Backend and frontend keep identical video
link parsers inside their service roots, since each deploys independently. The
video tests check that those copies match.
