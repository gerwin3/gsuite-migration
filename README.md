# GSuite Migration Scripts

### Overview

This repository contains a Google Apps Script to help you migrate personal Google Drive folders to a Shared Drive in G Suite.

**Use this script at YOUR OWN RISK. I am not responsible for any loss of data as a result of using this script, obviously. ALWAYS backup all your data before starting the transfer. ALWAYS read and understand the script before running it yourself. NEVER run this script on any Google account that contains sensitive or important data.**

### Usage

1. Create a shared drive on the target G Suite account and add your personal account as "Manager" to it.
2. Create a Google Apps Script on [script.google.com](http://script.google.com). Make sure to create and execute the script from your personal account.
3. Copy in the script.
4. Add the scopes: `https://www.googleapis.com/auth/drive` and `https://www.googleapis.com/auth/drive.apps.readonly`.
5. [Enable advanced Google Drive services](https://developers.google.com/apps-script/guides/services/advanced).
6. Configure the settings in the top of the script.
7. Execute `transferFromFolderToSharedDrive`.

### Important Notes

* For all files in the source folder of which you (the one executing the transfer script) are the owner, it will move them and keep metadata, revision history and comments.
* For files that you are not the owner of, you can choose to copy them instead of moving or skip them altogether (through the `COPY_IF_MOVE_FAILS` setting). The source file will be tagged with `[DEPRECATED] [DO NOT USE]`. You should remove them yourself.
* The script can be stopped and reran and it should continue without any loss of data. This is useful if you run into the execution limit. Just keep running the script until it completes and prints "Transfer completed.".
* If you keep hitting the execution limit, you can manually split up the transfer by starting with subfolders. Manually create the subfolder on the target and set the subfolder source and target correctly.
* The script will skip any files that have the string `[DEPRECATED]` in their name. The script can also be programmed to exclude certain folders.