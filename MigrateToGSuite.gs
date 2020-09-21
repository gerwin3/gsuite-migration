/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Please configure by entering settings below:
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

// If set to true, the script will output only what it will do without
// actually doing it. This can be helpful to do a sanity check before
// actually executing the script.
var DRY = false;

// If set to true, the script will only recreate the folder structure
// on the target.
var FOLDERS_ONLY = false;

// The script will first try to move (reroot) the file into the target.
// If you are not the owner of the file, this will fail. In this case
// the script can copy the file instead of moving. In this case you 
// will lose metadata, revision history, comments, etc. Set to true
// to enable this behavior.
var COPY_IF_MOVE_FAILS = false;

// Folder ID of root source directory.
var ROOT_SRC_FOLDER = "";

// Folder ID of root target directory.
var ROOT_DST_FOLDER = "";

// List of folder names to exclude from transfer. Note: use folder *names*
// instead of folder IDs here.
var EXCLUDE_FOLDERS = [""];

/* - - - - - - - - - - - - end of settings - - - - - - - - - - - - - - - - */


/*
 * This is the main entry point of the script that you should invoke!
 */
function transferFromFolderToSharedDrive() {
  var rootFolderSrc = DriveApp.getFolderById(ROOT_SRC_FOLDER);
  var rootFolderDst = DriveApp.getFolderById(ROOT_DST_FOLDER);
  transferFromFolderToSharedDriveRecursive(rootFolderSrc, rootFolderDst);
  Logger.log("Transfer completed.");
}

function transferFromFolderToSharedDriveRecursive(parentSrc, parentDst) {
  if (!FOLDERS_ONLY) {
    /* Loop through subfiles and move each of them into the corresponding dst
       directory (keeping history etc.) */
    var subfilesSrc = parentSrc.getFiles();
    while (subfilesSrc.hasNext()) {
      var subfileSrc = subfilesSrc.next();
      if (parentDst.getFilesByName('[DEPRECATED] [DO NOT USE] ' + subfileSrc.getName()).hasNext()) {
        Logger.log("[TRANSFER] Skipping file " + subfileSrc.getName() + " (in folder " + parentSrc.getName() + ") because it already exists in target.");
        continue;
      }
      if (subfileSrc.getName().indexOf('[DEPRECATED]') > -1) {
        Logger.log("[TRANSFER] Skipping file " + subfileSrc.getName() + " (in folder " + parentSrc.getName() + ") because it is deprecated.");
        continue; 
      }
      if (!DRY) {
        try {
          subfileSrc.moveTo(parentDst);
          Logger.log("[TRANSFER] Moved file " + subfileSrc.getName() + " (in folder " + parentSrc.getName() + ") from source to target.");
        } catch (e) {
          /*
            Note: can use this try-catch block to also try patching instead of moving.
          
            try {
              var subfileSrc2 = Drive.Files.get(subfileSrc.getId(), {supportsTeamDrives: true});
              Drive.Files.patch(subfileSrc2, subfileSrc.getId(), {
                removeParents: subfileSrc2.parents.map(function(p) { return p.id; }),
                addParents: [parentDst.getId()],
                supportsAllDrives: true
              });
              Logger.log("[TRANSFER] Patched file " + subfileSrc.getName() + " (in folder " + parentSrc.getName() + ") from source to target.");
            } catch (e2) {
              
            }
          */
          
          // We can choose to copy the file if moving does not work (for example, if
          // the original file owner is not the one logged in and running the script).
          // Note that this will cause revision history, comments and other metadata
          // to be lost on the target file.
          if (COPY_IF_MOVE_FAILS) {
            var subfileDst = subfileSrc.makeCopy(parentDst);
            // For some reason, the `makeCopy` function appends a 'Copy of ' prefix,
            // even if the file is copied to a different parent folder. We fix that
            // manually here, because it also breaks recontinuation.
            if (subfileDst.getName().indexOf('Copy of ') > -1) {
              subfileDst.setName(subfileDst.getName().split('Copy of ')[1]);
            }
            // Rename old file with and tag [DEPRECATED]
            subfileSrc.setName('[DEPRECATED] [DO NOT USE] ' + subfileSrc.getName());
            
            Logger.log("[TRANSFER] Copied file " + subfileDst.getName() + " (in folder " + parentSrc.getName() + ") from source to target.");
          } else {
            Logger.log("[TRANSFER] ** ISSUE ** Skipped file because caller is not owner: " + subfileSrc.getName() + " (in folder " + parentSrc.getName() + ") from source to target.");
          }
        }
      } else {
        Logger.log("[TRANSFER] Would try to move file " + subfileSrc.getName() + " (in folder " + parentSrc.getName() + ") from source to target.");
      }
    }
  }
  
  /* Loop through subfolders, for each folder, recreate the subfolders from
     src into dst and recurse into them. */
  var subfoldersSrc = parentSrc.getFolders();
  while (subfoldersSrc.hasNext()) {    
    var subfolderSrc = subfoldersSrc.next();
    if (EXCLUDE_FOLDERS.indexOf(subfolderSrc.getName()) != -1) {
      Logger.log("[TRANSFER] Skipping folder " + subfolderSrc.getName() + " because it is in the exclude list.");
      continue;
    }
    // We just set dst = src for dry runs, since we do not actually create
    // the destination folder
    var subfolderDst = subfolderSrc;
    if (!DRY) {
      var subfolderDstIterator = parentDst.getFoldersByName(subfolderSrc.getName());
      // Check if the target folder doesn't already exist (in case of reruns for example).
      if (subfolderDstIterator.hasNext()) {
        // It already exists, we use the existing one.
        Logger.log("[TRANSFER] Use existing folder " + subfolderSrc.getName() + " in " + parentSrc.getName() + " on target.");
        subfolderDst = subfolderDstIterator.next();
      } else {
        // Didn't exist yet, create it!
        Logger.log("[TRANSFER] Create folder " + subfolderSrc.getName() + " in " + parentSrc.getName() + " on target.");
        subfolderDst = parentDst.createFolder(subfolderSrc.getName());
      }
    }
    transferFromFolderToSharedDriveRecursive(subfolderSrc, subfolderDst);
  }
}