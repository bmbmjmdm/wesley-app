For where to save AUDIO so you can load them
Android: Save your sound clip files under the directory android/app/src/main/res/raw. Note that files in this directory must be lowercase and underscored (e.g. my_file_name.mp3) and that subdirectories are not supported by Android.
iOS: Open Xcode and add your sound files to the project (Right-click the project and select Add Files to [PROJECTNAME])

For IMAGES of words: do not exceed 1MB per picture or lag may occur in transitions/etc

If IOS cannot run simulator: 
https://github.com/facebook/react-native/issues/23282#issuecomment-476439080

For IOS: 
Run 'pod install' in iOS folder
Then open the workspace package (not project package) and run it targeting tethered device

(Might be deprecated since upgrade) If IOS is failing to build certain node_module files: (change the 0.3.5 to 0.3.4):
https://github.com/facebook/react-native/issues/21168#issuecomment-422431294

If ANDROID is giving you trouble because it can't create or delete some random path, try deleting the cache at wesleyapp\android\build\intermediates\dex-cache

When NPM installing:
-change node_modules/logkitty/build/android/adb.js line 34 to (0, _child_process.execSync)(`"${adbPath}" logcat -c`);
-you'll probably need to change node_modules/react-native-sound/android/build.gradle where it uses the word "compileOnly" and change it to "compile"
-update this function in node_modules\react-native-audio\android\src\main\java\com\rnim\rn\audio\AudioRecorderManager.java
  private void startTimer(){
    timer = new Timer();
    timer.scheduleAtFixedRate(new TimerTask() {
      @Override
      public void run() {
        if (!isPaused) {
          WritableMap body = Arguments.createMap();
          int maxAmplitude = 0;
          if (recorder != null) {
            maxAmplitude = recorder.getMaxAmplitude();
          }
          body.putInt("currentMetering", maxAmplitude);
          body.putDouble("currentTime", stopWatch.getTimeSeconds());
          sendEvent("recordingProgress", body);
        }
      }
    }, 0, 100);
  }
-fix this file's imports: react-native-audio\android\src\main\java\com\rnim\rn\audio\AudioRecorderManager.java
  line 30: import android.support.v4.app.ActivityCompat -> import androidx.core.app.ActivityCompat
  line 31:import android.support.v4.content.ContextCompat -> import androidx.core.content.ContextCompat











saved dev commands:

Wesley App
*react-native run-android
*react-native log-android
*react-native run-android --variant=release
*mp4 to gif: giphy.com + ezgif.com
*react-native bundle --platform android --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res/
==use "--dev false" for release (probably need to delete android/app/src/main/res/"drawable-mdpi" as well as "app.json" in raw)
==use "--assets-dest android/app/src/main/res/" for dev
-for release, invalidate cache in android studio and delete everything in android/app/build, then restart AS and clean