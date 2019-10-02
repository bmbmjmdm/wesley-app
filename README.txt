If android is giving you trouble because it can't create or delete some random path, try deleting the cache at wesleyapp\android\build\intermediates\dex-cache

When npm installing you'll probably need to change node_modules/react-native-gesture-handler/android/build.gradle where it uses the word "compileOnly" and change it to "compile"

FOR WHERE TO SAVE SOUNDS SO YOU CAN LOAD THEM
Android: Save your sound clip files under the directory android/app/src/main/res/raw. Note that files in this directory must be lowercase and underscored (e.g. my_file_name.mp3) and that subdirectories are not supported by Android.
iOS: Open Xcode and add your sound files to the project (Right-click the project and select Add Files to [PROJECTNAME])

If IOS cannot run simulator: 
https://github.com/facebook/react-native/issues/23282#issuecomment-476439080

If IOS is failing to build certain node_module files: (change the 0.3.5 to 0.3.4):
https://github.com/facebook/react-native/issues/21168#issuecomment-422431294